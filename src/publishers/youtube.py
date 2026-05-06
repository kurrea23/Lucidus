import logging
from pathlib import Path
from typing import Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

from .base import Metrics, PublishResult

log = logging.getLogger(__name__)

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
]


class YouTubePublisher:
    name = "youtube"

    def __init__(self, client_secrets: str, token_file: str, category_id: str = "22",
                 privacy_status: str = "public", made_for_kids: bool = False):
        self.client_secrets = client_secrets
        self.token_file = token_file
        self.category_id = category_id
        self.privacy_status = privacy_status
        self.made_for_kids = made_for_kids
        self._service = None

    def health(self) -> dict:
        """Report YouTube setup status without starting the OAuth browser flow."""
        client_path = Path(self.client_secrets)
        token_path = Path(self.token_file)
        if not client_path.exists():
            return {
                "ok": False,
                "setup_required": True,
                "error": f"missing OAuth client secrets file: {client_path}",
            }
        if not token_path.exists():
            return {
                "ok": False,
                "setup_required": True,
                "error": f"missing OAuth token file: {token_path}",
            }
        try:
            creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
        except Exception as exc:
            return {"ok": False, "error": f"invalid OAuth token file: {exc}"[:200]}
        refreshable = bool(creds.expired and creds.refresh_token)
        return {
            "ok": bool(creds.valid or refreshable),
            "token_present": True,
            "token_expired": bool(creds.expired),
            "refreshable": refreshable,
        }

    def _credentials(self) -> Credentials:
        creds: Optional[Credentials] = None
        token_path = Path(self.token_file)
        if token_path.exists():
            creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(self.client_secrets, SCOPES)
                creds = flow.run_local_server(port=0)
            token_path.write_text(creds.to_json())
        return creds

    def service(self):
        if self._service is None:
            self._service = build("youtube", "v3", credentials=self._credentials())
        return self._service

    def publish(self, video: Path, caption: str, hashtags: list[str]) -> PublishResult:
        title = (caption or video.stem)[:95]
        if not title.endswith("#Shorts"):
            title = f"{title} #Shorts"[:100]
        description_lines = [caption or "", "", " ".join(f"#{h.lstrip('#')}" for h in hashtags), "#Shorts"]
        body = {
            "snippet": {
                "title": title,
                "description": "\n".join(description_lines).strip(),
                "tags": [h.lstrip("#") for h in hashtags][:30],
                "categoryId": self.category_id,
            },
            "status": {
                "privacyStatus": self.privacy_status,
                "selfDeclaredMadeForKids": self.made_for_kids,
            },
        }
        media = MediaFileUpload(str(video), chunksize=-1, resumable=True, mimetype="video/*")
        request = self.service().videos().insert(part="snippet,status", body=body, media_body=media)
        response = None
        while response is None:
            status, response = request.next_chunk()
            if status:
                log.info("youtube upload %d%%", int(status.progress() * 100))
        remote_id = response["id"]
        return PublishResult(
            platform=self.name,
            remote_id=remote_id,
            permalink=f"https://youtube.com/shorts/{remote_id}",
        )

    def fetch_metrics(self, remote_id: str) -> Optional[Metrics]:
        try:
            resp = self.service().videos().list(part="statistics", id=remote_id).execute()
            items = resp.get("items", [])
            if not items:
                return None
            s = items[0].get("statistics", {})
            return Metrics(
                views=int(s.get("viewCount", 0)),
                likes=int(s.get("likeCount", 0)),
                comments=int(s.get("commentCount", 0)),
                shares=0,
            )
        except HttpError:
            log.exception("youtube metrics fetch failed")
            return None
