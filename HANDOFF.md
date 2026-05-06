# Lucidus — Handoff

Drop a video into a folder. It gets transcribed, captioned, posted to YouTube
Shorts (and Instagram Reels / TikTok when those are wired up), tracked, and
the top performers are reposted across platforms after a cooldown. The whole
thing is operated from a single-page web cockpit served from the same process.

This document is the source of truth for: what's built, how to run it, how
to debug it, and what's left to do.

---

## 1. Architecture

```
                ┌──────────────┐    ┌────────────┐
   user drops ──▶  videos/    │    │            │
   .mp4 file    │  inbox/     │    │  cockpit   │  ← browser
                └──────┬──────┘    │ :8765      │
                       │ poll       └─────┬──────┘
                       ▼                  │ HTTP / SSE
                ┌─────────────┐           │
                │ InboxWatcher│   ┌───────▼─────────┐
                └──────┬──────┘   │   FastAPI app   │
                       │ submit   │   (src/app.py)  │
                       ▼          └───────▲─────────┘
                ┌─────────────┐           │ snapshot()
                │IngestWorker │           │ enqueue()
                │ (threadpool)│           │ pause/resume
                └──────┬──────┘           │
                       │ caption_for_video│
                       ▼                  │
              ffmpeg → Whisper → Claude   │
                       │                  │
                       ▼                  │
                ┌─────────────┐           │
                │ PostScheduler ◀─────────┘
                │  - per-platform queue
                │  - persisted in DB (queue table)
                │  - daily cap + min spacing
                └──────┬──────────────────────┐
                       │                      │
                       ▼                      ▼
                ┌─────────────┐       ┌──────────────┐
                │ YouTube     │       │ Instagram    │
                │ Shorts API  │       │ Graph API    │  → R2 resolver
                │             │       │              │     uploads + presigns
                └─────────────┘       └──────────────┘
                                       (TikTok similar)

                ┌─────────────┐
                │  SQLite     │  videos · posts · metrics · queue
                │  data/*.db  │
                └─────────────┘
                       ▲
                       │ every N hours
                ┌──────┴──────┐
                │ Analytics   │  fetch_metrics() per publisher
                │ Collector   │  → metrics time series
                └──────┬──────┘
                       │ daily
                ┌──────▼──────┐
                │  Reposter   │  top-percentile + cooldown → enqueue on
                └─────────────┘  other platforms (is_repost=true)
```

Everything runs in one Python process started via `python -m src.main`. The
cockpit web server is a uvicorn instance in a daemon thread sharing the same
DB, scheduler, and event bus as the watcher loop.

---

## 2. File map

| Path | Purpose |
|---|---|
| `src/main.py` | Entry point. Loads config, builds publishers, starts watcher + scheduler + analytics + reposter + cockpit. |
| `src/config.py` | YAML loader with `${ENV_VAR}` expansion via `python-dotenv`. |
| `src/db.py` | SQLite layer. Schema, migrations, all CRUD, `top_performers` ranking. |
| `src/events.py` | Thread-safe ring-buffer event bus. Source for the cockpit live feed. |
| `src/watcher.py` | Polls `videos/inbox/`. Hashes + duration-probes new files, calls a callback once they're stable. |
| `src/worker.py` | `ThreadPoolExecutor` wrapper. Watcher submits ingest tasks to it so a slow Whisper call never blocks the scan loop. |
| `src/caption.py` | ffmpeg → Whisper transcription → Claude caption + hashtags (strict JSON). |
| `src/scheduler.py` | Per-platform `PlatformQueue`. Enqueues persist to the DB `queue` table. Drip-posts respecting daily cap + min spacing. Pause/resume + force-drain. Hydrates from DB on startup. |
| `src/analytics.py` | Walks the `posts` table, calls `publisher.fetch_metrics()`, appends a row to `metrics` for every post (time series). |
| `src/reposter.py` | Picks top-percentile performers older than the cooldown, queues them on platforms they haven't been posted to yet, marked `is_repost=true`. |
| `src/app.py` | FastAPI app factory. Every cockpit endpoint lives here. |
| `src/templates/dashboard.html` | The cockpit. One file: HTML + CSS + vanilla JS + EventSource. No build step. |
| `src/publishers/base.py` | `Publisher` protocol + `PublishResult` / `Metrics` dataclasses. |
| `src/publishers/youtube.py` | YouTube Data API v3, resumable upload, statistics fetch. |
| `src/publishers/instagram.py` | Graph API v21.0 Reels publish. Uses a `public_url_resolver` callable to expose the file via HTTPS. |
| `src/publishers/tiktok.py` | Content Posting API Direct Post (FILE_UPLOAD source). |
| `src/resolvers/__init__.py` | `build_resolver(config_block)` factory. |
| `src/resolvers/r2.py` | Cloudflare R2 (S3-compatible) uploader. Returns either a presigned URL or a public-bucket URL. |
| `tests/smoke.py` | Boots the FastAPI app with stubbed publishers, exercises every endpoint and the queue edit/remove flow. CI runs this. |
| `.github/workflows/ci.yml` | Compile-check + smoke test on every push and PR. |
| `config.example.yaml` | Reference config. Copy to `config.yaml` and fill in. |
| `requirements.txt` | Pin-floor dependencies. |

