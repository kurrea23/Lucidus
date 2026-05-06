import itertools
import logging
import threading
from collections import deque
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Iterable

log = logging.getLogger(__name__)
_seq = itertools.count(1)


@dataclass
class Event:
    id: int
    ts: str
    level: str
    kind: str
    message: str
    data: dict


class EventBus:
    def __init__(self, capacity: int = 500):
        self._buf: deque[Event] = deque(maxlen=capacity)
        self._lock = threading.Lock()

    def publish(self, kind: str, message: str, *, level: str = "info", **data) -> Event:
        ev = Event(
            id=next(_seq),
            ts=datetime.now(timezone.utc).isoformat(),
            level=level,
            kind=kind,
            message=message,
            data=data,
        )
        with self._lock:
            self._buf.append(ev)
        log.info("[%s] %s %s", kind, message, data or "")
        return ev

    def since(self, last_id: int) -> Iterable[dict]:
        with self._lock:
            snapshot = [e for e in self._buf if e.id > last_id]
        return [asdict(e) for e in snapshot]

    def latest(self, limit: int = 100) -> list[dict]:
        with self._lock:
            snapshot = list(self._buf)[-limit:]
        return [asdict(e) for e in snapshot]
