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
