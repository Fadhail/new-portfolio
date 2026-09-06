from __future__ import annotations

import logging
import sys
from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass(frozen=True)
class ChatLogMetadata:
    request_id: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None


def configure_logging(*, level: int = logging.INFO) -> None:
    root = logging.getLogger()
    if root.handlers:
        return

    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s")
    handler.setFormatter(formatter)
    root.addHandler(handler)
    root.setLevel(level)


def log_chat(logger: logging.Logger, metadata: ChatLogMetadata, *, direction: str, content: str) -> None:
    safe_metadata: Dict[str, Any] = {
        "request_id": metadata.request_id,
        "user_id": metadata.user_id,
        "session_id": metadata.session_id,
        "direction": direction,
    }

    logger.info("chat", extra=safe_metadata)
