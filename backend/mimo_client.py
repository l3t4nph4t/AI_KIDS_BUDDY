import os
import httpx
import json

# NOTE: env vars are injected by Dokploy at runtime — no dotenv needed

MIMO_TOKEN_KEY = os.getenv("MIMO_TOKEN_PLAN_KEY") or os.getenv("MIMO_API_KEY", "")
MIMO_BASE_URL = os.getenv("MIMO_BASE_URL", "https://token-plan-sgp.xiaomimimo.com/v1")
MIMO_ENDPOINT_ENV = os.getenv("MIMO_ENDPOINT", "")

if MIMO_ENDPOINT_ENV:
    MIMO_ENDPOINT = MIMO_ENDPOINT_ENV
else:
    base_url_clean = MIMO_BASE_URL.rstrip('/')
    if base_url_clean.endswith('/chat/completions'):
        MIMO_ENDPOINT = base_url_clean
    else:
        MIMO_ENDPOINT = base_url_clean + '/chat/completions'

MIMO_MODEL = os.getenv("MIMO_MODEL", "MiMo-V2.5-Pro")


async def call_mimo(system_prompt: str, user_message: str, history: list = None) -> str:
    """Call MIMO API with system prompt, optional history, and user message."""

    if not MIMO_TOKEN_KEY:
        return "Hệ thống chưa cấu hình. Báo phụ huynh kiểm tra giúp nhé!"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {MIMO_TOKEN_KEY}",
    }

    messages = [{"role": "system", "content": system_prompt}]

    if history:
        for msg in history[-8:]:
            if isinstance(msg, dict) and msg.get("role") and msg.get("content"):
                messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": user_message})

    payload = {
        "model": MIMO_MODEL,
        "messages": messages,
        "max_tokens": 300,
        "temperature": 0.75,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            MIMO_ENDPOINT,
            headers=headers,
            json=payload,
        )

        if response.status_code != 200:
            raise RuntimeError(
                f"MIMO API returned {response.status_code}: {response.text}"
            )

        data = response.json()

        try:
            return data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError):
            return "Mình chưa hiểu câu hỏi, bạn thử nói lại nhé!"
