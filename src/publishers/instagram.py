import json
import logging
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import requests

from .base import Metrics, PublishResult

log = logging.getLogger(__name__)

GRAPH = "https://graph.facebook.com/v21.0"
IG_REFRESH = "https://graph.instagram.com/refresh_access_token"


class InstagramPublisher:
    """Publishes Reels via the Instagram Graph API.

    Requires:
      - Instagram Business or Creator account linked to a Facebook Page
      - Meta app reviewed for `instagram_content_publish`
      - A public HTTPS URL for the video (set public_url_resolver)

    Token management:
      Long-lived tokens expire in 60 days. Pass `token_file` to persist refreshed
      tokens across restarts, then call `refresh_token()` or let the background
      scheduler do it every 45 days.
    """

    name = "instagram"

    def __init__(
        self,
        access_token: str,
        business_account_id: str,
        public_url_resolver=None,
        token_file: Optional[str] = None,
    ):
        self.token = access_token
        self.ig_id = business_account_id
        self.public_url_resolver = public_url_resolver
        self._token_file = Path(token_file) if token_file else None

        # Load persisted token (may be newer than the one in config/env).
        if self._token_file and self._token_file.exists():
            try:
                data = json.loads(self._token_file.read_text())
                if data.get("access_token"):
                    self.token = data["access_token"]
                    log.info("Loaded Instagram token from %s", self._token_file)
            except Exception:
                log.warning("Could not read Instagram token file %s", self._token_file)

    # ------------------------------------------------------------------
    # Token management
    # ------------------------------------------------------------------

    def refresh_token(self) -> dict:
        """Refresh the long-lived token (extends expiry by 60 days).
        Persists the new token to token_file if configured.
        """
        r = requests.get(
            IG_REFRESH,
            params={"grant_type": "ig_refresh_token", "access_token": self.token},
            timeout=30,
        )
        r.raise_for_status()
        data = r.json()
        self.token = data["access_token"]
        if self._token_file:
            self._token_file.parent.mkdir(parents=True, exist_ok=True)
            self._token_file.write_text(json.dumps({
                "access_token": self.token,
                "token_type": data.get("token_type", "bearer"),
                "expires_in": data.get("expires_in", 5183944),
                "refreshed_at": datetime.now(timezone.utc).isoformat(),
            }, indent=2))
            log.info("Instagram token refreshed and saved to %s", self._token_file)
        return data

    def token_status(self) -> dict:
        """Returns token validity and days remaining (if token_file is set)."""
        try:
            r = requests.get(
                f"{GRAPH}/me",
                params={"fields": "id,name", "access_token": self.token},
                timeout=15,
            )
            if r.status_code != 200:
                err = r.json().get("error", {})
                return {"valid": False, "error": err.get("message", "unknown")}

            result: dict = {"valid": True, "ig_id": r.json().get("id")}
            if self._token_file and self._token_file.exists():
                try:
                    tdata = json.loads(self._token_file.read_text())
                    refreshed_at = tdata.get("refreshed_at")
                    expires_in = int(tdata.get("expires_in", 5183944))
                    if refreshed_at:
                        expires_dt = datetime.fromisoformat(refreshed_at) + timedelta(seconds=expires_in)
                        days_left = int((expires_dt - datetime.now(timezone.utc)).total_seconds() / 86400)
                        result["days_remaining"] = days_left
                        result["expires_at"] = expires_dt.isoformat()
                        if days_left < 10:
                            result["warning"] = f"Token expires in {days_left} days — refresh soon"
                except Exception:
                    pass
            return result
        except requests.RequestException as exc:
            return {"valid": False, "error": str(exc)[:200]}

    # ------------------------------------------------------------------
    # Publishing
    # ------------------------------------------------------------------

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
