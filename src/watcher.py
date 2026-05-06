import hashlib
import logging
import shutil
import subprocess
import time
from pathlib import Path
from typing import Callable, Optional

VIDEO_EXTS = {".mp4", ".mov", ".m4v", ".webm", ".mkv"}
log = logging.getLogger(__name__)


def sha256_file(path: Path, chunk_size: int = 1 << 20) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(chunk_size), b""):
            h.update(chunk)
    return h.hexdigest()


def probe_duration(path: Path) -> Optional[float]:
    try:
        out = subprocess.check_output(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(path),
            ],
            stderr=subprocess.DEVNULL,
        )
        return float(out.strip())
    except (subprocess.CalledProcessError, FileNotFoundError, ValueError):
        return None


def file_is_stable(path: Path, wait: float = 2.0) -> bool:
    s1 = path.stat().st_size
    time.sleep(wait)
    return path.exists() and path.stat().st_size == s1 and s1 > 0


def move_to(path: Path, dest_dir: Path) -> Path:
    dest_dir.mkdir(parents=True, exist_ok=True)
    target = dest_dir / path.name
    n = 1
    while target.exists():
        target = dest_dir / f"{path.stem}_{n}{path.suffix}"
        n += 1
    shutil.move(str(path), target)
    return target


class InboxWatcher:
    def __init__(self, inbox: Path, on_new: Callable[[Path], None], poll_seconds: int = 10):
        self.inbox = inbox
        self.on_new = on_new
        self.poll_seconds = poll_seconds
        self._seen: set[str] = set()

    def scan_once(self) -> None:
        self.inbox.mkdir(parents=True, exist_ok=True)
        for path in sorted(self.inbox.iterdir()):
            if path.is_dir() or path.suffix.lower() not in VIDEO_EXTS:
                continue
            key = str(path.resolve())
            if key in self._seen:
                continue
            if not file_is_stable(path):
                continue
            self._seen.add(key)
            try:
                self.on_new(path)
            except Exception:
                log.exception("on_new failed for %s", path)

    def run_forever(self) -> None:
        log.info("watching %s every %ss", self.inbox, self.poll_seconds)
        while True:
            self.scan_once()
            time.sleep(self.poll_seconds)
