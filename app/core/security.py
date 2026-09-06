from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


INJECTION_PATTERNS = [
    "\n\n",
    "\r\n\r\n",
    "###",
    "<|",
    "</|",
    "{{",
    "}}",
    "<script",
    "javascript:",
    "onerror=",
    "onload=",
    "prompt injection",
    "system prompt",
    "ignore previous",
    "disregard previous",
    "reveal previous",
    "act as",
    "developer:",
    "assistant:",
    "user:",
]


FADEL_TERMS = [
    "fadel",
    "fahdal",
    "mochammad",
    "fijratullah",
    "profile",
    "bio",
    "resume",
    "curriculum vitae",
    "cv",
]


OFF_TOPIC_HINTS = [
    "how to",
    "write a",
    "give me",
    "explain",
    "summarize",
    "translate",
    "code",
    "example",
    "essay",
    "homework",
    "assignment",
]


LEAK_MARKERS = [
    "system prompt",
    "developer prompt",
    "internal",
    "secret",
    "api key",
    "token",
    "password",
    "environment",
]


@dataclass(frozen=True)
class InjectionDecision:
    is_injection: bool
    is_off_topic: bool


def is_injection(text: str) -> bool:
    t = (text or "").lower()
    if not t.strip():
        return False

    if any(marker.lower() in t for marker in LEAK_MARKERS):
        return True

    if any(p.lower() in t for p in INJECTION_PATTERNS):
        return True

    if any(term.lower() in t for term in FADEL_TERMS) and ("ignore" in t or "previous" in t):
        return True

    return False


def is_off_topic(text: str) -> bool:
    t = (text or "").lower()
    if not t.strip():
        return False

    if "fadel" in t and any(hint in t for hint in OFF_TOPIC_HINTS):
        return True

    if any(hint in t for hint in OFF_TOPIC_HINTS):
        return True

    return False


def filter_output(text: str) -> Optional[str]:
    t = text or ""
    if any(marker.lower() in t.lower() for marker in LEAK_MARKERS):
        return None

    if is_injection(t) or is_off_topic(t):
        return None

    stripped = t.strip()
    return stripped if stripped else None
