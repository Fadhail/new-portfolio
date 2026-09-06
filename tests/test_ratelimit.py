from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.ratelimit import FixedWindowRateLimiter


class FakeNow:
    def __init__(self, t: float):
        self.t = t

    def __call__(self) -> float:
        return self.t


def test_fixed_window_allows_up_to_max_requests_within_window():
    now = FakeNow(0.0)
    limiter = FixedWindowRateLimiter(max_requests=2, window_seconds=10.0, now_fn=now)

    assert limiter.allow() is True
    assert limiter.allow() is True
    assert limiter.allow() is False


def test_fixed_window_resets_after_window_elapsed():
    now = FakeNow(0.0)
    limiter = FixedWindowRateLimiter(max_requests=2, window_seconds=10.0, now_fn=now)

    assert limiter.allow() is True
    assert limiter.allow() is True
    assert limiter.allow() is False

    now.t = 10.0
    assert limiter.allow() is True
    assert limiter.allow() is True
    assert limiter.allow() is False
