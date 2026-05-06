"""Standalone smoke test that boots the FastAPI app with a stubbed publisher
and exercises every cockpit endpoint plus the queue edit/remove flow.

Stubs out anthropic/openai/google/boto3 so this can run in CI without
network or credentials. Exits non-zero on any failure.
"""
from __future__ import annotations

import sys
import tempfile
import types
from pathlib import Path


def install_stubs() -> None:
    class StubAttr:
        def __getattr__(self, name): return StubAttr()
        def __call__(self, *a, **k): return StubAttr()

    for m in [
        "anthropic", "openai",
        "googleapiclient", "googleapiclient.discovery",
        "googleapiclient.errors", "googleapiclient.http",
        "google", "google.auth", "google.auth.transport",
        "google.auth.transport.requests",
        "google.oauth2", "google.oauth2.credentials",
        "google_auth_oauthlib", "google_auth_oauthlib.flow",
        "boto3", "botocore", "botocore.config",
    ]:
        mod = types.ModuleType(m)
        mod.__getattr__ = lambda n: StubAttr()
        sys.modules[m] = mod


def main() -> int:
    install_stubs()

    tmp = Path(tempfile.mkdtemp())
    for d in ("data", "inbox", "posted", "failed"):
        (tmp / d).mkdir()

    # Imports happen after stubs are installed so external SDKs don't fire.
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from src.analytics import AnalyticsCollector
    from src.app import create_app
    from src.config import Config
    from src.db import DB
    from src.events import EventBus
    from src.scheduler import PostScheduler
    from src.watcher import InboxWatcher
    from starlette.testclient import TestClient

    class FakePub:
        name = "youtube"
        def publish(self, *a, **k): raise NotImplementedError
        def fetch_metrics(self, rid): return None

    cfg_data = {
        "paths": {
            "inbox": str(tmp / "inbox"),
            "posted": str(tmp / "posted"),
            "failed": str(tmp / "failed"),
            "database": str(tmp / "data/test.db"),
        },
        "api_keys": {"anthropic": "x", "openai": "x"},
        "youtube": {"enabled": True},
        "instagram": {"enabled": False},
        "tiktok": {"enabled": False},
        "posting": {"max_per_platform_per_day": 3, "min_minutes_between_posts": 90, "jitter_minutes": 30},
        "captions": {},
        "analytics": {"pull_interval_hours": 6, "top_performer_percentile": 80, "repost_delay_days": 10},
        "dashboard": {"enabled": True, "host": "127.0.0.1", "port": 8765},
    }
    cfg = Config(raw=cfg_data)
    db = DB(cfg.db_path)
    events = EventBus()
    pubs = [FakePub()]
    sched = PostScheduler(db, pubs, 3, 90, 30, events)
    sched.hydrate_from_db()
    analytics = AnalyticsCollector(db, pubs)
    watcher = InboxWatcher(cfg.inbox, on_new=lambda p: None)
    app = create_app(cfg, db, sched, events, watcher, analytics, pubs)

    client = TestClient(app)
    for path in ["/api/stats", "/api/posts", "/api/top", "/api/health",
                 "/api/errors", "/api/config", "/"]:
        r = client.get(path)
        assert r.status_code == 200, f"{path} -> {r.status_code}: {r.text}"

    fake_video = tmp / "posted" / "test.mp4"
    fake_video.write_bytes(b"x")
    vid, _ = db.insert_video("abc", str(fake_video), 5.0)
    db.update_caption(vid, "transcript", "orig caption", "a b")

    ids = sched.enqueue(
        video_id=vid, video_path=fake_video,
        caption="orig caption", hashtags=["a", "b"],
    )
    assert ids, "enqueue returned no ids"
    qid = ids[0]

    r = client.put(f"/api/queue/{qid}", json={"caption": "new caption", "hashtags": ["x", "y"]})
    assert r.status_code == 200, r.text
    r = client.get(f"/api/queue/{qid}")
    assert r.json()["caption"] == "new caption", r.json()

    r = client.post("/api/platform/youtube/pause")
    assert r.status_code == 200
    snap = client.get("/api/stats").json()
    assert snap["platforms"]["youtube"]["paused"] is True
    client.post("/api/platform/youtube/resume")

    r = client.delete(f"/api/queue/{qid}")
    assert r.status_code == 200
    snap = client.get("/api/stats").json()
    assert len(snap["platforms"]["youtube"]["queue"]) == 0

    from src.resolvers import build_resolver
    assert build_resolver(None) is None
    assert build_resolver({"type": "unknown"}) is None
    r2 = build_resolver({
        "type": "r2", "bucket": "b", "account_id": "a",
        "access_key_id": "k", "secret_access_key": "s",
    })
    assert r2 is not None

    print("smoke test ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
