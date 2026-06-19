"""
Generate lesson content for all daily learning units (Grades 1-5).
Calls MIMO API to create short lesson explanations, examples, exercises.
Saves to backend/data/curriculum/grade_{N}/lesson_content.json

Usage: python scripts/generate_lesson_content.py
"""

import json
import logging
import os
import re
import sys
import asyncio
import httpx
from datetime import datetime, timezone

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Load .env file
try:
    from dotenv import load_dotenv
    _env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.isfile(_env_path):
        load_dotenv(_env_path, override=True)
except ImportError:
    pass

# ── Config ──────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_ROOT, "backend", "data")
CURRICULUM_DIR = os.path.join(DATA_DIR, "curriculum")

MIMO_TOKEN_KEY = os.getenv("MIMO_TOKEN_PLAN_KEY") or os.getenv("MIMO_API_KEY", "")
MIMO_BASE_URL = os.getenv("MIMO_BASE_URL", "https://token-plan-sgp.xiaomimimo.com/v1")
MIMO_MODEL = os.getenv("MIMO_MODEL", "MiMo-V2.5-Pro")

MAX_CONCURRENT = 3
MAX_RETRIES = 5
RETRY_DELAY_BASE = 2.0
RETRY_DELAY_MAX = 60.0
BATCH_UNITS_PER_REQUEST = 1
MAX_TOKENS = 4000
DELAY_BETWEEN_REQUESTS = 2.0

SUBJECT_AGE_MAP = {
    "toan": 7, "tieng_viet": 7, "tieng_anh": 8,
    "tu_nhien_xa_hoi": 7, "khoa_hoc": 9, "lich_su_dia_li": 9,
    "tin_hoc": 8, "cong_nghe": 10, "am_nhac": 7,
    "mi_thuat": 7, "giao_duc_the_chat": 7,
    "hoat_dong_trai_nghiem": 7, "dao_duc": 9,
}

SUBJECT_LABEL = {
    "toan": "Toán", "tieng_viet": "Tiếng Việt", "tieng_anh": "Tiếng Anh",
    "tu_nhien_xa_hoi": "Tự nhiên và Xã hội", "khoa_hoc": "Khoa học",
    "lich_su_dia_li": "Lịch sử và Địa lí", "tin_hoc": "Tin học",
    "cong_nghe": "Công nghệ", "am_nhac": "Âm nhạc",
    "mi_thuat": "Mĩ thuật", "giao_duc_the_chat": "Giáo dục thể chất",
    "hoat_dong_trai_nghiem": "Hoạt động trải nghiệm", "dao_duc": "Đạo đức",
}

# ── MIMO endpoint ──────────────────────────────────────────
_endpoint_env = os.getenv("MIMO_ENDPOINT", "")
if _endpoint_env:
    MIMO_ENDPOINT = _endpoint_env
else:
    _base = MIMO_BASE_URL.rstrip("/")
    MIMO_ENDPOINT = _base if _base.endswith("/chat/completions") else _base + "/chat/completions"

# ── Structured logging ─────────────────────────────────────
log = logging.getLogger("lesson_gen")
log.setLevel(logging.DEBUG)

os.makedirs(os.path.join(PROJECT_ROOT, "mimo_output"), exist_ok=True)
fh = logging.FileHandler(
    os.path.join(PROJECT_ROOT, "mimo_output", "lesson_gen.log"),
    encoding="utf-8"
)
fh.setLevel(logging.DEBUG)
fh.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))

ch = logging.StreamHandler()
ch.setLevel(logging.INFO)
ch.setFormatter(logging.Formatter("%(message)s"))

log.addHandler(fh)
log.addHandler(ch)


