import logging

from .db import DB
from .publishers.base import Publisher

log = logging.getLogger(__name__)


class AnalyticsCollector:
    def __init__(self, db: DB, publishers: list[Publisher]):
        self.db = db
        self.publishers = {p.name: p for p in publishers}

    def collect(self) -> None:
        with self.db.connect() as c:
            posts = c.execute(
                "SELECT id, platform, remote_id FROM posts WHERE remote_id IS NOT NULL"
            ).fetchall()
        log.info("collecting metrics for %d posts", len(posts))
        for row in posts:
            pub = self.publishers.get(row["platform"])
            if pub is None:
                continue
            metrics = pub.fetch_metrics(row["remote_id"])
            if metrics is None:
                continue
            self.db.record_metrics(
                post_id=row["id"],
                views=metrics.views,
                likes=metrics.likes,
                comments=metrics.comments,
                shares=metrics.shares,
            )