---

## 3. Data flow (what happens when you drop `clip.mp4`)

1. **Watcher** (`InboxWatcher.scan_once`) sees the file in `videos/inbox/`. Waits ~2s to confirm size is stable (file is done writing). Adds the path to its in-memory `_seen` set so it doesn't re-fire.
2. **Worker** (`IngestWorker.submit`) accepts the path. Drops onto a `ThreadPoolExecutor` and returns immediately; the watcher loop continues.
3. The worker thread runs the **ingest handler** (`make_handler` in `main.py`):
   - SHA-256 the file.
   - Look up by SHA. If the video already has a transcript, skip Whisper + Claude entirely and reuse the stored caption + hashtags. Saves money on re-drops.
   - Otherwise: ffprobe duration, insert a `videos` row, run `caption_for_video` (audio extract → Whisper → Claude JSON).
   - `move_to(posted/)` — file leaves the inbox so the watcher won't see it again.
   - `scheduler.enqueue(video_id, path, caption, hashtags)` — for every enabled platform that hasn't already posted this video, insert a `queue` row (persisted in DB) and append a `Job` to the in-memory deque.
4. **Scheduler** ticks every 15 min. For each platform:
   - Skipped if paused.
   - Skipped if `posts_today >= max_per_platform_per_day`.
   - Skipped if last post was less than `min_minutes_between_posts` ago.
   - Otherwise pops the front of the queue and calls `publisher.publish()`. On success: `posts` row written, `queue` row deleted. On failure: `Job` re-prepended, `queue` row stays put.
5. **Analytics** ticks every `pull_interval_hours`. For every post, calls `publisher.fetch_metrics(remote_id)` and appends to the `metrics` table.
6. **Reposter** ticks every 24h. For each platform, finds posts in the top `top_performer_percentile` by views (and stored `engagement_rate`), older than `repost_delay_days`. Enqueues them on the *other* platforms with `is_repost=True`, which lets them bypass the unique constraint on `(video_id, platform, is_repost)`.
7. **Cockpit** receives every state change as an SSE event and re-fetches `/api/stats` + `/api/posts` to update the table without a full reload.

---

## 4. Setup checklist

### Local

```bash
git clone <repo>
cd Lucidus
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# ffmpeg + ffprobe must be on PATH
cp config.example.yaml config.yaml
```

