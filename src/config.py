import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv

ENV_PATTERN = re.compile(r"\$\{([A-Z0-9_]+)\}")


def _expand(value: Any) -> Any:
    if isinstance(value, str):
        return ENV_PATTERN.sub(lambda m: os.environ.get(m.group(1), ""), value)
    if isinstance(value, dict):
        return {k: _expand(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_expand(v) for v in value]
    return value


@dataclass
class Config:
    raw: dict

    @classmethod
    def load(cls, path: str = "config.yaml") -> "Config":
        load_dotenv()
        with open(path) as f:
            data = yaml.safe_load(f)
        return cls(raw=_expand(data))

    def __getitem__(self, key: str) -> Any:
        return self.raw[key]

    def get(self, key: str, default: Any = None) -> Any:
        return self.raw.get(key, default)

    @property
    def inbox(self) -> Path:
        return Path(self.raw["paths"]["inbox"])

    @property
    def posted(self) -> Path:
        return Path(self.raw["paths"]["posted"])

    @property
    def failed(self) -> Path:
        return Path(self.raw["paths"]["failed"])

    @property
    def db_path(self) -> Path:
        return Path(self.raw["paths"]["database"])

    def validate(self) -> list[str]:
        """Returns a list of error strings. Empty means config is valid."""
        errors: list[str] = []

        # API keys
        keys = self.raw.get("api_keys", {}) or {}
        if not keys.get("anthropic"):
            errors.append("api_keys.anthropic is missing — set ANTHROPIC_API_KEY in .env")
        if not keys.get("openai"):
            errors.append("api_keys.openai is missing — set OPENAI_API_KEY in .env")

        # At least one platform enabled
        platforms = ("youtube", "instagram", "tiktok")
        enabled = [p for p in platforms if self.raw.get(p, {}).get("enabled")]
        if not enabled:
            errors.append(
                "No platforms enabled. Set enabled: true under youtube, instagram, or tiktok."
            )

        # Platform-specific required fields
        yt = self.raw.get("youtube", {}) or {}
        if yt.get("enabled"):
            if not yt.get("client_secrets"):
                errors.append("youtube.client_secrets is required (path to client_secrets.json)")
            if not yt.get("token_file"):
                errors.append("youtube.token_file is required (path to store OAuth token)")

        ig = self.raw.get("instagram", {}) or {}
        if ig.get("enabled"):
            if not ig.get("access_token"):
                errors.append(
                    "instagram.access_token is missing — set IG_ACCESS_TOKEN in .env"
                )
            if not ig.get("business_account_id"):
                errors.append(
                    "instagram.business_account_id is missing — set IG_BUSINESS_ACCOUNT_ID in .env"
                )
            resolver = ig.get("resolver") or {}
            if not resolver:
                errors.append(
                    "instagram.resolver is required for video hosting (set type: r2 with credentials)"
                )
            elif resolver.get("type") in ("r2", "s3"):
                for field in ("bucket", "access_key_id", "secret_access_key"):
                    if not resolver.get(field):
                        errors.append(f"instagram.resolver.{field} is required")

        tt = self.raw.get("tiktok", {}) or {}
        if tt.get("enabled"):
            if not tt.get("access_token"):
                errors.append("tiktok.access_token is missing — set TIKTOK_ACCESS_TOKEN in .env")
            if not tt.get("open_id"):
                errors.append("tiktok.open_id is missing — set TIKTOK_OPEN_ID in .env")

        # Dashboard auth — if username set, password must also be set
        dash = self.raw.get("dashboard", {}) or {}
        auth = dash.get("auth") or {}
        if auth.get("username") and not auth.get("password"):
            errors.append("dashboard.auth.password is required when dashboard.auth.username is set")

        return errors
