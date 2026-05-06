import logging
import time
from pathlib import Path
from typing import Optional

import requests

from .base import Metrics, PublishResult

log = logging.getLogger(__name__)

API = "https://open.tiktokapis.com/v2"


class TikTokPublisher:
    """Publishes via TikTok Content Posting API (Direct Post).

    Requires:
      - TikTok developer app approved for `video.publish` (or unaudited sandbox = SELF_ONLY).
      - User-authorized access_token with `video.publish` scope.
      - For fetch_metrics: token also needs `video.list` scope.
    """

    name = "tiktok"

    def __init__(self, access_token: str, open_id: str, privacy: str = "SELF_ONLY"):
        self.token = access_token
        self.open_id = open_id
        self.privacy = privacy

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"}

    def publish(self, video: Path, caption: str, hashtags: list[str]) -> PublishResult:
        full_caption = (caption + " " + " ".join(f"#{h.lstrip('#')}" for h in hashtags)).strip()[:2200]
        size = video.stat().st_size

        init = requests.post(
            f"{API}/post/publish/video/init/",
            headers={**self._headers(), "Content-Type": "application/json"},
            json={
                "post_info": {
                    "title": full_caption,
                    "privacy_level": self.privacy,
                    "disable_duet": False,
                    "disable_comment": False,
                    "disable_stitch": False,
                },
                "source_info": {
                    "source": "FILE_UPLOAD",
                    "video_size": size,
                    "chunk_size": size,
                    "total_chunk_count": 1,
                },
            },
            timeout=60,
        )
        init.raise_for_status()
        data = init.json()["data"]
        publish_id = data["publish_id"]
        upload_url = data["upload_url"]

        with open(video, "rb") as f:
            up = requests.put(
                upload_url,
                data=f,
                headers={
                    "Content-Type": "video/mp4",
                    "Content-Range": f"bytes 0-{size - 1}/{size}",
                },
                timeout=600,
            )
        up.raise_for_status()

        # Poll until TikTok finishes processing.
        video_id: Optional[str] = None
        deadline = time.time() + 600
        while time.time() < deadline:
            r = requests.post(
                f"{API}/post/publish/status/fetch/",
                headers={**self._headers(), "Content-Type": "application/json"},
                json={"publish_id": publish_id},
                timeout=30,
            ).json()
            status_data = r.get("data", {})
            status = status_data.get("status")
            if status == "PUBLISH_COMPLETE":
                # TikTok returns the real video_id here — use it for metrics later.
                post_ids = status_data.get("publicaly_available_post_id") or []
                video_id = post_ids[0] if post_ids else None
                break
            if status in ("FAILED", "PUBLISH_FAILED"):
                raise RuntimeError(f"TikTok publish failed: {r}")
            time.sleep(5)
        else:
            raise TimeoutError("TikTok publish status never completed")

        # Store the real video_id as remote_id so fetch_metrics works.
        # Fall back to publish_id if TikTok didn't return one (sandbox behaviour).
        remote_id = video_id or publish_id
        return PublishResult(platform=self.name, remote_id=remote_id, permalink="")

    def fetch_metrics(self, remote_id: str) -> Optional[Metrics]:
        """Fetch stats via /v2/video/list/ (requires video.list scope on the token)."""
        try:
            r = requests.post(
                f"{API}/video/list/",
                headers={**self._headers(), "Content-Type": "application/json"},
                json={
                    "fields": ["id", "view_count", "like_count", "comment_count", "share_count"],
                    "filters": {"video_ids": [remote_id]},
                },
                timeout=30,
            )
            r.raise_for_status()
            videos = r.json().get("data", {}).get("videos", [])
            if not videos:
                return None
            v = videos[0]
            return Metrics(
                views=v.get("view_count", 0),
                likes=v.get("like_count", 0),
                comments=v.get("comment_count", 0),
                shares=v.get("share_count", 0),
            )
        except requests.RequestException:
            log.exception("TikTok metrics fetch failed for %s", remote_id)
            return None