Create `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### YouTube Shorts (works same day)

1. Google Cloud Console → new project.
2. Enable **YouTube Data API v3**.
3. OAuth consent screen → External, add yourself as a test user.
4. Credentials → Create OAuth client ID → Desktop app → download JSON as `client_secrets.json` in the repo root.
5. First run opens a browser; authorize; `token.json` is written. Subsequent runs are silent.

### Instagram Reels (1–2 weeks for review)

1. **Account requirements** (one-time, manual):
   - Convert your IG account to **Business** or **Creator**.
   - Link it to a **Facebook Page** you own.
2. **Meta dev app**:
   - developers.facebook.com → Create App → Business type.
   - Add **Instagram Graph API** product.
   - Submit for App Review with the `instagram_content_publish` permission. Provide a screen recording of the cockpit posting a video. **This takes 1–2 weeks.**
3. **Tokens**:
   - Generate a long-lived Page access token (60 days). Refresh before expiry; not automated yet.
   - `IG_BUSINESS_ACCOUNT_ID` is the numeric ID of the IG account, not the username.
4. **Public URL resolver** — Instagram fetches the video from a public HTTPS URL. We use Cloudflare R2:
   - Cloudflare → R2 → create bucket (e.g. `lucidus-media`).
   - R2 → Manage API tokens → create a token with read/write for that bucket. Save Access Key ID + Secret + Account ID.
   - Add a **lifecycle rule** on the bucket: delete objects with prefix `lucidus-temp/` after 1 day. Uploads accumulate otherwise.
   - Two URL modes — pick one in `config.yaml`:
     - **Presigned** (default): leave `public_base_url` empty. Bucket stays private. URL valid for `presign_ttl_seconds`.
     - **Public**: enable public access on the bucket (or attach a custom domain), set `public_base_url: https://media.example.com`. Cheaper at scale.

### TikTok (2–4 weeks for review)

1. developers.tiktok.com → register → create app.
2. Add **Content Posting API** product, request `video.publish` scope.
3. Submit for review. Until approved, you're in **sandbox**: posts work but `privacy_level` is forced to `SELF_ONLY` — only the posting account can see them. Useful for end-to-end testing.
4. OAuth: `access_token` + `open_id` go in `.env`.

### Snapchat

Skipped intentionally. Spotlight has no public posting API. Manual upload only.

---

## 5. Operational runbook

### Start

```bash
python -m src.main config.yaml
```

You'll see:
```
INFO lucidus :: cockpit at http://127.0.0.1:8765
INFO lucidus :: Lucidus running. Drop videos into videos/inbox
```

Open http://127.0.0.1:8765.

### Stop

`Ctrl+C` (SIGINT). The watcher loop exits, scheduler shuts down. **In-memory queue is safe** — it's persisted; restart restores it from the `queue` table.

### Daily check (30 seconds)

1. Open the cockpit.
2. Look at the **Health** badges in the top bar. Any red → expand the tooltip for the error. Most common is an expired IG access token.
3. Look at the per-platform cards. Any platform showing `cap` → you've hit the daily limit; nothing more posts today.
4. Look at the **Ingest errors** KPI. If non-zero → click `/api/errors` (or check `videos.error` in SQLite) for the failure reason.

### "I want this video posted right now"

1. Cockpit → Queue panel → click the row → modal opens.
2. Edit the caption / hashtags if needed (or hit `Regenerate` for a fresh Claude caption).
3. Hit **save & post now**. This bypasses spacing + cap.

### "This caption is bad"

1. Click the queued row.
2. Edit by hand, save.
3. Or hit **Regenerate** — re-runs Claude on the stored transcript with a different sample.

### "I dropped 20 videos and the platforms are throttled"

The drip cap is doing its job. Either:
- Wait. They'll go out at `min_minutes_between_posts` cadence over the next days.
- Raise `max_per_platform_per_day` in `config.yaml` and restart.
- Force-post specific high-priority ones from the cockpit.

### "Something failed; how do I retry?"

- Failed *ingest* → file is in `videos/failed/`. Cockpit → **retry failed** button moves them all back to inbox.
- Failed *publish* → the job is automatically re-prepended to its queue; the next scheduler tick will retry. Watch the live feed.
- Persistent publish failure → cockpit → **pause** that platform → fix the underlying issue (usually a token) → **resume**.

### Reading the database directly

```bash
sqlite3 data/metadata.db
> .tables
> SELECT id, caption FROM videos ORDER BY id DESC LIMIT 10;
> SELECT v.id, v.caption, p.platform, latest.views FROM videos v
    JOIN posts p ON p.video_id = v.id
    LEFT JOIN (SELECT post_id, MAX(captured_at) AS t FROM metrics GROUP BY post_id) lt ON lt.post_id = p.id
    LEFT JOIN metrics latest ON latest.post_id = p.id AND latest.captured_at = lt.t
    ORDER BY p.posted_at DESC LIMIT 20;
```

