from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Protocol


@dataclass
class PublishResult:
    platform: str
    remote_id: str
    permalink: str


@dataclass
class Metrics:
    views: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0


class Publisher(Protocol):
    name: str

    def publish(self, video: Path, caption: str, hashtags: list[str]) -> PublishResult: ...

    def fetch_metrics(self, remote_id: str) -> Optional[Metrics]: ...
