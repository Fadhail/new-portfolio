from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Sequence


@dataclass(frozen=True)
class RetrievedItem:
    id: str
    score: float
    text: str


def keyword_retrieve(
    query: str,
    documents: Sequence[str],
    *,
    k: int = 5,
) -> List[RetrievedItem]:
    """Retrieve the top-k documents matching query using lightweight keyword scoring.

    Returns an empty list when query is empty or no document has any keyword match.
    """

    if k <= 0:
        return []

    tokens = [t for t in _tokenize(query) if t]
    if not tokens:
        return []

    scored: List[RetrievedItem] = []
    for idx, doc in enumerate(documents):
        doc_text = doc or ""
        score = _score_tokens(tokens, doc_text)
        if score <= 0:
            continue
        scored.append(RetrievedItem(id=str(idx), score=score, text=doc_text))

    scored.sort(key=lambda x: (-x.score, x.id))
    return scored[:k]


def _tokenize(text: str) -> List[str]:
    text = (text or "").lower()
    out: List[str] = []
    current: List[str] = []
    for ch in text:
        if ch.isalnum():
            current.append(ch)
        else:
            if current:
                out.append("".join(current))
                current = []
    if current:
        out.append("".join(current))
    return out


def _score_tokens(tokens: Iterable[str], doc_text: str) -> float:
    text = (doc_text or "").lower()
    score = 0.0
    for t in tokens:
        if not t:
            continue
        if t in text:
            score += 1.0
            if t in text.split():
                score += 0.5
    return score