---

## 6. Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Cockpit shows `youtube` health red | OAuth token revoked or `client_secrets.json` missing | Delete `token.json`, restart, reauthorize in browser |
| `instagram.resolver is required` on startup | IG enabled but no resolver block | Fill `instagram.resolver` in `config.yaml` with R2 credentials |
| `IG container error: ...` in logs | Public URL not reachable, or video too long/wrong format | Check the URL in your browser; IG Reels needs <90s, MP4, 9:16 ideally |
| TikTok posts succeed but no one sees them | Sandbox mode forces `SELF_ONLY` | Wait for app review approval |
| `ingest.failed` for every file | ffmpeg/ffprobe not on PATH | `brew install ffmpeg` / `apt install ffmpeg` |
| Queue full but nothing posting | All platforms paused, or daily cap hit, or `min_minutes_between_posts` too high | Check the per-platform card. Resume / raise cap / shorten spacing |
| Whisper bills are climbing | Re-dropping the same files | Dedup is by SHA — same content under different filename triggers a new ingest. Move the file rather than re-copy |
| Cockpit "reconnecting…" forever | uvicorn died, parent process didn't notice | Check stderr for an exception in `cockpit` thread; restart the process |
| `queue.hydrated` event on startup followed by missing files | `videos/posted/` was deleted but DB still references those paths | Hydration self-heals: rows pointing to missing files are dropped. Just restart |

---

## 7. Configuration reference

All keys, default values, and effects.

```yaml
paths:
  inbox: videos/inbox          # watched dir
  posted: videos/posted        # successful ingests land here
  failed: videos/failed        # ingest failures land here
  database: data/metadata.db   # SQLite path; created if missing

api_keys:
  anthropic: ${ANTHROPIC_API_KEY}    # required for caption generation
  openai: ${OPENAI_API_KEY}          # required for Whisper

youtube:
  enabled: true
  client_secrets: client_secrets.json
  token_file: token.json
  category_id: "22"            # 22 = People & Blogs; see YouTube docs
  privacy_status: public       # public | unlisted | private
  made_for_kids: false

instagram:
  enabled: false
  access_token: ${IG_ACCESS_TOKEN}
  business_account_id: ${IG_BUSINESS_ACCOUNT_ID}
  resolver:
    type: r2                   # r2 | s3 (s3 uses same R2Resolver class)
    bucket: lucidus-media
    account_id: ${R2_ACCOUNT_ID}
    access_key_id: ${R2_ACCESS_KEY_ID}
    secret_access_key: ${R2_SECRET_ACCESS_KEY}
    presign_ttl_seconds: 1800  # presigned URL validity
    key_prefix: lucidus-temp/  # match this in your R2 lifecycle rule
    public_base_url: ""        # set this to use public bucket URLs instead

tiktok:
  enabled: false
  access_token: ${TIKTOK_ACCESS_TOKEN}
  open_id: ${TIKTOK_OPEN_ID}

posting:
  max_per_platform_per_day: 3        # hard ceiling; cockpit shows "cap"
  min_minutes_between_posts: 90      # drip cadence
  jitter_minutes: 30                 # currently unused; reserved
  ingest_workers: 2                  # concurrent Whisper calls

captions:
  model: claude-sonnet-4-6           # any Claude model id
  max_hashtags: 8
  style: "engaging, hook-first, no clickbait"

analytics:
  pull_interval_hours: 6             # how often to refresh metrics
  top_performer_percentile: 80       # ≥ 80th percentile is "top"
  repost_delay_days: 10              # cooldown before cross-posting

dashboard:
  enabled: true                      # set false to run headless
  host: 127.0.0.1                    # bind addr; CHANGE TO 0.0.0.0 ONLY BEHIND AUTH
  port: 8765
  event_buffer: 500                  # in-memory event ring size
```

---

## 8. Cockpit API reference

