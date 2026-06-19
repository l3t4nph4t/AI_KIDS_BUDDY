"""VyVy — Edge-TTS Service.

Server-side text-to-speech using edge-tts for natural Vietnamese voices.
Generates audio for lesson content (objective, explanation, examples, remember).
"""

import os
import hashlib
import asyncio
from typing import Optional

AUDIO_CACHE_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "data", "audio_cache"
)

DEFAULT_VOICE = "vi-VN-HoaiMyNeural"
MALE_VOICE = "vi-VN-NamMinhNeural"

DEFAULT_RATE = "+10%"
DEFAULT_PITCH = "+50Hz"

VOICE_PRESETS = {
    "ban-nho":     {"label": "Bạn nhỏ",    "pitch": "+50Hz", "rate": "+10%"},
    "vui-tuoi":    {"label": "Vui tươi",   "pitch": "+75Hz", "rate": "+20%"},
    "binh-thuong": {"label": "Bình thường", "pitch": "+25Hz", "rate": "+0%"},
}


def _cache_key(text: str, voice: str, pitch: str, rate: str) -> str:
    h = hashlib.md5(f"{voice}:{pitch}:{rate}:{text}".encode()).hexdigest()
    return os.path.join(AUDIO_CACHE_DIR, f"{h}.mp3")


async def generate_tts(
    text: str,
    voice: str = DEFAULT_VOICE,
    pitch: Optional[str] = None,
    rate: Optional[str] = None,
) -> bytes:
    """Generate audio bytes from text using Edge-TTS."""
    try:
        import edge_tts
    except ImportError:
        raise RuntimeError("edge-tts not installed. Run: pip install edge-tts")

    use_pitch = pitch or DEFAULT_PITCH
    use_rate = rate or DEFAULT_RATE

    cache_path = _cache_key(text, voice, use_pitch, use_rate)
    if os.path.isfile(cache_path):
        with open(cache_path, "rb") as f:
            return f.read()

    os.makedirs(AUDIO_CACHE_DIR, exist_ok=True)

    communicate = edge_tts.Communicate(text, voice, rate=use_rate, pitch=use_pitch)
    audio_data = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data += chunk["data"]

    if audio_data:
        with open(cache_path, "wb") as f:
            f.write(audio_data)

    return audio_data


async def generate_lesson_audio_bytes(
    content: dict, voice: str = DEFAULT_VOICE
) -> bytes:
    """Generate full lesson audio by concatenating sections."""
    lesson = content.get("content", {})
    parts = []

    objective = lesson.get("objective", "")
    if objective:
        parts.append(f"Mục tiêu: {objective}")

    explanation = lesson.get("explanation", "")
    if explanation:
        parts.append(explanation)

    examples = lesson.get("examples", [])
    if examples:
        parts.append("Ví dụ:")
        for i, ex in enumerate(examples, 1):
            parts.append(f"Ví dụ {i}: {ex}")

    remember = lesson.get("remember", "")
    if remember:
        parts.append(f"Ghi nhớ: {remember}")

    full_text = ". ".join(parts)

    if not full_text.strip():
        full_text = "Bài học này chưa có nội dung."

    return await generate_tts(full_text, voice)
