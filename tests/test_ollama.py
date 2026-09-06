from __future__ import annotations

import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.llm.ollama import OllamaClient, OllamaUnavailable


def test_chat_posts_expected_payload_and_returns_content():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["method"] = request.method
        captured["json"] = __import__("json").loads(request.content.decode())
        return httpx.Response(
            200,
            json={"message": {"content": "hello from ollama"}},
        )

    transport = httpx.MockTransport(handler)
    client = OllamaClient(
        base_url="http://localhost:11434",
        model="llama3",
        timeout=5.0,
        temperature=0.2,
        num_predict=64,
        num_ctx=2048,
        transport=transport,
    )

    out = client.chat([{"role": "user", "content": "hi"}])
    assert out == "hello from ollama"
    assert captured["method"] == "POST"
    assert captured["json"]["model"] == "llama3"
    assert captured["json"]["messages"] == [{"role": "user", "content": "hi"}]
    assert captured["json"]["options"]["temperature"] == 0.2
    assert captured["json"]["options"]["num_predict"] == 64
    assert captured["json"]["options"]["num_ctx"] == 2048


def test_ping_returns_true_on_200():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "GET"
        assert str(request.url).endswith("/api/tags")
        return httpx.Response(200, json={"models": []})

    transport = httpx.MockTransport(handler)
    client = OllamaClient(
        base_url="http://localhost:11434",
        model="llama3",
        timeout=5.0,
        temperature=0.2,
        num_predict=64,
        num_ctx=2048,
        transport=transport,
    )

    assert client.ping() is True


def test_chat_raises_ollama_unavailable_on_non_200():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"error": "boom"})

    transport = httpx.MockTransport(handler)
    client = OllamaClient(
        base_url="http://localhost:11434",
        model="llama3",
        timeout=5.0,
        temperature=0.2,
        num_predict=64,
        num_ctx=2048,
        transport=transport,
    )

    try:
        client.chat([{"role": "user", "content": "hi"}])
        assert False, "expected OllamaUnavailable"
    except OllamaUnavailable:
        pass
