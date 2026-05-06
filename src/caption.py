import json
import logging
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import anthropic
from openai import OpenAI

log = logging.getLogger(__name__)

# Platform-specific prompt additions appended after the base style.
PLATFORM_HINTS: dict[str, str] = {
    "youtube": (
        "This is for YouTube Shorts: put the hook in the first 5 words because viewers "
        "see the title before clicking. 3–5 hashtags max. Always include #Shorts."
    ),
    "instagram": (
        "This is for Instagram Reels: conversational and relatable tone. "
        "Emojis add personality — use 1–3 where they fit. 5–10 hashtags."
    ),
    "tiktok": (
        "This is for TikTok: punchy, lowercase feel is fine, trend-aware. "
        "3–5 hashtags inline. Keep it under 100 characters for the caption."
    ),
}


@dataclass
class CaptionResult:
    transcript: str
    caption: str
    hashtags: list[str]

    @property
    def hashtag_str(self) -> str:
        return " ".join(f"#{h.lstrip('#')}" for h in self.hashtags)


def extract_audio(video: Path) -> Path:
    audio = Path(tempfile.mkstemp(suffix=".mp3")[1])
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000",
         "-b:a", "64k", str(audio)],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    return audio


def transcribe(video: Path, openai_key: str) -> str:
    client = OpenAI(api_key=openai_key)
    audio = extract_audio(video)
    try:
        with open(audio, "rb") as f:
            resp = client.audio.transcriptions.create(model="whisper-1", file=f)
        return resp.text or ""
    finally:
        audio.unlink(missing_ok=True)


CAPTION_PROMPT = """You write short-form video captions for social media.

Transcript of the video:
\"\"\"
{transcript}
\"\"\"

Base style: {style}
Platform guidance: {platform_hint}

Return strict JSON with this shape and nothing else:
{{
  "caption": "<= 150 chars, hook-first, no hashtags inside the caption>",
  "hashtags": ["tag1", "tag2", ...up to {max_tags} relevant tags, no leading #"]
}}"""


def generate_caption(
    transcript: str,
    anthropic_key: str,
    model: str = "claude-sonnet-4-6",
    max_hashtags: int = 8,
    style: str = "engaging, hook-first, no clickbait",
    platform: Optional[str] = None,
) -> tuple[str, list[str]]:
    if not transcript.strip():
        return ("", [])
    platform_hint = PLATFORM_HINTS.get(platform or "", "Generic short-form video.")
    client = anthropic.Anthropic(api_key=anthropic_key)
    msg = client.messages.create(
        model=model,
        max_tokens=400,
        messages=[{
            "role": "user",
            "content": CAPTION_PROMPT.format(
                transcript=transcript[:4000],
                style=style,
                platform_hint=platform_hint,
                max_tags=max_hashtags,
            ),
        }],
    )
    text = "".join(b.text for b in msg.content if hasattr(b, "text")).strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        log.warning("caption model returned non-JSON: %r", text[:200])
        return (transcript[:140], [])
    data = json.loads(text[start : end + 1])
    return (data.get("caption", "")[:150], data.get("hashtags", [])[:max_hashtags])


def caption_for_video(
    video: Path,
    cfg: dict,
    platform: Optional[str] = None,
) -> CaptionResult:
    api = cfg["api_keys"]
    cap_cfg = cfg.get("captions", {}) or {}

    # Allow per-platform style overrides in config under captions.platform_styles.<name>
    platform_styles = cap_cfg.get("platform_styles") or {}
    style = platform_styles.get(platform or "", cap_cfg.get("style", "engaging, hook-first, no clickbait"))

    transcript = transcribe(video, api["openai"]) if api.get("openai") else ""
    caption, tags = generate_caption(
        transcript=transcript,
        anthropic_key=api["anthropic"],
        model=cap_cfg.get("model", "claude-sonnet-4-6"),
        max_hashtags=cap_cfg.get("max_hashtags", 8),
        style=style,
        platform=platform,
    )
    return CaptionResult(transcript=transcript, caption=caption, hashtags=tags)
