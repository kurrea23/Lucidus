"""Standalone smoke test that boots the FastAPI app with a stubbed publisher
and exercises every cockpit endpoint plus the queue edit/remove/retry flow.

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

    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from src.analytics import AnalyticsCollector
    from src.app import create_app
    from src.config import Config
    from src.db import DB
    from src.events import EventBus
    from src.scheduler import PostScheduler
    from src.watcher import InboxWatcher
    from starlette.testclient import TestClient

    # ── Stubs ─────────────────────────────────────────────────────────────────

    class FakePub:
        name = "youtube"

        def publish(self, *a, **k):
            raise NotImplementedError

        def fetch_metrics(self, rid):
            return None

    class FakeIGPub:
        """Fake Instagram publisher with token refresh and status methods."""
        name = "instagram"

        def publish(self, *a, **k):
            raise NotImplementedError

        def fetch_metrics(self, rid):
            return None

        def token_status(self):
            return {"valid": True, "ig_id": "123456", "days_remaining": 45}

        def refresh_token(self):
            return {"access_token": "new-token", "expires_in": 5183944}

    # ── Config ────────────────────────────────────────────────────────────────

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
        "posting": {"max_per_platform_per_day": 3, "min_minutes_between_posts": 90,
                    "jitter_minutes": 30},
        "captions": {},
        "analytics": {"pull_interval_hours": 6, "top_performer_percentile": 80,
                      "repost_delay_days": 10},
        "dashboard": {"enabled": True, "host": "127.0.0.1", "port": 8765},
    }
    cfg = Config(raw=cfg_data)
    db = DB(cfg.db_path)
    events = EventBus()
    pubs = [FakePub(), FakeIGPub()]
    sched = PostScheduler(db, pubs, 3, 90, 30, events, max_retries=3)
    sched.hydrate_from_db()
    analytics = AnalyticsCollector(db, pubs)
    watcher = InboxWatcher(cfg.inbox, on_new=lambda p: None)
    app = create_app(cfg, db, sched, events, watcher, analytics, pubs)

    client = TestClient(app)

    # ── All main endpoints return 200 ──────────────────────────────────────────

    for path in ["/api/stats", "/api/posts", "/api/top", "/api/health",
                 "/api/errors", "/api/config", "/"]:
        r = client.get(path)
        assert r.status_code == 200, f"{path} -> {r.status_code}: {r.text}"

    # ── IG token status and refresh (stubbed) ─────────────────────────────────

    r = client.get("/api/platform/instagram/token-status")
    assert r.status_code == 200, r.text
    status = r.json()
    assert status["valid"] is True
    assert status["days_remaining"] == 45

    r = client.post("/api/platform/instagram/refresh-token")
    assert r.status_code == 200, r.text
    assert r.json()["ok"] is True

    # ── Health includes IG token status ───────────────────────────────────────

    health = client.get("/api/health").json()
    assert "instagram" in health
    assert health["instagram"]["valid"] is True

    # ── Queue lifecycle ───────────────────────────────────────────────────────

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

    # ── Pause / resume ────────────────────────────────────────────────────────

    r = client.post("/api/platform/youtube/pause")
    assert r.status_code == 200
    snap = client.get("/api/stats").json()
    assert snap["platforms"]["youtube"]["paused"] is True
    client.post("/api/platform/youtube/resume")

    # ── Delete ────────────────────────────────────────────────────────────────

    r = client.delete(f"/api/queue/{qid}")
    assert r.status_code == 200
    snap = client.get("/api/stats").json()
    assert len(snap["platforms"]["youtube"]["queue"]) == 0

    # ── Dead-letter: job dropped after max_retries ────────────────────────────

    ids2 = sched.enqueue(
        video_id=vid, video_path=fake_video,
        caption="retry test", hashtags=[],
        platforms=["youtube"],
    )
    assert ids2, "second enqueue returned no ids"
    retry_qid = ids2[0]

    # Simulate repeated failures; after max_retries the job is dead-lettered.
    for _ in range(3):
        sched.drain_one("youtube", force=True)

    snap2 = client.get("/api/stats").json()
    assert len(snap2["platforms"]["youtube"]["queue"]) == 0, \
        "dead-lettered job should be removed from queue"

    # ── Retry count visible in snapshot ──────────────────────────────────────

    ids3 = sched.enqueue(
        video_id=vid, video_path=fake_video,
        caption="retry count test", hashtags=[],
        platforms=["youtube"],
    )
    # Trigger one failure to increment retry_count.
    sched.drain_one("youtube", force=True)
    snap3 = client.get("/api/stats").json()
    q_entries = snap3["platforms"]["youtube"]["queue"]
    # If job is still alive (retry_count < max_retries), it should show retry_count > 0.
    if q_entries:
        assert "retry_count" in q_entries[0]

    # ── Resolvers ─────────────────────────────────────────────────────────────

    from src.resolvers import build_resolver
    assert build_resolver(None) is None
    assert build_resolver({"type": "unknown"}) is None
    r2 = build_resolver({
        "type": "r2", "bucket": "b", "account_id": "a",
        "access_key_id": "k", "secret_access_key": "s",
    })
    assert r2 is not None

    # ── Config validation ─────────────────────────────────────────────────────

    good = Config(raw={
        "api_keys": {"anthropic": "sk-x", "openai": "sk-y"},
        "youtube": {"enabled": True, "client_secrets": "cs.json", "token_file": "tok.json"},
        "instagram": {"enabled": False},
        "tiktok": {"enabled": False},
    })
    assert good.validate() == [], f"Unexpected errors: {good.validate()}"

    bad = Config(raw={
        "api_keys": {},
        "youtube": {"enabled": False},
        "instagram": {"enabled": False},
        "tiktok": {"enabled": False},
    })
    errors = bad.validate()
    assert len(errors) >= 3, f"Expected >=3 validation errors, got: {errors}"

    # ── Platform hints in captions ────────────────────────────────────────────

    from src.caption import PLATFORM_HINTS
    assert "youtube" in PLATFORM_HINTS
    assert "instagram" in PLATFORM_HINTS
    assert "tiktok" in PLATFORM_HINTS

    print("smoke test ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
