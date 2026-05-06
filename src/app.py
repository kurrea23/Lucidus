import asyncio
import json
import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .analytics import AnalyticsCollector
from .caption import generate_caption
from .config import Config
from .db import DB
from .events import EventBus
from .scheduler import PostScheduler
from .watcher import VIDEO_EXTS, InboxWatcher

log = logging.getLogger(__name__)
TEMPLATES = Path(__file__).parent / "templates"


class CaptionEdit(BaseModel):
    caption: str
    hashtags: list[str] = []


def create_app(
    cfg: Config,
    db: DB,
    scheduler: PostScheduler,
    events: EventBus,
    watcher: InboxWatcher,
    analytics: AnalyticsCollector,
    publishers: list,
) -> FastAPI:
    app = FastAPI(title="Lucidus Cockpit")

    static_dir = TEMPLATES / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    @app.get("/", response_class=HTMLResponse)
    def index():
        return (TEMPLATES / "dashboard.html").read_text()

    @app.get("/api/stats")
    def stats():
        inbox_files = []
        if cfg.inbox.exists():
            inbox_files = [
                {"name": p.name, "size": p.stat().st_size}
                for p in sorted(cfg.inbox.iterdir())
                if p.is_file() and p.suffix.lower() in VIDEO_EXTS
            ]
        failed_files = [p.name for p in cfg.failed.iterdir()
                        if p.is_file() and p.suffix.lower() in VIDEO_EXTS] if cfg.failed.exists() else []

        with db.connect() as c:
            totals = c.execute("""
                SELECT p.platform,
                       COALESCE(SUM(latest.views), 0)    AS views,
                       COALESCE(SUM(latest.likes), 0)    AS likes,
                       COALESCE(SUM(latest.comments), 0) AS comments,
                       COUNT(DISTINCT p.id)              AS posts
                FROM posts p
                LEFT JOIN (
                    SELECT m.post_id,
                           m.views, m.likes, m.comments,
                           ROW_NUMBER() OVER (PARTITION BY m.post_id ORDER BY m.captured_at DESC) AS rn
                    FROM metrics m
                ) latest ON latest.post_id = p.id AND latest.rn = 1
                GROUP BY p.platform
            """).fetchall()
            ingest_errors = c.execute(
                "SELECT COUNT(*) AS n FROM videos WHERE error IS NOT NULL"
            ).fetchone()["n"]

        platform_totals = {row["platform"]: dict(row) for row in totals}

        return {
            "inbox": {"files": inbox_files, "count": len(inbox_files)},
            "failed_count": len(failed_files),
            "ingest_errors": ingest_errors,
            "platforms": scheduler.snapshot(),
            "totals": platform_totals,
        }

    @app.get("/api/posts")
    def posts(limit: int = 50, q: str = "", platform: str = ""):
        sql = """
            SELECT p.id, p.platform, p.permalink, p.posted_at, p.is_repost,
                   v.id AS video_id, v.caption, v.hashtags,
                   latest.views, latest.likes, latest.comments
            FROM posts p
            JOIN videos v ON v.id = p.video_id
            LEFT JOIN (
                SELECT m.post_id, m.views, m.likes, m.comments,
                       ROW_NUMBER() OVER (PARTITION BY m.post_id ORDER BY m.captured_at DESC) AS rn
                FROM metrics m
            ) latest ON latest.post_id = p.id AND latest.rn = 1
            WHERE 1=1
        """
        args: list = []
        if platform:
            sql += " AND p.platform = ?"
            args.append(platform)
        if q:
            sql += " AND (v.caption LIKE ? OR v.hashtags LIKE ?)"
            args.extend([f"%{q}%", f"%{q}%"])
        sql += " ORDER BY p.posted_at DESC LIMIT ?"
        args.append(limit)

        with db.connect() as c:
            rows = c.execute(sql, args).fetchall()
            results = []
            for r in rows:
                d = dict(r)
                series = c.execute(
                    """SELECT views, likes, comments, captured_at
                       FROM metrics WHERE post_id = ?
                       ORDER BY captured_at ASC LIMIT 30""",
                    (d["id"],),
                ).fetchall()
                d["series"] = [dict(s) for s in series]
                v = d.get("views") or 0
                lk = d.get("likes") or 0
                cm = d.get("comments") or 0
                d["engagement_rate"] = (lk + cm) / v if v else 0.0
                results.append(d)
            return results

    @app.get("/api/posts/{post_id}/series")
    def post_series(post_id: int):
        return db.metrics_series(post_id)

    @app.get("/api/top")
    def top(percentile: int = 80, since_days: int = 60):
        results = {}
        for platform in scheduler.queues.keys():
            results[platform] = db.top_performers(platform, percentile, since_days)
        return results

    @app.get("/api/queue/{queue_id}")
    def queue_get(queue_id: int):
        row = db.queue_get(queue_id)
        if not row:
            raise HTTPException(404)
        video = db.get_video(row["video_id"]) or {}
        row["transcript"] = video.get("transcript")
        return row

    @app.put("/api/queue/{queue_id}")
    def queue_edit(queue_id: int, body: CaptionEdit):
        if not scheduler.update_job(queue_id, body.caption, body.hashtags):
            raise HTTPException(404)
        return {"ok": True}

    @app.delete("/api/queue/{queue_id}")
    def queue_remove(queue_id: int):
        if not scheduler.remove_job(queue_id):
            raise HTTPException(404)
        return {"ok": True}

    @app.post("/api/queue/{queue_id}/regenerate")
    def queue_regenerate(queue_id: int):
        row = db.queue_get(queue_id)
        if not row:
            raise HTTPException(404)
        video = db.get_video(row["video_id"]) or {}
        transcript = video.get("transcript") or ""
        if not transcript:
            raise HTTPException(409, "no transcript on file; cannot regenerate")
        cap_cfg = cfg.get("captions", {}) or {}
        api = cfg["api_keys"]
        caption, tags = generate_caption(
            transcript=transcript,
            anthropic_key=api["anthropic"],
            model=cap_cfg.get("model", "claude-sonnet-4-6"),
            max_hashtags=cap_cfg.get("max_hashtags", 8),
            style=cap_cfg.get("style", "engaging, hook-first, no clickbait"),
        )
        scheduler.update_job(queue_id, caption, tags)
        events.publish("caption.regenerated", f"regenerated caption for queue {queue_id}",
                       queue_id=queue_id, caption=caption)
        return {"caption": caption, "hashtags": tags}

    @app.post("/api/queue/{queue_id}/post-now")
    def queue_post_now(queue_id: int):
        events.publish("user.post_now", f"manual drain requested for queue {queue_id}", queue_id=queue_id)
        ok = scheduler.drain_specific(queue_id, force=True)
        if not ok:
            raise HTTPException(404)
        return {"ok": ok}

    @app.get("/api/events")
    async def event_stream(request: Request, last_id: int = 0):
        async def gen():
            seen = last_id
            for ev in events.latest():
                if ev["id"] > seen:
                    yield f"id: {ev['id']}\ndata: {json.dumps(ev)}\n\n"
                    seen = ev["id"]
            while True:
                if await request.is_disconnected():
                    break
                for ev in events.since(seen):
                    yield f"id: {ev['id']}\ndata: {json.dumps(ev)}\n\n"
                    seen = ev["id"]
                await asyncio.sleep(1.0)
        return StreamingResponse(gen(), media_type="text/event-stream", headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        })

    @app.post("/api/platform/{name}/pause")
    def pause(name: str):
        if not scheduler.pause(name):
            raise HTTPException(404, f"unknown platform {name}")
        return {"ok": True}

    @app.post("/api/platform/{name}/resume")
    def resume(name: str):
        if not scheduler.resume(name):
            raise HTTPException(404, f"unknown platform {name}")
        return {"ok": True}

    @app.post("/api/platform/{name}/post-now")
    def post_now(name: str):
        if name not in scheduler.queues:
            raise HTTPException(404, f"unknown platform {name}")
        events.publish("user.post_now", f"manual drain requested for {name}", platform=name)
        ok = scheduler.drain_one(name, force=True)
        return {"ok": ok}

    @app.post("/api/scan-now")
    def scan_now():
        events.publish("user.scan_now", "manual inbox scan")
        watcher.scan_once()
        return {"ok": True}

    @app.post("/api/collect-metrics")
    def collect():
        events.publish("user.metrics_collect", "manual metrics collection")
        analytics.collect()
        return {"ok": True}

    @app.post("/api/retry-failed")
    def retry_failed():
        moved = 0
        if cfg.failed.exists():
            for p in list(cfg.failed.iterdir()):
                if p.is_file() and p.suffix.lower() in VIDEO_EXTS:
                    target = cfg.inbox / p.name
                    n = 1
                    while target.exists():
                        target = cfg.inbox / f"{p.stem}_{n}{p.suffix}"
                        n += 1
                    p.rename(target)
                    moved += 1
        events.publish("user.retry_failed", f"moved {moved} files back to inbox", count=moved)
        return {"ok": True, "moved": moved}

    @app.get("/api/health")
    def health():
        out = {}
        for p in publishers:
            try:
                if hasattr(p, "service"):
                    p.service()
                out[p.name] = {"ok": True}
            except Exception as e:
                out[p.name] = {"ok": False, "error": f"{type(e).__name__}: {e}"[:200]}
        return out

    @app.get("/api/errors")
    def errors():
        with db.connect() as c:
            rows = c.execute(
                "SELECT id, source_path, error, error_at FROM videos WHERE error IS NOT NULL ORDER BY error_at DESC LIMIT 50"
            ).fetchall()
        return [dict(r) for r in rows]

    @app.get("/api/config")
    def get_config():
        safe = {k: v for k, v in cfg.raw.items() if k != "api_keys"}
        return JSONResponse(safe)

    return app
