import logging
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler

from .db import DB
from .events import EventBus
from .publishers.base import Publisher

log = logging.getLogger(__name__)


@dataclass
class Job:
    queue_id: int
    video_id: int
    video_path: Path
    caption: str
    hashtags: list[str]
    is_repost: bool = False
    retry_count: int = 0


@dataclass
class PlatformQueue:
    publisher: Publisher
    jobs: deque[Job] = field(default_factory=deque)
    paused: bool = False


class PostScheduler:
    """Drip-posts jobs to each platform respecting daily caps and min spacing.
    Queue is persisted in SQLite so it survives restarts.

    Failed jobs are retried up to max_retries times before being dead-lettered
    (removed from queue and a dead_letter event emitted).
    """

    def __init__(
        self,
        db: DB,
        publishers: list[Publisher],
        max_per_day: int,
        min_minutes_between: int,
        jitter_minutes: int,
        events: Optional[EventBus] = None,
        max_retries: int = 5,
    ):
        self.db = db
        self.queues = {p.name: PlatformQueue(publisher=p) for p in publishers}
        self.max_per_day = max_per_day
        self.min_minutes_between = min_minutes_between
        self.jitter_minutes = jitter_minutes
        self.events = events or EventBus()
        self.max_retries = max_retries
        self._lock = Lock()
        self.scheduler = BackgroundScheduler(timezone="UTC")

    def hydrate_from_db(self) -> int:
        """Rebuild in-memory queues from the persisted queue table on startup."""
        rows = self.db.queue_all()
        loaded = 0
        for row in rows:
            platform = row["platform"]
            if platform not in self.queues:
                continue
            path = Path(row["video_path"])
            if not path.exists():
                self.db.queue_delete(row["id"])
                continue
            self.queues[platform].jobs.append(Job(
                queue_id=row["id"],
                video_id=row["video_id"],
                video_path=path,
                caption=row["caption"] or "",
                hashtags=(row["hashtags"] or "").split(),
                is_repost=bool(row["is_repost"]),
            ))
            loaded += 1
        if loaded:
            self.events.publish("queue.hydrated", f"restored {loaded} queued jobs from db",
                                count=loaded)
        return loaded

    def enqueue(self, video_id: int, video_path: Path, caption: str, hashtags: list[str],
                is_repost: bool = False, platforms: list[str] | None = None) -> list[int]:
        ids = []
        with self._lock:
            targets = platforms or list(self.queues.keys())
            for p in targets:
                if p not in self.queues:
                    continue
                if self.db.video_already_posted(video_id, p) and not is_repost:
                    continue
                qid = self.db.queue_insert(
                    video_id=video_id, platform=p, video_path=str(video_path),
                    caption=caption, hashtags=" ".join(hashtags), is_repost=is_repost,
                )
                if qid is None:
                    continue
                self.queues[p].jobs.append(Job(
                    queue_id=qid, video_id=video_id, video_path=video_path,
                    caption=caption, hashtags=list(hashtags), is_repost=is_repost,
                ))
                ids.append(qid)
                self.events.publish(
                    "queue.enqueued",
                    f"queued video {video_id} for {p}",
                    queue_id=qid, video_id=video_id, platform=p, repost=is_repost,
                    queue_size=len(self.queues[p].jobs),
                )
        return ids

    def update_job(self, queue_id: int, caption: str, hashtags: list[str]) -> bool:
        with self._lock:
            for q in self.queues.values():
                for job in q.jobs:
                    if job.queue_id == queue_id:
                        job.caption = caption
                        job.hashtags = list(hashtags)
                        self.db.queue_update(queue_id, caption, " ".join(hashtags))
                        self.events.publish("queue.edited", f"edited queued job {queue_id}",
                                            queue_id=queue_id, caption=caption)
                        return True
        return False

    def remove_job(self, queue_id: int) -> bool:
        with self._lock:
            for q in self.queues.values():
                for job in list(q.jobs):
                    if job.queue_id == queue_id:
                        q.jobs.remove(job)
                        self.db.queue_delete(queue_id)
                        self.events.publish("queue.removed", f"removed queued job {queue_id}",
                                            queue_id=queue_id)
                        return True
        return False

    def find_job(self, queue_id: int) -> Optional[tuple[str, Job]]:
        with self._lock:
            for name, q in self.queues.items():
                for job in q.jobs:
                    if job.queue_id == queue_id:
                        return name, job
        return None

    def pause(self, platform: str) -> bool:
        with self._lock:
            if platform not in self.queues:
                return False
            self.queues[platform].paused = True
        self.events.publish("platform.paused", f"{platform} paused", platform=platform)
        return True

    def resume(self, platform: str) -> bool:
        with self._lock:
            if platform not in self.queues:
                return False
            self.queues[platform].paused = False
        self.events.publish("platform.resumed", f"{platform} resumed", platform=platform)
        return True

    def _ready(self, platform: str) -> bool:
        q = self.queues[platform]
        if q.paused:
            return False
        if self.db.posts_today(platform) >= self.max_per_day:
            return False
        last = self.db.latest_post_time(platform)
        if last is None:
            return True
        last_dt = datetime.fromisoformat(last)
        delta_min = (datetime.now(timezone.utc) - last_dt).total_seconds() / 60
        return delta_min >= self.min_minutes_between

    def drain_one(self, platform: str, force: bool = False) -> bool:
        with self._lock:
            queue = self.queues[platform]
            if not queue.jobs:
                return False
            if not force and not self._ready(platform):
                return False
            job = queue.jobs.popleft()

        try:
            result = queue.publisher.publish(job.video_path, job.caption, job.hashtags)
            self.db.record_post(
                video_id=job.video_id, platform=platform,
                remote_id=result.remote_id, permalink=result.permalink,
                is_repost=job.is_repost,
            )
            self.db.queue_delete(job.queue_id)
            self.events.publish(
                "post.success", f"posted to {platform}",
                queue_id=job.queue_id, video_id=job.video_id, platform=platform,
                remote_id=result.remote_id, permalink=result.permalink,
                repost=job.is_repost,
            )
            return True
        except Exception as e:
            log.exception("publish failed on %s", platform)
            job.retry_count += 1
            if job.retry_count >= self.max_retries:
                # Dead letter: remove permanently and surface as an error.
                self.db.queue_delete(job.queue_id)
                self.events.publish(
                    "post.dead_letter",
                    f"{platform}: gave up after {job.retry_count} retries — {type(e).__name__}",
                    level="error",
                    queue_id=job.queue_id, video_id=job.video_id,
                    platform=platform, retries=job.retry_count, error=str(e)[:200],
                )
                log.error(
                    "Dead-lettered queue_id=%s on %s after %d retries",
                    job.queue_id, platform, job.retry_count,
                )
                return False
            with self._lock:
                queue.jobs.appendleft(job)
            self.events.publish(
                "post.failed", f"{platform} publish failed (attempt {job.retry_count}): {type(e).__name__}",
                level="error", queue_id=job.queue_id, video_id=job.video_id,
                platform=platform, retries=job.retry_count, error=str(e)[:200],
            )
            return False

    def drain_specific(self, queue_id: int, force: bool = True) -> bool:
        with self._lock:
            target_platform = None
            for name, q in self.queues.items():
                for job in list(q.jobs):
                    if job.queue_id == queue_id:
                        q.jobs.remove(job)
                        q.jobs.appendleft(job)
                        target_platform = name
                        break
                if target_platform:
                    break
        if target_platform is None:
            return False
        return self.drain_one(target_platform, force=force)

    def tick(self) -> None:
        for platform in list(self.queues.keys()):
            self.drain_one(platform)

    def snapshot(self) -> dict:
        with self._lock:
            return {
                name: {
                    "queue": [
                        {
                            "queue_id": j.queue_id,
                            "video_id": j.video_id,
                            "caption": j.caption,
                            "hashtags": j.hashtags,
                            "is_repost": j.is_repost,
                            "retry_count": j.retry_count,
                            "path": str(j.video_path),
                        }
                        for j in q.jobs
                    ],
                    "paused": q.paused,
                    "posts_today": self.db.posts_today(name),
                    "max_per_day": self.max_per_day,
                    "last_post": self.db.latest_post_time(name),
                }
                for name, q in self.queues.items()
            }

    def start(self, tick_minutes: int = 15) -> None:
        self.scheduler.add_job(self.tick, "interval", minutes=tick_minutes, id="post-tick")
        self.scheduler.start()
        self.events.publish("system.scheduler_started", f"scheduler tick every {tick_minutes}m")

    def shutdown(self) -> None:
        self.scheduler.shutdown(wait=False)
