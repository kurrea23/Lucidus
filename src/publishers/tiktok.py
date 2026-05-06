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
      - TikTok developer app approved for `video.publish` (or unaudited sandbox = SELF_ONLY visibility).
      - User-authorized `access_token` with `video.publish` scope.
      - This implementation uses the FILE_UPLOAD source. For PULL_FROM_URL, swap
        the init request payload — see TikTok docs.
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

        deadline = time.time() + 600
        while time.time() < deadline:
            r = requests.post(
                f"{API}/post/publish/status/fetch/",
                headers={**self._headers(), "Content-Type": "application/json"},
                json={"publish_id": publish_id},
                timeout=30,
            ).json()
            status = r.get("data", {}).get("status")
            if status == "PUBLISH_COMPLETE":
                break
            if status in ("FAILED", "PUBLISH_FAILED"):
                raise RuntimeError(f"TikTok publish failed: {r}")
            time.sleep(5)
        else:
            raise TimeoutError("TikTok publish status never completed")

        return PublishResult(platform=self.name, remote_id=publish_id, permalink="")

    def fetch_metrics(self, remote_id: str) -> Optional[Metrics]:
        log.warning("TikTok metrics by publish_id not directly supported; needs video_id from /video/list/.")
        return None
