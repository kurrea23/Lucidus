# Lucidus

Drop short videos into a folder. Lucidus transcribes them, writes a caption + hashtags with Claude, posts them to YouTube Shorts (Instagram Reels and TikTok when those API approvals come through), tracks performance, and reposts top performers across platforms after a cooldown.

## Architecture

```
videos/inbox/      -> watched folder; drop .mp4 / .mov / .webm here
videos/posted/     -> moved here after successful ingest
videos/failed/     -> moved here on ingest error
data/metadata.db   -> SQLite: videos, posts, metrics

src/main.py        -> entry point: watcher + scheduler + analytics + reposter
src/watcher.py     -> polls inbox/, hashes file, probes duration
src/caption.py     -> ffmpeg -> Whisper transcript -> Claude caption + hashtags
src/scheduler.py   -> APScheduler drip-poster (daily cap + min spacing)
src/analytics.py   -> pulls per-post metrics on a timer
src/reposter.py    -> finds top-percentile posts and queues them on other platforms
src/publishers/
  youtube.py       -> YouTube Data API v3 (resumable upload)
  instagram.py     -> Graph API v21.0 Reels (needs public video URL)
  tiktok.py        -> Content Posting API (Direct Post, FILE_UPLOAD)
```

## Setup

### 1. Install

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# ffmpeg + ffprobe must be on PATH (used for audio extraction & duration probe)
```

### 2. Configure

```bash
cp config.example.yaml config.yaml
```

Set env vars (or put them in a `.env` file):

```
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...        # for Whisper transcription
IG_ACCESS_TOKEN=...
IG_BUSINESS_ACCOUNT_ID=...
TIKTOK_ACCESS_TOKEN=...
TIKTOK_OPEN_ID=...
```

### 3. Platform credentials

| Platform | What you need | Lead time |
|---|---|---|
| YouTube Shorts | Google Cloud project, enable YouTube Data API v3, OAuth client, download `client_secrets.json` to repo root | same day |
| Instagram Reels | Meta dev app, Instagram Graph API, Business/Creator IG account linked to a FB Page, app review for `instagram_content_publish` | 1-2 weeks |
| TikTok | TikTok for Developers app, request `video.publish` scope, app review (sandbox is `SELF_ONLY` until approved) | 2-4 weeks |

### 4. Run

```bash
python -m src.main config.yaml
```

First run will open a browser for the YouTube OAuth flow and write `token.json`.

### 5. Use

Drop a `.mp4` (or `.mov` / `.webm`) into `videos/inbox/`. Lucidus will:
1. Hash it (dedup) and probe duration.
2. Extract audio, transcribe with Whisper, write a caption + hashtags with Claude.
3. Move the file to `videos/posted/`.
4. Queue it for each enabled platform respecting `max_per_platform_per_day` and `min_minutes_between_posts`.
5. Pull metrics every `pull_interval_hours`.
6. Once a video clears `repost_delay_days` and lands in the top `top_performer_percentile`, queue it on other platforms as a repost.

## Phase status

- [x] Phase 1: folder watcher + caption pipeline + YouTube + analytics + reposter
- [ ] Phase 2: Instagram (needs `public_url_resolver` - wire S3/R2/Cloudinary upload)
- [ ] Phase 3: TikTok (works in sandbox today; goes public after app review)
- [ ] Phase 4: Per-platform caption variants (different hooks per audience)
- [ ] Phase 5: A/B testing (post 2 caption variants, pick the winner for repost)

## Notes

- Snapchat Spotlight has no public posting API. Manual upload only.
- Instagram requires the video file to be at a public HTTPS URL. The publisher takes a `public_url_resolver(path) -> url` callback; wire it to whichever object store you use.
- TikTok in unaudited sandbox forces `privacy_level=SELF_ONLY`. Don't be surprised that no one sees your posts until app review clears.