def build_prompt(unit: dict, lesson: dict = None, book: dict = None) -> str:
    grade = unit.get("grade", 2)
    subject = unit.get("subject", "toan")
    title = unit.get("title", "bài học")
    subject_label = SUBJECT_LABEL.get(subject, subject)
    age = SUBJECT_AGE_MAP.get(subject, 7) + grade - 1

    page_info = ""
    if lesson and lesson.get("page_start"):
        page_info = f"\nTrang SGK: {lesson['page_start']}"

    unit_info = ""
    if lesson and lesson.get("unit"):
        unit_info = f"\nChủ đề: {lesson['unit']}"

    return f"""Bạn là giáo viên lớp {grade}, môn {subject_label}.
Tạo bài giảng ngắn cho bài "{title}" (lớp {grade}, môn {subject_label}).{page_info}{unit_info}

Trả về JSON chính xác (không markdown, không giải thích):
{{
  "objective": "1-2 câu mục tiêu bài học, giọng bạn bè, dễ hiểu cho trẻ {age} tuổi",
  "explanation": "3-5 câu giải thích đơn giản. Dùng ví dụ gần gũi với trẻ.",
  "examples": ["ví dụ 1 ngắn gọn, dễ hiểu", "ví dụ 2 nếu cần"],
  "remember": "1-2 ý ghi nhớ quan trọng nhất",
  "parent_note": "1 câu gợi ý phụ huynh giúp con ôn bài",
  "exercises": [
    {{"question": "câu hỏi nhận biết (dễ nhất)", "expected_answer": "đáp án ngắn", "difficulty": 1, "skill": "tên_kỹ_năng"}},
    {{"question": "câu hỏi làm theo mẫu (trung bình)", "expected_answer": "đáp án ngắn", "difficulty": 2, "skill": "tên_kỹ_năng"}},
    {{"question": "câu hỏi vận dụng (khó hơn)", "expected_answer": "đáp án ngắn", "difficulty": 3, "skill": "tên_kỹ_năng"}}
  ],
  "check_question": {{"question": "câu kiểm tra cuối bài, ứng dụng thực tế", "expected_answer": "đáp án ngắn", "difficulty": 3, "skill": "tên_kỹ_năng"}}
}}

Quy tắc:
- KHÔNG copy nguyên văn SGK. Tự tạo nội dung dựa trên metadata bài học.
- Giọng thân thiện, dễ hiểu cho trẻ {age} tuổi.
- expected_answer phải ngắn gọn (1-5 từ hoặc 1 số).
- exercises difficulty tăng dần từ 1 đến 3.
- Dùng "mình", "con" khi giải thích, như bạn cùng tuổi nói chuyện.
- Nếu môn đặc biệt (âm nhạc, mĩ thuật, thể chất, trải nghiệm), exercises có thể là hoạt động thay vì câu hỏi."""


def build_batch_prompt(units: list, lessons_by_id: dict, books_by_id: dict) -> str:
    parts = []
    for i, unit in enumerate(units, 1):
        grade = unit.get("grade", 2)
        subject = unit.get("subject", "toan")
        title = unit.get("title", "bài học")
        subject_label = SUBJECT_LABEL.get(subject, subject)
        age = SUBJECT_AGE_MAP.get(subject, 7) + grade - 1

        lesson = lessons_by_id.get(unit.get("lesson_id"))
        page_info = ""
        if lesson and lesson.get("page_start"):
            page_info = f" (trang {lesson['page_start']})"

        parts.append(f"""--- BÀI {i}: {title} (lớp {grade}, môn {subject_label}){page_info} ---
Tạo bài giảng cho trẻ {age} tuổi.""")

    return f"""Bạn là giáo viên tiểu học giỏi. Tạo bài giảng ngắn cho {len(units)} bài học.

{chr(10).join(parts)}

Trả về JSON array [{len(units)} phần tử]. Mỗi phần tử có format:
{{
  "daily_unit_id": "ID của bài học",
  "objective": "1-2 câu mục tiêu, giọng bạn bè",
  "explanation": "3-5 câu giải thích đơn giản, ví dụ gần gũi",
  "examples": ["ví dụ 1", "ví dụ 2"],
  "remember": "1-2 ý ghi nhớ",
  "parent_note": "1 câu gợi ý phụ huynh",
  "exercises": [
    {{"question": "câu hỏi dễ", "expected_answer": "đáp án ngắn", "difficulty": 1, "skill": "tên_kỹ_năng"}},
    {{"question": "câu hỏi trung bình", "expected_answer": "đáp án ngắn", "difficulty": 2, "skill": "tên_kỹ_năng"}},
    {{"question": "câu hỏi khó", "expected_answer": "đáp án ngắn", "difficulty": 3, "skill": "tên_kỹ_năng"}}
  ],
  "check_question": {{"question": "câu kiểm tra", "expected_answer": "đáp án ngắn", "difficulty": 3, "skill": "tên_kỹ_năng"}}
}}

Quy tắc:
- KHÔNG copy nguyên văn SGK. Tự tạo nội dung dựa trên metadata.
- expected_answer ngắn gọn (1-5 từ).
- exercises difficulty tăng dần 1→3.
- Dùng "mình", "con" khi giải thích.
- Trả về JSON array, KHÔNG markdown, KHÔNG giải thích.
- Mỗi phần tử PHẢI có daily_unit_id đúng với input."""


