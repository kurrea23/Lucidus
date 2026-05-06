import logging
import signal
import sys
import threading
import time
from datetime import datetime, timedelta, timezone
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
from .resolvers import build_resolver
from .scheduler import PostScheduler
from .watcher import InboxWatcher, move_to, probe_duration, sha256_file
from .worker import IngestWorker

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
        resolver = build_resolver(ig.get("resolver"))
        if resolver is None:
            raise RuntimeError(
                "instagram.resolver is required. Set type: r2 with bucket and credentials."
            )
        pubs.append(InstagramPublisher(
            access_token=ig["access_token"],
            business_account_id=ig["business_account_id"],
            public_url_resolver=resolver,
            token_file=ig.get("token_file"),
        ))
    if cfg["tiktok"].get("enabled"):
        tt = cfg["tiktok"]
        pubs.append(TikTokPublisher(
            access_token=tt["access_token"],
            open_id=tt["open_id"],
            privacy=tt.get("privacy_level", "SELF_ONLY"),
        ))
    if not pubs:
        raise RuntimeError("No publishers enabled. Edit config.yaml.")
    return pubs


def make_handler(cfg: Config, db: DB, scheduler: PostScheduler, events: EventBus):
    cap_cfg = cfg.get("captions", {}) or {}
    per_platform = cap_cfg.get("per_platform", False)

    def handle(path: Path) -> None:
        events.publish("ingest.started", f"ingesting {path.name}", file=path.name)
        sha = None
        try:
            sha = sha256_file(path)
            existing = db.find_by_sha(sha)
            duration = probe_duration(path)

            if existing and existing.get("transcript") is not None:
                video_id = existing["id"]
                caption = existing.get("caption") or ""
                hashtags = (existing.get("hashtags") or "").split()
                events.publish(
                    "ingest.duplicate",
                    f"sha already known; reusing caption for video {video_id}",
                    video_id=video_id, file=path.name,
                )
                stored = move_to(path, cfg.posted)
                scheduler.enqueue(
                    video_id=video_id, video_path=stored,
                    caption=caption, hashtags=hashtags,
                )
            elif per_platform and len(scheduler.queues) > 1:
                # Generate a tailored caption for each platform in a single ingest pass.
                video_id, _ = db.insert_video(sha, str(path), duration)
                platform_caps = {}
                base_cap = None
                for pname in scheduler.queues.keys():
                    cap = caption_for_video(path, cfg.raw, platform=pname)
                    platform_caps[pname] = cap
                    if base_cap is None:
                        base_cap = cap
                # Store the first platform's caption as the canonical video caption.
                db.update_caption(video_id, base_cap.transcript, base_cap.caption,
                                  " ".join(base_cap.hashtags))
                stored = move_to(path, cfg.posted)
                for pname, cap in platform_caps.items():
                    scheduler.enqueue(
                        video_id=video_id, video_path=stored,
                        caption=cap.caption, hashtags=cap.hashtags,
                        platforms=[pname],
                    )
                caption = base_cap.caption
            else:
                video_id, _ = db.insert_video(sha, str(path), duration)
                cap = caption_for_video(path, cfg.raw)
                db.update_caption(video_id, cap.transcript, cap.caption, " ".join(cap.hashtags))
                caption = cap.caption
                hashtags = cap.hashtags
                stored = move_to(path, cfg.posted)
                scheduler.enqueue(
                    video_id=video_id, video_path=stored,
                    caption=caption, hashtags=hashtags,
                )

            events.publish(
                "ingest.complete",
                f"ingested video {video_id} ({stored.name})",
                video_id=video_id, file=stored.name, caption=caption,
            )
        except Exception as e:
            log.exception("ingest failed")
            err = f"{type(e).__name__}: {e}"
            if sha:
                try:
                    db.record_video_error(sha, str(path), err[:500])
                except Exception:
                    log.exception("could not record ingest error")
            events.publish(
                "ingest.failed", f"ingest failed: {type(e).__name__}",
                level="error", file=path.name, error=str(e)[:200],
            )
            try:
                move_to(path, cfg.failed)
            except Exception:
                log.exception("could not move %s to failed/", path)
    return handle


def main(config_path: str = "config.yaml") -> int:
    cfg = Config.load(config_path)

    errors = cfg.validate()
    if errors:
        for e in errors:
            log.error("CONFIG ERROR: %s", e)
        log.error("Fix the errors above and restart.")
        return 1

    db = DB(cfg.db_path)
    events = EventBus(capacity=cfg.get("dashboard", {}).get("event_buffer", 500))
    publishers = build_publishers(cfg)

    posting = cfg["posting"]
    scheduler = PostScheduler(
        db=db, publishers=publishers,
        max_per_day=posting["max_per_platform_per_day"],
        min_minutes_between=posting["min_minutes_between_posts"],
        jitter_minutes=posting["jitter_minutes"],
        max_retries=posting.get("max_retries", 5),
        events=events,
    )
    scheduler.hydrate_from_db()
    scheduler.start()

    analytics = AnalyticsCollector(db, publishers)
    reposter = CrossPlatformReposter(
        db=db, scheduler=scheduler, posted_dir=cfg.posted,
        percentile=cfg["analytics"]["top_performer_percentile"],
        repost_delay_days=cfg["analytics"]["repost_delay_days"],
    )

    bg = BackgroundScheduler(timezone="UTC")
    bg.add_job(analytics.collect, "interval",
               hours=cfg["analytics"]["pull_interval_hours"], id="analytics")
    bg.add_job(reposter.run, "interval", hours=24, id="reposter")

    # Auto-refresh Instagram long-lived token every 45 days.
    ig_pub = next((p for p in publishers if p.name == "instagram"
                   and hasattr(p, "refresh_token")), None)
    if ig_pub and cfg["instagram"].get("auto_refresh_token", True):
        def _refresh_ig():
            try:
                ig_pub.refresh_token()
                events.publish("ig.token_refreshed", "Instagram token auto-refreshed")
                log.info("Instagram token auto-refreshed")
            except Exception as exc:
                log.exception("Instagram token auto-refresh failed")
                events.publish("ig.token_refresh_failed",
                               f"IG token refresh failed: {exc}",
                               level="error", error=str(exc)[:200])

        # First run 45 days from now so we don't hit the API needlessly on every restart.
        bg.add_job(_refresh_ig, "interval", days=45, id="ig_refresh",
                   next_run_time=datetime.now(timezone.utc) + timedelta(days=45))

    bg.start()

    handler = make_handler(cfg, db, scheduler, events)
    worker = IngestWorker(handler, max_workers=cfg.get("posting", {}).get("ingest_workers", 2))
    watcher = InboxWatcher(cfg.inbox, on_new=worker.submit)

    dash_cfg = cfg.get("dashboard", {}) or {}
    if dash_cfg.get("enabled", True):
        app = create_app(cfg, db, scheduler, events, watcher, analytics, publishers)
        host = dash_cfg.get("host", "127.0.0.1")
        port = int(dash_cfg.get("port", 8765))
        uconfig = uvicorn.Config(app, host=host, port=port, log_level="warning", access_log=False)
        server = uvicorn.Server(uconfig)
        threading.Thread(target=server.run, name="cockpit", daemon=True).start()
        events.publish("system.cockpit_started", f"cockpit at http://{host}:{port}",
                       host=host, port=port)
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
    worker.shutdown()
    scheduler.shutdown()
    bg.shutdown(wait=False)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "config.yaml"))
