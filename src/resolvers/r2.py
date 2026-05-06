import logging
import uuid
from pathlib import Path
from typing import Optional

import boto3
from botocore.config import Config

log = logging.getLogger(__name__)


class R2Resolver:
    """Upload a video to Cloudflare R2 (S3-compatible) and return a URL the
    Instagram Graph API can fetch.

    Two URL modes:
      - public_base_url set: assume the bucket is exposed at that URL
        (e.g. https://media.example.com or your r2.dev subdomain), return
        f"{public_base_url}/{key}". No presigning. Best for high-volume.
      - public_base_url empty: return a presigned GET URL valid for `ttl`
        seconds. Bucket can stay private. Best for low-volume.

    Cleanup:
      Set a lifecycle rule on the bucket to delete `key_prefix` after 1 day
      so old uploads don't accumulate. We don't delete here because the IG
      container fetch can take a few minutes after publish() returns.
    """

    def __init__(
        self,
        bucket: str,
        access_key_id: str,
        secret_access_key: str,
        account_id: Optional[str] = None,
        endpoint_url: Optional[str] = None,
        region: str = "auto",
        ttl: int = 1800,
        public_base_url: str = "",
        key_prefix: str = "lucidus-temp/",
    ):
        if endpoint_url is None:
            if not account_id:
                raise ValueError("R2Resolver: provide either endpoint_url or account_id")
            endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"
        self.bucket = bucket
        self.ttl = ttl
        self.public_base_url = public_base_url
        self.key_prefix = key_prefix
        self.s3 = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            config=Config(signature_version="s3v4", region_name=region),
        )

    def _key_for(self, path: Path) -> str:
        return f"{self.key_prefix}{uuid.uuid4().hex[:12]}-{path.name}"

    def __call__(self, video: Path) -> str:
        key = self._key_for(video)
        log.info("uploading %s to r2://%s/%s", video.name, self.bucket, key)
        self.s3.upload_file(
            str(video), self.bucket, key,
            ExtraArgs={"ContentType": "video/mp4"},
        )
        if self.public_base_url:
            return f"{self.public_base_url}/{key}"
        return self.s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=self.ttl,
        )