All under `http://localhost:8765`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Dashboard HTML |
| GET | `/api/stats` | KPIs, per-platform snapshot, totals |
| GET | `/api/posts?limit=&q=&platform=` | Recent posts + sparkline series + engagement_rate |
| GET | `/api/posts/{id}/series` | Full metrics time series for one post |
| GET | `/api/top?percentile=&since_days=` | Top performers per platform |
| GET | `/api/queue/{id}` | One queued job with its transcript |
| PUT | `/api/queue/{id}` | Edit caption + hashtags. Body: `{"caption": str, "hashtags": [str]}` |
| DELETE | `/api/queue/{id}` | Remove from queue |
| POST | `/api/queue/{id}/regenerate` | Re-run Claude on the stored transcript |
| POST | `/api/queue/{id}/post-now` | Move to front of queue and force-publish |
| POST | `/api/platform/{name}/pause` | Halt that platform's draining |
| POST | `/api/platform/{name}/resume` | Resume draining |
| POST | `/api/platform/{name}/post-now` | Force-publish front of that platform's queue |
| POST | `/api/scan-now` | Trigger an inbox scan immediately |
| POST | `/api/collect-metrics` | Trigger a metrics pull immediately |
| POST | `/api/retry-failed` | Move every file in `failed/` back to `inbox/` |
| GET | `/api/health` | Per-publisher auth check |
| GET | `/api/errors` | Recent ingest errors (`videos.error` rows) |
| GET | `/api/config` | Sanitized config (no `api_keys`) |
| GET | `/api/events` | **SSE stream**. Events: `ingest.started`, `ingest.complete`, `ingest.failed`, `ingest.duplicate`, `queue.enqueued`, `queue.edited`, `queue.removed`, `queue.hydrated`, `caption.regenerated`, `post.success`, `post.failed`, `platform.paused`, `platform.resumed`, `system.*`, `user.*` |

### Keyboard shortcuts

`s` scan inbox · `m` collect metrics · `r` retry failed · `/` focus search · `Esc` close modal

---

## 9. Database schema

```sql
videos       -- one row per content fingerprint
  id, sha256 UNIQUE, source_path, duration_seconds,
  transcript, caption, hashtags, ingested_at,
  error, error_at

posts        -- one row per (video × platform × is_repost) successful post
  id, video_id → videos, platform, remote_id, permalink,
  posted_at, is_repost
  UNIQUE(video_id, platform, is_repost)

metrics      -- time series; one row per pull per post
  id, post_id → posts,
  views, likes, comments, shares, captured_at

queue        -- persistent job queue
  id, video_id → videos, platform, video_path,
  caption, hashtags, is_repost, enqueued_at
  UNIQUE(video_id, platform, is_repost)
```

`top_performers` query: groups posts by id, takes `MAX(views)`, applies a
percentile cutoff, returns rows with `engagement_rate = (likes + comments) / views`.

---

## 10. What's done

