import json
import logging
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

import anthropic
from openai import OpenAI

log = logging.getLogger(__name__)


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


CAPTION_PROMPT = """You write short-form video captions for TikTok, Reels, and YouTube Shorts.

Transcript of the video:
\"\"\"
{transcript}
\"\"\"

Style: {style}

Return strict JSON with this shape and nothing else:
{{
  "caption": "<= 150 chars, hook-first, no emojis unless they add meaning, no hashtags inside the caption>",
  "hashtags": ["tag1", "tag2", ...up to {max_tags} relevant tags, no leading #"]
}}"""


def generate_caption(
    transcript: str,
    anthropic_key: str,
    model: str = "claude-sonnet-4-6",
    max_hashtags: int = 8,
    style: str = "engaging, hook-first, no clickbait",
) -> tuple[str, list[str]]:
    if not transcript.strip():
        return ("", [])
    client = anthropic.Anthropic(api_key=anthropic_key)
    msg = client.messages.create(
        model=model,
        max_tokens=400,
        messages=[{
            "role": "user",
            "content": CAPTION_PROMPT.format(
                transcript=transcript[:4000],
                style=style,
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


def caption_for_video(video: Path, cfg: dict) -> CaptionResult:
    api = cfg["api_keys"]
    cap_cfg = cfg.get("captions", {})
    transcript = transcribe(video, api["openai"]) if api.get("openai") else ""
    caption, tags = generate_caption(
        transcript=transcript,
        anthropic_key=api["anthropic"],
        model=cap_cfg.get("model", "claude-sonnet-4-6"),
        max_hashtags=cap_cfg.get("max_hashtags", 8),
        style=cap_cfg.get("style", "engaging, hook-first, no clickbait"),
    )
    return CaptionResult(transcript=transcript, caption=caption, hashtags=tags)
