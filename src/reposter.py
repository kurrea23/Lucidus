import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .db import DB
from .scheduler import Job, PostScheduler

log = logging.getLogger(__name__)


class CrossPlatformReposter:
    """Finds top performers on one platform and queues them on the others
    after a cooldown so platforms don't penalize same-day duplicates."""

    def __init__(
        self,
        db: DB,
        scheduler: PostScheduler,
        posted_dir: Path,
        percentile: int = 80,
        repost_delay_days: int = 10,
    ):
        self.db = db
        self.scheduler = scheduler
        self.posted_dir = posted_dir
        self.percentile = percentile
        self.repost_delay_days = repost_delay_days

    def _video_row(self, video_id: int) -> dict | None:
        with self.db.connect() as c:
            row = c.execute("SELECT * FROM videos WHERE id = ?", (video_id,)).fetchone()
            return dict(row) if row else None

    def _earliest_post_dt(self, video_id: int) -> datetime | None:
        with self.db.connect() as c:
            row = c.execute(
                "SELECT MIN(posted_at) AS p FROM posts WHERE video_id = ?", (video_id,)
            ).fetchone()
            if not row or not row["p"]:
                return None
            return datetime.fromisoformat(row["p"])

    def run(self) -> None:
        all_platforms = list(self.scheduler.queues.keys())
        cooldown = timedelta(days=self.repost_delay_days)
        now = datetime.now(timezone.utc)

        for source in all_platforms:
            for top in self.db.top_performers(source, self.percentile):
                video_id = top["video_id"]
                earliest = self._earliest_post_dt(video_id)
                if earliest is None or now - earliest < cooldown:
                    continue
                video = self._video_row(video_id)
                if not video:
                    continue
                src_path = Path(video["source_path"])
                if not src_path.exists():
                    candidate = self.posted_dir / src_path.name
                    if candidate.exists():
                        src_path = candidate
                    else:
                        log.warning("missing video file for repost: %s", src_path)
                        continue
                targets = [p for p in all_platforms
                           if p != source and not self.db.video_already_posted(video_id, p)]
                if not targets:
                    continue
                job = Job(
                    video_id=video_id,
                    video_path=src_path,
                    caption=video.get("caption") or "",
                    hashtags=(video.get("hashtags") or "").split(),
                    is_repost=True,
                )
                self.scheduler.enqueue(job, platforms=targets)
                log.info("queued top performer (video %d) for repost on %s", video_id, targets)
