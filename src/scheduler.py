import logging
import random
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
    video_id: int
    video_path: Path
    caption: str
    hashtags: list[str]
    is_repost: bool = False


@dataclass
class PlatformQueue:
    publisher: Publisher
    jobs: deque[Job] = field(default_factory=deque)
    paused: bool = False


class PostScheduler:
    """Drip-posts jobs to each platform respecting daily caps and min spacing."""

    def __init__(
        self,
        db: DB,
        publishers: list[Publisher],
        max_per_day: int,
        min_minutes_between: int,
        jitter_minutes: int,
        events: Optional[EventBus] = None,
    ):
        self.db = db
        self.queues = {p.name: PlatformQueue(publisher=p) for p in publishers}
        self.max_per_day = max_per_day
        self.min_minutes_between = min_minutes_between
        self.jitter_minutes = jitter_minutes
        self.events = events or EventBus()
        self._lock = Lock()
        self.scheduler = BackgroundScheduler(timezone="UTC")

    def enqueue(self, job: Job, platforms: list[str] | None = None) -> list[str]:
        queued = []
        with self._lock:
            targets = platforms or list(self.queues.keys())
            for p in targets:
                if p not in self.queues:
                    continue
                if self.db.video_already_posted(job.video_id, p) and not job.is_repost:
                    continue
                self.queues[p].jobs.append(job)
                queued.append(p)
        for p in queued:
            self.events.publish(
                "queue.enqueued",
                f"queued video {job.video_id} for {p}",
                video_id=job.video_id, platform=p, repost=job.is_repost,
                queue_size=len(self.queues[p].jobs),
            )
        return queued

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
                video_id=job.video_id,
                platform=platform,
                remote_id=result.remote_id,
                permalink=result.permalink,
                is_repost=job.is_repost,
            )
            self.events.publish(
                "post.success",
                f"posted to {platform}",
                video_id=job.video_id, platform=platform,
                remote_id=result.remote_id, permalink=result.permalink,
                repost=job.is_repost,
            )
            return True
        except Exception as e:
            log.exception("publish failed on %s; requeuing", platform)
            with self._lock:
                queue.jobs.appendleft(job)
            self.events.publish(
                "post.failed",
                f"{platform} publish failed: {type(e).__name__}",
                level="error",
                video_id=job.video_id, platform=platform, error=str(e)[:200],
            )
            return False

    def tick(self) -> None:
        for platform in list(self.queues.keys()):
            if random.randint(0, max(1, self.jitter_minutes)) % 2 == 0:
                self.drain_one(platform)

    def snapshot(self) -> dict:
        with self._lock:
            return {
                name: {
                    "queue": [
                        {
                            "video_id": j.video_id,
                            "caption": j.caption,
                            "is_repost": j.is_repost,
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