async def call_mimo(prompt: str) -> str:
    if not MIMO_TOKEN_KEY:
        raise RuntimeError("MIMO_TOKEN_PLAN_KEY or MIMO_API_KEY not set")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {MIMO_TOKEN_KEY}",
    }
    payload = {
        "model": MIMO_MODEL,
        "messages": [
            {"role": "system", "content": "Bạn là giáo viên tiểu học giỏi. Luôn trả về JSON hợp lệ. Không markdown, không giải thích."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": MAX_TOKENS,
        "temperature": 0.7,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(MIMO_ENDPOINT, headers=headers, json=payload)

        if resp.status_code == 429:
            raise httpx.HTTPStatusError(
                "Rate limited", request=resp.request, response=resp
            )
        if resp.status_code != 200:
            raise httpx.HTTPStatusError(
                f"MIMO {resp.status_code}", request=resp.request, response=resp
            )

        data = resp.json()
        content = data["choices"][0]["message"]["content"].strip()
        if not content:
            raise RuntimeError("Empty MIMO response")
        return content


def parse_response(text: str) -> dict | None:
    clean = text.strip()
    # Strip markdown fences anywhere
    clean = re.sub(r'```(?:json)?\s*', '', clean).strip()

    # Try direct parse
    try:
        obj = json.loads(clean)
    except json.JSONDecodeError:
        # Fallback: find first { to matching }
        start = clean.find("{")
        if start < 0:
            return None
        depth = 0
        end = -1
        for i in range(start, len(clean)):
            if clean[i] == "{":
                depth += 1
            elif clean[i] == "}":
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        if end <= start:
            return None
        try:
            obj = json.loads(clean[start:end])
        except json.JSONDecodeError:
            # Try fixing common JSON issues
            snippet = clean[start:end]
            # Remove trailing commas before } or ]
            snippet = re.sub(r',\s*([}\]])', r'\1', snippet)
            # Fix unescaped newlines inside strings
            snippet = snippet.replace('\n', '\\n')
            try:
                obj = json.loads(snippet)
            except json.JSONDecodeError:
                return None

    # Validate required fields
    required = ["objective", "explanation", "examples", "remember", "exercises", "check_question"]
    missing = [k for k in required if k not in obj]
    if missing:
        return None
    if not isinstance(obj["exercises"], list) or len(obj["exercises"]) < 1:
        return None
    if not isinstance(obj["check_question"], dict):
        return None
    for i, ex in enumerate(obj["exercises"]):
        if "question" not in ex or "expected_answer" not in ex:
            return None
    return obj


def parse_batch_response(text: str, expected_ids: list) -> list:
    clean = text.strip()
    clean = re.sub(r'```(?:json)?\s*', '', clean).strip()

    # Try parse as array
    try:
        arr = json.loads(clean)
    except json.JSONDecodeError:
        # Fallback: find [ to ]
        start = clean.find("[")
        end = clean.rfind("]")
        if start < 0 or end <= start:
            log.warning("[PARSE_BATCH] No JSON array found: %.100s", clean)
            return [None] * len(expected_ids)
        try:
            arr = json.loads(clean[start:end+1])
        except json.JSONDecodeError as e:
            log.warning("[PARSE_BATCH] JSON decode error: %s", e)
            return [None] * len(expected_ids)

    if not isinstance(arr, list):
        log.warning("[PARSE_BATCH] Response is not a list: %s", type(arr).__name__)
        return [None] * len(expected_ids)

    # Map by daily_unit_id
    result_map = {}
    for item in arr:
        if isinstance(item, dict) and "daily_unit_id" in item:
            uid = item["daily_unit_id"]
            required = ["objective", "explanation", "examples", "remember", "exercises", "check_question"]
            if all(k in item for k in required):
                result_map[uid] = item
            else:
                log.warning("[PARSE_BATCH] %s missing fields", uid)

    return [result_map.get(uid) for uid in expected_ids]


def load_json(path: str):
    if not os.path.isfile(path):
        return []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path: str, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_existing_content(path: str) -> dict:
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as f:
        items = json.load(f)
    return {item["daily_unit_id"]: item for item in items}


async def generate_for_batch(
    units: list,
    lessons_by_id: dict,
    books_by_id: dict,
) -> list:
    unit = units[0]
    lesson = lessons_by_id.get(unit.get("lesson_id"))
    book = books_by_id.get(unit.get("book_id")) if unit.get("book_id") else None
    prompt = build_prompt(unit, lesson, book)

    last_error = ""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            raw = await call_mimo(prompt)
            parsed = parse_response(raw)

            if parsed:
                result = {
                    "daily_unit_id": unit["daily_unit_id"],
                    "lesson_id": unit.get("lesson_id"),
                    "grade": unit.get("grade"),
                    "subject": unit.get("subject"),
                    "title": unit.get("title"),
                    "content": {
                        "objective": parsed["objective"],
                        "explanation": parsed["explanation"],
                        "examples": parsed["examples"],
                        "remember": parsed["remember"],
                        "parent_note": parsed.get("parent_note", ""),
                    },
                    "exercises": parsed["exercises"],
                    "check_question": parsed["check_question"],
                    "content_source": "ai_generated_from_verified_metadata",
                    "source_verified": True,
                    "review_status": "needs_parent_review",
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                }
                return [result]
            else:
                last_error = "parse_failed"
                log.warning("Parse failed for %s (attempt %d/%d) — raw: %.500s",
                           unit["daily_unit_id"], attempt, MAX_RETRIES, raw)

        except httpx.TimeoutException:
            last_error = "timeout"
            log.warning("Timeout attempt %d/%d for %s", attempt, MAX_RETRIES, unit["daily_unit_id"])
        except httpx.HTTPStatusError as e:
            status = e.response.status_code
            last_error = f"http_{status}"
            log.warning("HTTP %d attempt %d/%d for %s", status, attempt, MAX_RETRIES, unit["daily_unit_id"])
            if status == 429:
                retry_after = int(e.response.headers.get("Retry-After", 30))
                log.warning("Rate limited → wait %ds", retry_after)
                await asyncio.sleep(retry_after)
                continue
        except Exception as e:
            last_error = f"{type(e).__name__}: {str(e)[:100]}"
            log.warning("Error attempt %d/%d: %s", attempt, MAX_RETRIES, last_error)

        delay = min(RETRY_DELAY_BASE * (2 ** (attempt - 1)), RETRY_DELAY_MAX)
        await asyncio.sleep(delay)

    log.error("FAILED %s after %d attempts (last: %s)", unit["daily_unit_id"], MAX_RETRIES, last_error)
    return [None]


async def process_grade(grade_num: int):
    grade_dir = os.path.join(CURRICULUM_DIR, f"grade_{grade_num}")
    units_path = os.path.join(grade_dir, "daily_learning_units.json")
    lessons_path = os.path.join(grade_dir, "lessons.json")
    books_path = os.path.join(grade_dir, "books.json")
    content_path = os.path.join(grade_dir, "lesson_content.json")

    if not os.path.isfile(units_path):
        log.info("[SKIP] Grade %d: no daily_learning_units.json", grade_num)
        return 0, 0

    units = load_json(units_path)
    lessons = {l["lesson_id"]: l for l in load_json(lessons_path)}
    books = {b["book_id"]: b for b in load_json(books_path)}
    existing = load_existing_content(content_path)

    to_generate = [u for u in units if u["daily_unit_id"] not in existing]
    if not to_generate:
        log.info("[OK] Grade %d: all %d units already have content", grade_num, len(units))
        return len(units), 0

    log.info("Grade %d: %d done, %d to generate (concurrent=%d)",
             grade_num, len(existing), len(to_generate), MAX_CONCURRENT)

    generated = list(existing.values())
    success = 0
    fail = 0

    sem = asyncio.Semaphore(MAX_CONCURRENT)

    async def gen_one(unit):
        async with sem:
            result_list = await generate_for_batch([unit], lessons, books)
            return unit, result_list[0]

    # Process in chunks to enable checkpointing
    chunk_size = 20
    for chunk_start in range(0, len(to_generate), chunk_size):
        chunk = to_generate[chunk_start:chunk_start + chunk_size]
        tasks = [gen_one(u) for u in chunk]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for item in results:
            if isinstance(item, Exception):
                log.error("[BATCH_FAIL] %s", item)
                fail += 1
            else:
                unit, result = item
                if result:
                    generated.append(result)
                    success += 1
                    log.info("[OK] %s: %s", unit["daily_unit_id"], unit["title"])
                else:
                    fail += 1
                    log.error("[FAIL] %s", unit["daily_unit_id"])

        save_json(content_path, generated)
        log.info("Checkpoint: %d/%d done (%d ok, %d fail)", success + fail, len(to_generate), success, fail)

    save_json(content_path, generated)

    stats = {
        "grade": grade_num,
        "total": len(units),
        "success": success,
        "failed": fail,
        "to_generate": len(to_generate),
    }
    log.info("Grade %d stats: %s", grade_num, json.dumps(stats))

    stats_path = os.path.join(PROJECT_ROOT, "mimo_output", "lesson_gen_stats.jsonl")
    with open(stats_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(stats, ensure_ascii=False) + "\n")

    return success, fail


async def main():
    log.info("=" * 60)
    log.info("VyVy Lesson Content Generator — Concurrent Single-Unit Mode")
    log.info("=" * 60)

    if not MIMO_TOKEN_KEY:
        log.error("Set MIMO_TOKEN_PLAN_KEY or MIMO_API_KEY env var")
        sys.exit(1)

    log.info("API: %s | Model: %s | Concurrent: %d | Batch: %d | Max retries: %d | Max tokens: %d",
             MIMO_ENDPOINT, MIMO_MODEL, MAX_CONCURRENT, BATCH_UNITS_PER_REQUEST, MAX_RETRIES, MAX_TOKENS)

    # Run grades sequentially to avoid rate limiting
    total_ok = 0
    total_fail = 0
    for g in [1, 2, 3, 4, 5]:
        try:
            ok, fail = await process_grade(g)
            total_ok += ok
            total_fail += fail
        except Exception as e:
            log.error("Grade %d crashed: %s", g, e)

    log.info("=" * 60)
    log.info("TOTAL: %d generated, %d failed", total_ok, total_fail)
    log.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
