from typing import Optional, Protocol
from pathlib import Path


class PublicURLResolver(Protocol):
    def __call__(self, video: Path) -> str: ...


def build_resolver(cfg_block: Optional[dict]) -> Optional[PublicURLResolver]:
    if not cfg_block:
        return None
    rtype = (cfg_block.get("type") or "").lower()
    if rtype in ("r2", "s3"):
        from .r2 import R2Resolver
        return R2Resolver(
            bucket=cfg_block["bucket"],
            access_key_id=cfg_block["access_key_id"],
            secret_access_key=cfg_block["secret_access_key"],
            account_id=cfg_block.get("account_id"),
            endpoint_url=cfg_block.get("endpoint_url"),
            region=cfg_block.get("region", "auto"),
            ttl=int(cfg_block.get("presign_ttl_seconds", 1800)),
            public_base_url=cfg_block.get("public_base_url", "").rstrip("/"),
            key_prefix=cfg_block.get("key_prefix", "lucidus-temp/"),
        )
    return None
