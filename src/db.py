import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator, Optional

SCHEMA = """
CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sha256 TEXT UNIQUE NOT NULL,
    source_path TEXT NOT NULL,
    duration_seconds REAL,
    transcript TEXT,
    caption TEXT,
    hashtags TEXT,
    ingested_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    remote_id TEXT,
    permalink TEXT,
    posted_at TEXT NOT NULL,
    is_repost INTEGER NOT NULL DEFAULT 0,
    UNIQUE(video_id, platform, is_repost)
);

CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    captured_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_metrics_post ON metrics(post_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform, posted_at DESC);
"""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class DB:
    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as c:
            c.executescript(SCHEMA)

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.path, isolation_level=None)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        try:
            yield conn
        finally:
            conn.close()

    def insert_video(self, sha: str, src: str, duration: Optional[float]) -> int:
        with self.connect() as c:
            cur = c.execute(
                "INSERT OR IGNORE INTO videos (sha256, source_path, duration_seconds, ingested_at) VALUES (?, ?, ?, ?)",
                (sha, src, duration, now_iso()),
            )
            if cur.lastrowid:
                return cur.lastrowid
            row = c.execute("SELECT id FROM videos WHERE sha256 = ?", (sha,)).fetchone()
            return row["id"]

    def update_caption(self, video_id: int, transcript: str, caption: str, hashtags: str) -> None:
        with self.connect() as c:
            c.execute(
                "UPDATE videos SET transcript = ?, caption = ?, hashtags = ? WHERE id = ?",
                (transcript, caption, hashtags, video_id),
            )

    def record_post(
        self,
        video_id: int,
        platform: str,
        remote_id: str,
        permalink: str,
        is_repost: bool = False,
    ) -> int:
        with self.connect() as c:
            cur = c.execute(
                "INSERT INTO posts (video_id, platform, remote_id, permalink, posted_at, is_repost) VALUES (?, ?, ?, ?, ?, ?)",
                (video_id, platform, remote_id, permalink, now_iso(), int(is_repost)),
            )
            return cur.lastrowid

    def record_metrics(self, post_id: int, views: int, likes: int, comments: int, shares: int) -> None:
        with self.connect() as c:
            c.execute(
                "INSERT INTO metrics (post_id, views, likes, comments, shares, captured_at) VALUES (?, ?, ?, ?, ?, ?)",
                (post_id, views, likes, comments, shares, now_iso()),
            )

    def posts_today(self, platform: str) -> int:
        with self.connect() as c:
            row = c.execute(
                "SELECT COUNT(*) AS n FROM posts WHERE platform = ? AND date(posted_at) = date('now')",
                (platform,),
            ).fetchone()
            return row["n"]

    def latest_post_time(self, platform: str) -> Optional[str]:
        with self.connect() as c:
            row = c.execute(
                "SELECT posted_at FROM posts WHERE platform = ? ORDER BY posted_at DESC LIMIT 1",
                (platform,),
            ).fetchone()
            return row["posted_at"] if row else None

    def video_already_posted(self, video_id: int, platform: str) -> bool:
        with self.connect() as c:
            row = c.execute(
                "SELECT 1 FROM posts WHERE video_id = ? AND platform = ? LIMIT 1",
                (video_id, platform),
            ).fetchone()
            return row is not None

    def top_performers(self, platform: str, percentile: int, since_days: int = 60) -> list[dict]:
        with self.connect() as c:
            rows = c.execute(
                """
                SELECT p.video_id, p.platform, MAX(m.views) AS views
                FROM posts p
                JOIN metrics m ON m.post_id = p.id
                WHERE p.platform = ?
                  AND p.is_repost = 0
                  AND date(p.posted_at) >= date('now', ?)
                GROUP BY p.id
                ORDER BY views DESC
                """,
                (platform, f"-{since_days} days"),
            ).fetchall()
            if not rows:
                return []
            cutoff_index = max(0, int(len(rows) * (100 - percentile) / 100) - 1)
            cutoff_views = rows[cutoff_index]["views"] if rows else 0
            return [dict(r) for r in rows if r["views"] >= cutoff_views and r["views"] > 0]
