import logging
import random
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Callable

from apscheduler.schedulers.background import BackgroundScheduler

from .db import DB
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


class PostScheduler:
    """Drip-posts jobs to each platform respecting daily caps and min spacing."""

    def __init__(
        self,
        db: DB,
        publishers: list[Publisher],
        max_per_day: int,
        min_minutes_between: int,
        jitter_minutes: int,
    ):
        self.db = db
        self.queues = {p.name: PlatformQueue(publisher=p) for p in publishers}
        self.max_per_day = max_per_day
        self.min_minutes_between = min_minutes_between
        self.jitter_minutes = jitter_minutes
        self._lock = Lock()
        self.scheduler = BackgroundScheduler(timezone="UTC")

    def enqueue(self, job: Job, platforms: list[str] | None = None) -> None:
        with self._lock:
            targets = platforms or list(self.queues.keys())
            for p in targets:
                if p not in self.queues:
                    continue
                if self.db.video_already_posted(job.video_id, p) and not job.is_repost:
                    continue
                self.queues[p].jobs.append(job)
                log.info("queued video %d for %s (queue size %d)", job.video_id, p, len(self.queues[p].jobs))

    def _ready(self, platform: str) -> bool:
        if self.db.posts_today(platform) >= self.max_per_day:
            return False
        last = self.db.latest_post_time(platform)
        if last is None:
            return True
        last_dt = datetime.fromisoformat(last)
        delta_min = (datetime.now(timezone.utc) - last_dt).total_seconds() / 60
        return delta_min >= self.min_minutes_between

    def _drain_one(self, platform: str) -> None:
        with self._lock:
            queue = self.queues[platform]
            if not queue.jobs:
                return
            if not self._ready(platform):
                return
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
            log.info("posted to %s: %s", platform, result.permalink or result.remote_id)
        except Exception:
            log.exception("publish failed on %s; requeuing", platform)
            with self._lock:
                queue.jobs.appendleft(job)

    def tick(self) -> None:
        for platform in list(self.queues.keys()):
            jitter = random.randint(0, max(1, self.jitter_minutes))
            self.scheduler.add_job(
                self._drain_one,
                trigger="date",
                args=[platform],
                misfire_grace_time=3600,
                id=f"drain-{platform}-{datetime.now(timezone.utc).timestamp()}",
                run_date=datetime.now(timezone.utc).replace(microsecond=0),
                replace_existing=False,
            )
            _ = jitter

    def start(self, tick_minutes: int = 15) -> None:
        self.scheduler.add_job(self.tick, "interval", minutes=tick_minutes, id="post-tick")
        self.scheduler.start()
        log.info("scheduler started (tick every %s min)", tick_minutes)

    def shutdown(self) -> None:
        self.scheduler.shutdown(wait=False)
