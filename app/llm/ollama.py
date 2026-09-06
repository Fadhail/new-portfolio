from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import httpx


class OllamaUnavailable(RuntimeError):
    pass


@dataclass(frozen=True)
class OllamaClient:
    base_url: str
    model: str
    timeout: float
    temperature: float
    num_predict: int
    num_ctx: int
    transport: Optional[httpx.BaseTransport] = None

    def _http_client(self) -> httpx.Client:
        headers = {"Content-Type": "application/json"}
        base_url = (self.base_url or "").rstrip("/")
        return httpx.Client(
            base_url=base_url,
            timeout=self.timeout,
            headers=headers,
            transport=self.transport,
        )

    def chat(self, messages: List[Dict[str, str]]) -> str:
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": self.temperature,
                "num_predict": self.num_predict,
                "num_ctx": self.num_ctx,
            },
        }

        with self._http_client() as client:
            try:
                resp = client.post("/api/chat", json=payload)
            except (httpx.RequestError, httpx.TimeoutException) as e:
                raise OllamaUnavailable("Ollama is unavailable") from e

        if resp.status_code != 200:
            raise OllamaUnavailable(f"Ollama returned status {resp.status_code}")

        data = resp.json()
        # ollama may return {'message': {'content': '...'}}
        message = data.get("message") or {}
        content = message.get("content")
        if isinstance(content, str) and content.strip():
            return content

        # fallback: some variants return {'response': '...'}
        response_text = data.get("response")
        if isinstance(response_text, str):
            return response_text

        return ""

    def ping(self) -> bool:
        with self._http_client() as client:
            try:
                resp = client.get("/api/tags")
            except (httpx.RequestError, httpx.TimeoutException) as e:
                raise OllamaUnavailable("Ollama is unavailable") from e

        if resp.status_code == 200:
            return True
        return False
