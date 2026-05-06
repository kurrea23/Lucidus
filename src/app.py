import asyncio
import json
import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from .analytics import AnalyticsCollector
from .config import Config
from .db import DB
from .events import EventBus
from .scheduler import PostScheduler
from .watcher import VIDEO_EXTS, InboxWatcher

log = logging.getLogger(__name__)
TEMPLATES = Path(__file__).parent / "templates"


def create_app(
    cfg: Config,
    db: DB,
    scheduler: PostScheduler,
    events: EventBus,
    watcher: InboxWatcher,
    analytics: AnalyticsCollector,
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

        platform_totals = {row["platform"]: dict(row) for row in totals}

        return {
            "inbox": {"files": inbox_files, "count": len(inbox_files)},
            "failed_count": len(failed_files),
            "platforms": scheduler.snapshot(),
            "totals": platform_totals,
        }

    @app.get("/api/posts")
    def posts(limit: int = 50):
        with db.connect() as c:
            rows = c.execute("""
                SELECT p.id, p.platform, p.permalink, p.posted_at, p.is_repost,
                       v.id AS video_id, v.caption,
                       latest.views, latest.likes, latest.comments
                FROM posts p
                JOIN videos v ON v.id = p.video_id
                LEFT JOIN (
                    SELECT m.post_id, m.views, m.likes, m.comments,
                           ROW_NUMBER() OVER (PARTITION BY m.post_id ORDER BY m.captured_at DESC) AS rn
                    FROM metrics m
                ) latest ON latest.post_id = p.id AND latest.rn = 1
                ORDER BY p.posted_at DESC
                LIMIT ?
            """, (limit,)).fetchall()
        return [dict(r) for r in rows]

    @app.get("/api/top")
    def top(percentile: int = 80, since_days: int = 60):
        results = {}
        for platform in scheduler.queues.keys():
            results[platform] = db.top_performers(platform, percentile, since_days)
        return results

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

    @app.get("/api/config")
    def get_config():
        safe = {k: v for k, v in cfg.raw.items() if k != "api_keys"}
        return JSONResponse(safe)

    return app