- [x] Folder watcher with stable-file detection and SHA-based dedup
- [x] Background ingest worker (Whisper doesn't block the watcher)
- [x] Caption pipeline: ffmpeg → Whisper → Claude (strict JSON)
- [x] Caption reuse on duplicate SHA (no double charges)
- [x] SQLite metadata + metrics time series
- [x] Persistent queue (survives process restart)
- [x] YouTube Shorts publisher (resumable upload + statistics)
- [x] Instagram Reels publisher with R2-backed public URL resolver
- [x] TikTok publisher (sandbox-ready)
- [x] Drip scheduler: per-platform daily cap + min spacing + pause/resume
- [x] Analytics collector
- [x] Cross-platform reposter with cooldown + percentile gating + engagement rate
- [x] Live cockpit: KPIs, platform cards, queue panel with edit modal,
      sparklines, search/filter, health badges, keyboard shortcuts, SSE feed
- [x] CI workflow: compile-check + smoke test (no API keys needed)
- [x] Smoke test that exercises every endpoint and the full queue lifecycle

## 11. What's not done

- [ ] **Per-platform caption variants** — currently one caption per video for all platforms. TikTok hooks differ from YouTube descriptions. Add a `captions` table keyed on `(video_id, platform)` and update `Job.caption` per platform.
- [ ] **A/B caption testing** — post 2 caption variants on the same platform, compare 24h engagement, use the winner for cross-platform reposts.
- [ ] **Snapchat Spotlight** — no public API, intentionally skipped. If they ship one, add `src/publishers/snapchat.py`.
- [ ] **Long-lived IG token refresh** — IG's 60-day Page tokens are not refreshed automatically. Add a daily job that calls `oauth/access_token?grant_type=fb_exchange_token` and rotates the value.
- [ ] **TikTok metrics by `publish_id`** — the API returns a `publish_id` from `publish/init`, but metrics require a `video_id` from `/video/list/`. We need a follow-up job that maps publish_ids to video_ids and stores both. Currently `TikTokPublisher.fetch_metrics` returns `None`.
- [ ] **Cap+jitter** — `jitter_minutes` is in the config but unused. Apply random jitter to the next-allowed-post-time so cadence isn't perfectly periodic (more human-looking).
- [ ] **Video preview in the edit modal** — modal shows transcript only. A `<video>` element pointed at `/posted/<file>` would let the user verify before posting.
- [ ] **Multi-account support** — current design is one account per platform. Multi-account means `posts.account_id`, per-account daily caps, and a per-account view in the cockpit.
- [ ] **Auth on the cockpit** — bound to `127.0.0.1`. To expose it (Tailscale / Cloudflare Tunnel / VPS), add basic auth middleware or session cookies. **Don't expose it raw**.
- [ ] **Backups** — `data/metadata.db` is the only persistent state. Add a daily SQLite `.backup` to a separate location.

---

## 12. Decision log (why things are the way they are)

- **SQLite, not Postgres.** Single-process workload, < 100k rows expected, zero ops cost, file-level backup is trivial. Switch to Postgres only if you go multi-process.
- **In-process cockpit, not a separate service.** The dashboard reads the *exact* in-memory scheduler that's posting. No IPC, no race conditions, no stale views. Trade-off: scaling the cockpit means scaling the worker.
- **SSE, not WebSocket.** One-way push from server to browser. SSE auto-reconnects, works through any HTTP proxy, no extra deps client-side. We never need browser-to-server streaming.
- **Vanilla JS, no framework.** One HTML file, no build step, no `node_modules`. Future maintainers can read it without learning a framework.
- **Job queue persisted in DB, not Redis.** One less infra dep. SQLite is fast enough for our throughput (drip-posting, not high-frequency).
- **Whisper API, not local Whisper.** We pay per minute of audio but skip GPU setup. Switch to local if cost > $50/month.
- **Claude for captions, not OpenAI.** Better at following the strict-JSON instruction. Keep both keys around — Whisper is OpenAI-only.
- **R2 over S3.** No egress fees (matters because IG fetches the video). S3-compatible API, so `R2Resolver` works for either with `endpoint_url` set.
- **Presigned URLs default.** Bucket can stay private. For high volume, switch to a public bucket via `public_base_url`.
- **`is_repost` in the unique constraint.** Lets the same video have two `posts` rows for the same platform — original + one repost — without contortion.
- **Drip cadence + jitter (planned).** Posting 5 videos in 10 minutes triggers spam heuristics on every platform. The cap is the most important reach mechanic.
- **Cooldown on cross-platform reposts.** Audio-fingerprint detection on TikTok and IG penalizes same-day duplicates. 10 days is conservative; 7 is usually fine.

---

## 13. Quick reference for the next person

```bash
# Start
python -m src.main config.yaml

# Run tests
python tests/smoke.py

# Inspect DB
sqlite3 data/metadata.db

# What's in the queue right now?
sqlite3 data/metadata.db "SELECT id, platform, caption FROM queue;"

# What failed to ingest?
sqlite3 data/metadata.db "SELECT id, source_path, error FROM videos WHERE error IS NOT NULL;"

# Which posts are top performers?
curl localhost:8765/api/top | jq

# Force-scan the inbox
curl -X POST localhost:8765/api/scan-now

# Pause Instagram for the day
curl -X POST localhost:8765/api/platform/instagram/pause
```

End of handoff. PR: https://github.com/kurrea23/Lucidus/pull/1
