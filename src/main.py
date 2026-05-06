import logging
import signal
import sys
import threading
import time
from pathlib import Path

import uvicorn
from apscheduler.schedulers.background import BackgroundScheduler

from .analytics import AnalyticsCollector
from .app import create_app
from .caption import caption_for_video
from .config import Config
from .db import DB
from .events import EventBus
from .publishers import InstagramPublisher, TikTokPublisher, YouTubePublisher
from .reposter import CrossPlatformReposter
from .scheduler import Job, PostScheduler
from .watcher import InboxWatcher, move_to, probe_duration, sha256_file

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s :: %(message)s",
)
log = logging.getLogger("lucidus")


def build_publishers(cfg: Config) -> list:
    pubs = []
    if cfg["youtube"].get("enabled"):
        y = cfg["youtube"]
        pubs.append(YouTubePublisher(
            client_secrets=y["client_secrets"],
            token_file=y["token_file"],
            category_id=y.get("category_id", "22"),
            privacy_status=y.get("privacy_status", "public"),
            made_for_kids=y.get("made_for_kids", False),
        ))
    if cfg["instagram"].get("enabled"):
        ig = cfg["instagram"]
        pubs.append(InstagramPublisher(
            access_token=ig["access_token"],
            business_account_id=ig["business_account_id"],
            public_url_resolver=None,
        ))
    if cfg["tiktok"].get("enabled"):
        tt = cfg["tiktok"]
        pubs.append(TikTokPublisher(
            access_token=tt["access_token"],
            open_id=tt["open_id"],
        ))
    if not pubs:
        raise RuntimeError("No publishers enabled. Edit config.yaml.")
    return pubs


def make_handler(cfg: Config, db: DB, scheduler: PostScheduler, events: EventBus):
    def handle(path: Path) -> None:
        events.publish("ingest.started", f"ingesting {path.name}", file=path.name)
        try:
            sha = sha256_file(path)
            duration = probe_duration(path)
            video_id = db.insert_video(sha, str(path), duration)

            cap = caption_for_video(path, cfg.raw)
            db.update_caption(video_id, cap.transcript, cap.caption, " ".join(cap.hashtags))

            stored = move_to(path, cfg.posted)
            scheduler.enqueue(Job(
                video_id=video_id,
                video_path=stored,
                caption=cap.caption,
                hashtags=cap.hashtags,
            ))
            events.publish(
                "ingest.complete",
                f"ingested video {video_id} ({stored.name})",
                video_id=video_id, file=stored.name, caption=cap.caption,
            )
        except Exception as e:
            log.exception("ingest failed")
            events.publish(
                "ingest.failed",
                f"ingest failed: {type(e).__name__}",
                level="error", file=path.name, error=str(e)[:200],
            )
            try:
                move_to(path, cfg.failed)
            except Exception:
                log.exception("could not move %s to failed/", path)
    return handle


def main(config_path: str = "config.yaml") -> int:
    cfg = Config.load(config_path)
    db = DB(cfg.db_path)
    events = EventBus(capacity=cfg.get("dashboard", {}).get("event_buffer", 500))
    publishers = build_publishers(cfg)

    posting = cfg["posting"]
    scheduler = PostScheduler(
        db=db,
        publishers=publishers,
        max_per_day=posting["max_per_platform_per_day"],
        min_minutes_between=posting["min_minutes_between_posts"],
        jitter_minutes=posting["jitter_minutes"],
        events=events,
    )
    scheduler.start()

    analytics = AnalyticsCollector(db, publishers)
    reposter = CrossPlatformReposter(
        db=db,
        scheduler=scheduler,
        posted_dir=cfg.posted,
        percentile=cfg["analytics"]["top_performer_percentile"],
        repost_delay_days=cfg["analytics"]["repost_delay_days"],
    )

    bg = BackgroundScheduler(timezone="UTC")
    bg.add_job(analytics.collect, "interval", hours=cfg["analytics"]["pull_interval_hours"], id="analytics")
    bg.add_job(reposter.run, "interval", hours=24, id="reposter")
    bg.start()

    handler = make_handler(cfg, db, scheduler, events)
    watcher = InboxWatcher(cfg.inbox, on_new=handler)

    dash_cfg = cfg.get("dashboard", {}) or {}
    if dash_cfg.get("enabled", True):
        app = create_app(cfg, db, scheduler, events, watcher, analytics)
        host = dash_cfg.get("host", "127.0.0.1")
        port = int(dash_cfg.get("port", 8765))
        config = uvicorn.Config(app, host=host, port=port, log_level="warning", access_log=False)
        server = uvicorn.Server(config)
        threading.Thread(target=server.run, name="cockpit", daemon=True).start()
        events.publish("system.cockpit_started", f"cockpit at http://{host}:{port}", host=host, port=port)
        log.info("cockpit at http://%s:%s", host, port)

    stopping = False
    def stop(_sig, _frm):
        nonlocal stopping
        stopping = True
    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)

    events.publish("system.ready", f"watching {cfg.inbox}")
    log.info("Lucidus running. Drop videos into %s", cfg.inbox)
    while not stopping:
        watcher.scan_once()
        time.sleep(watcher.poll_seconds)

    log.info("shutting down")
    scheduler.shutdown()
    bg.shutdown(wait=False)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "config.yaml"))
