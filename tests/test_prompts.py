from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.logging import ChatLogMetadata, configure_logging, log_chat
from app.llm.prompts import SYSTEM_PROMPT, build_messages


def test_build_messages_includes_system_and_user_roles():
    msgs = build_messages("hello")
    assert len(msgs) == 2
    assert msgs[0]["role"] == "system"
    assert msgs[0]["content"] == SYSTEM_PROMPT.strip()
    assert msgs[1]["role"] == "user"
    assert msgs[1]["content"] == "hello"


def test_build_messages_rejects_empty_inputs():
    try:
        build_messages("")
        assert False, "expected ValueError"
    except ValueError:
        pass

    try:
        build_messages("x", system_prompt="   ")
        assert False, "expected ValueError"
    except ValueError:
        pass


def test_log_chat_only_logs_metadata_not_content():
    configure_logging()
    logger = __import__("logging").getLogger("test")

    metadata = ChatLogMetadata(request_id="r1", user_id=None, session_id="s1")

    captured = []

    class _Handler(__import__("logging").Handler):
        def emit(self, record):
            captured.append((record.getMessage(), getattr(record, "request_id", None)))

    h = _Handler()
    logger.addHandler(h)
    logger.setLevel(10)

    log_chat(logger, metadata, direction="in", content="SECRET")

    logger.removeHandler(h)

    assert any("chat" in msg for msg, _ in captured)
