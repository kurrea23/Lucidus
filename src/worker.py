import logging
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from threading import Lock
from typing import Callable

log = logging.getLogger(__name__)


class IngestWorker:
    """Run ingest tasks off the watcher thread so Whisper/LLM calls don't
    block subsequent inbox scans."""

    def __init__(self, handler: Callable[[Path], None], max_workers: int = 2):
        self._exec = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="ingest")
        self._handler = handler
        self._lock = Lock()
        self._inflight: set[str] = set()

    def submit(self, path: Path) -> bool:
        key = str(path.resolve())
        with self._lock:
            if key in self._inflight:
                return False
            self._inflight.add(key)
        self._exec.submit(self._run, path, key)
        return True

    def _run(self, path: Path, key: str) -> None:
        try:
            self._handler(path)
        except Exception:
            log.exception("ingest worker crashed for %s", path)
        finally:
            with self._lock:
                self._inflight.discard(key)

    def shutdown(self) -> None:
        self._exec.shutdown(wait=False, cancel_futures=True)
