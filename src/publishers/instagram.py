import logging
import time
from pathlib import Path
from typing import Optional

import requests

from .base import Metrics, PublishResult

log = logging.getLogger(__name__)

GRAPH = "https://graph.facebook.com/v21.0"


class InstagramPublisher:
    """Publishes Reels via the Instagram Graph API.

    Requires:
      - Instagram Business or Creator account linked to a Facebook Page
      - Meta app reviewed for `instagram_content_publish`
      - The video file must be reachable via a public HTTPS URL
        (set `public_url_resolver` to a callable that uploads to your CDN/S3
        and returns the URL — without that, IG cannot fetch the file).
    """

    name = "instagram"

    def __init__(self, access_token: str, business_account_id: str,
                 public_url_resolver=None):
        self.token = access_token
        self.ig_id = business_account_id
        self.public_url_resolver = public_url_resolver

    def publish(self, video: Path, caption: str, hashtags: list[str]) -> PublishResult:
        if self.public_url_resolver is None:
            raise RuntimeError(
                "InstagramPublisher requires a public_url_resolver(video_path) -> https URL. "
                "Wire one up that uploads to S3/R2/Cloudinary and returns the URL."
            )
        public_url = self.public_url_resolver(video)
        full_caption = caption + "\n\n" + " ".join(f"#{h.lstrip('#')}" for h in hashtags)

        create = requests.post(
            f"{GRAPH}/{self.ig_id}/media",
            data={
                "media_type": "REELS",
                "video_url": public_url,
                "caption": full_caption.strip(),
                "access_token": self.token,
            },
            timeout=60,
        )
        create.raise_for_status()
        container_id = create.json()["id"]

        deadline = time.time() + 300
        while time.time() < deadline:
            status = requests.get(
                f"{GRAPH}/{container_id}",
                params={"fields": "status_code", "access_token": self.token},
                timeout=30,
            ).json()
            code = status.get("status_code")
            if code == "FINISHED":
                break
            if code == "ERROR":
                raise RuntimeError(f"IG container error: {status}")
            time.sleep(5)
        else:
            raise TimeoutError("IG media container never finished processing")

        publish = requests.post(
            f"{GRAPH}/{self.ig_id}/media_publish",
            data={"creation_id": container_id, "access_token": self.token},
            timeout=60,
        )
        publish.raise_for_status()
        media_id = publish.json()["id"]
        meta = requests.get(
            f"{GRAPH}/{media_id}",
            params={"fields": "permalink", "access_token": self.token},
            timeout=30,
        ).json()
        return PublishResult(
            platform=self.name,
            remote_id=media_id,
            permalink=meta.get("permalink", ""),
        )

    def fetch_metrics(self, remote_id: str) -> Optional[Metrics]:
        try:
            r = requests.get(
                f"{GRAPH}/{remote_id}/insights",
                params={
                    "metric": "plays,likes,comments,shares",
                    "access_token": self.token,
                },
                timeout=30,
            )
            r.raise_for_status()
            values = {row["name"]: row["values"][0]["value"] for row in r.json().get("data", [])}
            return Metrics(
                views=values.get("plays", 0),
                likes=values.get("likes", 0),
                comments=values.get("comments", 0),
                shares=values.get("shares", 0),
            )
        except requests.RequestException:
            log.exception("IG metrics fetch failed")
            return None
