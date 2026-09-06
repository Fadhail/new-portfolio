from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.knowledge.retrieval import keyword_retrieve


def test_returns_empty_when_query_empty():
    docs = ["hello world", "another doc"]
    assert keyword_retrieve("", docs, k=5) == []


def test_returns_empty_when_no_keyword_match():
    docs = ["hello world", "another doc"]
    assert keyword_retrieve("nomatch", docs, k=5) == []


def test_retrieves_top_k_by_keyword_score():
    docs = [
        "fast brown fox",
        "fast fox",
        "slow turtle",
    ]
    result = keyword_retrieve("fast fox", docs, k=2)
    assert len(result) == 2
    assert result[0].text == "fast brown fox"
    assert result[1].text == "fast fox"


def test_k_limit_and_zero_k():
    docs = ["a b c", "a b", "b c"]
    assert keyword_retrieve("a", docs, k=0) == []
    result = keyword_retrieve("a", docs, k=1)
    assert len(result) == 1
    assert result[0].text in {"a b c", "a b"}
