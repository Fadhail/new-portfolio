from __future__ import annotations

from dataclasses import dataclass, field
from threading import Lock
from typing import Callable, Deque, Optional
from collections import deque


@dataclass
class FixedWindowRateLimiter:
    max_requests: int
    window_seconds: float
    now_fn: Callable[[], float] = field(default_factory=lambda: __import__("time").time)

    _lock: Lock = field(default_factory=Lock, init=False, repr=False)
    _window_start: Optional[float] = field(default=None, init=False)
    _count: int = field(default=0, init=False)

    def allow(self) -> bool:
        now = float(self.now_fn())
        with self._lock:
            if self._window_start is None or now - self._window_start >= self.window_seconds:
                self._window_start = now
                self._count = 0

            if self._count >= self.max_requests:
                return False

            self._count += 1
            return True
