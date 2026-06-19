"""
Generate lesson_content_sgk.json for all grades using Gemini or DeepSeek API.

Usage:
    # DeepSeek (recommended — key in .local/deepseek.env)
    python scripts/generate_lesson_content_sgk.py --deepseek
    python scripts/generate_lesson_content_sgk.py --deepseek --limit 1
    python scripts/generate_lesson_content_sgk.py --deepseek --deepseek-model deepseek-v4-flash

    # Gemini (requires GEMINI_API_KEY)
    python scripts/generate_lesson_content_sgk.py --api-key YOUR_KEY
    python scripts/generate_lesson_content_sgk.py --dry-run

Environment:
    DEEPSEEK_API_KEY=...  (or set in .local/deepseek.env)
    GEMINI_API_KEY=...    (or set in .local/gemini.env)
"""

import argparse
import asyncio
import json
import os
import sys
import time
from pathlib import Path
from typing import Optional

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CURRICULUM_DIR = PROJECT_ROOT / "backend" / "data" / "curriculum"
PDF_DIR = PROJECT_ROOT / "backend" / "data" / "lesson_pdfs"
CHECKPOINT_DIR = SCRIPT_DIR / "checkpoints"

SUBJECT_LABEL = {
    "toan": "Toán",
    "tieng_viet": "Tiếng Việt",
    "tieng_anh": "Tiếng Anh",
    "tu_nhien_xa_hoi": "Tự nhiên và Xã hội",
    "khoa_hoc": "Khoa học",
    "lich_su_dia_li": "Lịch sử và Địa lí",
    "tin_hoc": "Tin học",
    "cong_nghe": "Công nghệ",
    "am_nhac": "Âm nhạc",
    "mi_thuat": "Mĩ thuật",
    "giao_duc_the_chat": "Giáo dục thể chất",
    "hoat_dong_trai_nghiem": "Hoạt động trải nghiệm",
    "dao_duc": "Đạo đức",
}

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "objective":      {"type": "string"},
        "explanation":    {"type": "string"},
        "examples":       {"type": "array", "items": {"type": "string"}},
        "remember":       {"type": "string"},
        "parent_note":    {"type": "string"},
        "exercises": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question":         {"type": "string"},
                    "expected_answer":  {"type": "string"},
                    "difficulty":       {"type": "integer"},
                    "skill":            {"type": "string"},
                },
                "required": ["question", "expected_answer"],
            },
        },
        "check_question": {
            "type": "object",
            "properties": {
                "question":         {"type": "string"},
                "expected_answer":  {"type": "string"},
                "difficulty":       {"type": "integer"},
                "skill":            {"type": "string"},
            },
            "required": ["question", "expected_answer"],
        },
    },
    "required": ["objective", "explanation", "examples", "remember", "exercises", "check_question"],
}


class RateLimiter:
    """Token-bucket style async rate limiter shared across coroutines."""

    def __init__(self, rate: int, period: float = 60.0):
        self._rate = rate
        self._period = period
        self._interval = period / rate
        self._lock = asyncio.Lock()
        self._last_call = 0.0

    async def acquire(self):
        async with self._lock:
            now = time.monotonic()
            wait = self._interval - (now - self._last_call)
            if wait > 0:
                await asyncio.sleep(wait)
            self._last_call = time.monotonic()


def load_curriculum(grade: int):
    units_path = CURRICULUM_DIR / f"grade_{grade}" / "daily_learning_units.json"
    lessons_path = CURRICULUM_DIR / f"grade_{grade}" / "lessons.json"
    with open(units_path, encoding="utf-8") as f:
        units = json.load(f)
    with open(lessons_path, encoding="utf-8") as f:
        lessons = {l["lesson_id"]: l for l in json.load(f)}
    return units, lessons


def load_checkpoint(grade: int) -> dict:
    path = CHECKPOINT_DIR / f"sgk_grade_{grade}.json"
    if path.exists():
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_checkpoint(grade: int, checkpoint: dict, dry_run: bool = False):
    if dry_run:
        return  # Never persist dry-run results
    CHECKPOINT_DIR.mkdir(exist_ok=True)
    path = CHECKPOINT_DIR / f"sgk_grade_{grade}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(checkpoint, f, ensure_ascii=False, indent=2)


def log_missing_pdf(lesson_id: str, grade: int):
    CHECKPOINT_DIR.mkdir(exist_ok=True)
    path = CHECKPOINT_DIR / "missing_pdfs.txt"
    with open(path, "a", encoding="utf-8") as f:
        f.write(f"grade_{grade}/{lesson_id}.pdf\n")


def build_prompt(unit: dict, lesson: dict, unit_idx: int, total_units_in_lesson: int) -> str:
    grade = unit["grade"]
    subject = unit.get("subject", "")
    subject_label = SUBJECT_LABEL.get(subject, subject)
    title = unit.get("title", "")

    day_info = ""
    if total_units_in_lesson > 1:
        day_info = f" (ngày {unit_idx + 1}/{total_units_in_lesson} của bài này)"

    return f"""Môn: {subject_label} | Lớp: {grade} | Bài: "{title}"{day_info}

Bé đang nhìn vào đúng trang sách giáo khoa này trên màn hình. Em AI tên VyVy sẽ ĐỌC TO nội dung dưới đây trong khi bé nhìn theo trang sách.
Nhiệm vụ của VyVy là DẪN DẮT bé đọc hiểu trang sách — KHÔNG dạy thêm ngoài sách.

Dùng "con" để xưng hô, ngôn ngữ đơn giản như nói chuyện với trẻ 7–10 tuổi.

Yêu cầu trả về JSON:
- objective: 1 câu mục tiêu (bắt đầu "Con sẽ..."), tóm tắt nội dung trang sách này dạy gì
- explanation: 3–5 câu HƯỚNG DẪN bé đọc trang sách — dùng "Con nhìn vào...", "Con thấy... không?", "Ở phần... sách viết..." để chỉ từng phần cụ thể trên trang. Dẫn từ trên xuống dưới theo bố cục trang sách.
- examples: mảng 2–3 string — DIỄN GIẢI ví dụ CÓ TRONG TRANG SÁCH (không bịa thêm). Mỗi string bắt đầu bằng "Trong sách, " hoặc "Sách lấy ví dụ ". KHÔNG có prefix "Ví dụ 1:", chỉ là câu văn thuần.
- remember: 1 câu ghi nhớ ngắn nhất, lấy từ phần "Ghi nhớ" trong sách (nếu có)
- parent_note: 1 câu gợi ý bố mẹ hỗ trợ con ở nhà
- exercises: mảng 2–3 object — là CÁC BÀI TẬP CÓ TRONG TRANG SÁCH. question = "Con làm [Bài/Câu X] trong sách: [mô tả ngắn yêu cầu bài đó]", expected_answer = đáp án ngắn gọn, difficulty 1–3, skill
- check_question: 1 câu hỏi kiểm tra bám sát nội dung trang sách, question + expected_answer

QUAN TRỌNG: exercises phải là bài tập LẤY TỪ SÁCH, không tự bịa. Nếu trang sách không có bài tập, để exercises là mảng rỗng."""


def build_prompt_local(unit: dict, lesson: dict, unit_idx: int, total_units_in_lesson: int) -> str:
    """Prompt for local models (no PDF — uses curriculum knowledge)."""
    grade = unit["grade"]
    subject = unit.get("subject", "")
    subject_label = SUBJECT_LABEL.get(subject, subject)
    title = unit.get("title", "")

    day_info = ""
    if total_units_in_lesson > 1:
        day_info = f" (tiết {unit_idx + 1}/{total_units_in_lesson} của bài này)"

    return f"""Bạn là trợ lý AI tên VyVy, hỗ trợ học sinh tiểu học Việt Nam học theo chương trình GDPT 2018.

Môn: {subject_label} | Lớp: {grade} | Bài: "{title}"{day_info}

Bé đang mở trang sách giáo khoa bài này. VyVy sẽ đọc to để DẪN DẮT bé đọc hiểu.
Dùng "con" xưng hô với bé, ngôn ngữ đơn giản, thân thiện với trẻ 7–10 tuổi.

Trả về JSON (chỉ JSON, không giải thích thêm):
{{
  "objective": "Con sẽ ... (1 câu, mục tiêu bài học)",
  "explanation": "3–4 câu hướng dẫn bé đọc sách: dùng 'Con nhìn vào phần...', 'Sách hướng dẫn con...' để dẫn bé theo bố cục điển hình của bài {subject_label} lớp {grade}.",
  "examples": ["Sách lấy ví dụ... (câu văn thuần, không prefix 'Ví dụ 1:')", "..."],
  "remember": "1 câu ghi nhớ quan trọng nhất của bài",
  "parent_note": "1 câu gợi ý bố mẹ hỗ trợ con ở nhà",
  "exercises": [
    {{"question": "Con làm bài tập trong sách: ...", "expected_answer": "...", "difficulty": 1, "skill": "..."}},
    {{"question": "...", "expected_answer": "...", "difficulty": 2, "skill": "..."}}
  ],
  "check_question": {{"question": "...", "expected_answer": "...", "difficulty": 3, "skill": "..."}}
}}

Bám sát chương trình SGK Việt Nam. examples phải là mảng string thuần, KHÔNG phải object."""


async def call_ollama(
    prompt: str,
    unit_id: str,
    model: str = "qwen2.5:7b",
    dry_run: bool = False,
) -> Optional[dict]:
    if dry_run:
        return {
            "objective": "[DRY RUN] Con sẽ học...",
            "explanation": "[DRY RUN] Nội dung bài học...",
            "examples": ["Sách lấy ví dụ 1", "Sách lấy ví dụ 2"],
            "remember": "[DRY RUN] Ghi nhớ...",
            "parent_note": "[DRY RUN] Bố mẹ hỗ trợ...",
            "exercises": [{"question": "Câu hỏi?", "expected_answer": "Đáp án", "difficulty": 1, "skill": "skill"}],
            "check_question": {"question": "Câu hỏi cuối?", "expected_answer": "Đáp án", "difficulty": 3, "skill": "skill"},
        }

    import re as _re2
    import urllib.request

    payload = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.3, "num_predict": 1024},
    }).encode()

    try:
        req = urllib.request.Request(
            "http://localhost:11434/api/chat",
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=300) as resp:
            raw = json.loads(resp.read())
        text = raw.get("message", {}).get("content", "").strip()
        # Strip markdown code fences if present
        text = _re2.sub(r'^```(?:json)?\s*', '', text)
        text = _re2.sub(r'\s*```$', '', text)
        return json.loads(text)
    except Exception as e:
        print(f"  [ERROR] {unit_id}: {e}", file=sys.stderr)
        return None


async def call_deepseek(
    api_key: str,
    model: str,
    prompt: str,
    unit_id: str,
    dry_run: bool = False,
) -> Optional[dict]:
    if dry_run:
        return {
            "objective": "[DRY RUN] Con sẽ học...",
            "explanation": "[DRY RUN] Nội dung bài học...",
            "examples": ["Sách lấy ví dụ 1", "Sách lấy ví dụ 2"],
            "remember": "[DRY RUN] Ghi nhớ...",
            "parent_note": "[DRY RUN] Bố mẹ hỗ trợ...",
            "exercises": [{"question": "Câu hỏi?", "expected_answer": "Đáp án", "difficulty": 1, "skill": "skill"}],
            "check_question": {"question": "Câu hỏi cuối?", "expected_answer": "Đáp án", "difficulty": 3, "skill": "skill"},
        }

    import re as _re3
    import urllib.request

    payload = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"},
        "temperature": 0.3,
        "max_tokens": 4096,
    }).encode("utf-8")

    def _call():
        req = urllib.request.Request(
            "https://api.deepseek.com/v1/chat/completions",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read())

    try:
        raw = await asyncio.get_event_loop().run_in_executor(None, _call)
        text = raw["choices"][0]["message"]["content"].strip()
        if not text:
            print(f"  [ERROR] {unit_id}: empty response from API", file=sys.stderr)
            return None
        # Strip markdown fences
        text = _re3.sub(r'^```(?:json)?\s*', '', text)
        text = _re3.sub(r'\s*```$', '', text.strip())
        # Try to recover truncated JSON — find last complete closing brace
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Find rightmost complete JSON object
            last_brace = text.rfind("}")
            if last_brace > 0:
                try:
                    return json.loads(text[: last_brace + 1])
                except json.JSONDecodeError:
                    pass
            print(f"  [ERROR] {unit_id}: JSON parse failed even after recovery", file=sys.stderr)
            return None
    except Exception as e:
        print(f"  [ERROR] {unit_id}: {e}", file=sys.stderr)
        return None


async def call_gemini(
    client,
    pdf_path: Optional[Path],
    prompt: str,
    unit_id: str,
    dry_run: bool = False,
) -> Optional[dict]:
    if dry_run:
        # Return mock data for dry run
        return {
            "objective": "[DRY RUN] Con sẽ học...",
            "explanation": "[DRY RUN] Nội dung bài học...",
            "examples": ["Ví dụ 1", "Ví dụ 2"],
            "remember": "[DRY RUN] Ghi nhớ...",
            "parent_note": "[DRY RUN] Bố mẹ hỗ trợ...",
            "exercises": [
                {"question": "Câu hỏi 1?", "expected_answer": "Đáp án", "difficulty": 1, "skill": "skill"},
            ],
            "check_question": {"question": "Câu hỏi cuối?", "expected_answer": "Đáp án", "difficulty": 3, "skill": "skill"},
        }

    try:
        from google import genai as google_genai
        from google.genai import types as genai_types

        contents = []
        if pdf_path and pdf_path.exists():
            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()
            contents.append(
                genai_types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf")
            )
        contents.append(prompt)

        response = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: client.models.generate_content(
                model="gemini-flash-latest",
                contents=contents,
                config=genai_types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3,
                ),
            ),
        )

        text = response.text.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            text = "\n".join(lines[1:-1]) if lines[-1] == "```" else "\n".join(lines[1:])
        return json.loads(text)

    except Exception as e:
        print(f"  [ERROR] {unit_id}: {e}", file=sys.stderr)
        return None


async def process_grade(
    grade: int,
    model,
    rate_limiter: RateLimiter,
    limit: Optional[int],
    dry_run: bool,
    print_lock: asyncio.Lock,
) -> list:
    units, lessons = load_curriculum(grade)
    checkpoint = load_checkpoint(grade)

    # Build unit-within-lesson index
    lesson_unit_map: dict[str, list] = {}
    for u in units:
        lid = u.get("lesson_id", "")
        lesson_unit_map.setdefault(lid, []).append(u["daily_unit_id"])

    results = list(checkpoint.values())
    done_ids = set(checkpoint.keys())
    pending = [u for u in units if u["daily_unit_id"] not in done_ids]

    if limit is not None:
        pending = pending[:limit]

    total_pending = len(pending)
    processed = 0

    for unit in pending:
        uid = unit["daily_unit_id"]
        lid = unit.get("lesson_id", "")
        lesson = lessons.get(lid, {})
        units_in_lesson = lesson_unit_map.get(lid, [uid])
        unit_idx = units_in_lesson.index(uid) if uid in units_in_lesson else 0
        total_in_lesson = len(units_in_lesson)

        pdf_path = PDF_DIR / f"grade_{grade}" / f"{lid}.pdf"
        has_pdf = pdf_path.exists()
        if not has_pdf:
            log_missing_pdf(lid, grade)

        use_local = model == "local"
        use_deepseek = isinstance(model, dict) and model.get("provider") == "deepseek"

        if use_local or use_deepseek:
            # Metadata-only prompt (no PDF vision)
            prompt = build_prompt_local(unit, lesson, unit_idx, total_in_lesson)
        else:
            prompt = build_prompt(unit, lesson, unit_idx, total_in_lesson)

        await rate_limiter.acquire()

        for attempt in range(4):
            if use_local:
                content = await call_ollama(prompt, uid, dry_run=dry_run)
            elif use_deepseek:
                content = await call_deepseek(
                    model["api_key"],
                    model["model_name"],
                    prompt,
                    uid,
                    dry_run=dry_run,
                )
            else:
                content = await call_gemini(
                    model,
                    pdf_path if has_pdf else None,
                    prompt,
                    uid,
                    dry_run=dry_run,
                )
            if content is not None:
                break
            if attempt < 3:
                wait = 5 * (attempt + 1)
                await asyncio.sleep(wait)

        processed += 1
        progress = f"{processed}/{total_pending}"

        if content is None:
            async with print_lock:
                print(f"  Grade {grade} [{progress}] SKIP {uid} (API failed after 3 retries)")
            continue

        # Normalize examples: always list of clean strings (no "Ví dụ X:" prefix — TTS adds that)
        import re as _re
        raw_examples = content.get("examples", [])
        examples = []
        for ex in raw_examples:
            if isinstance(ex, str):
                # Strip any "Ví dụ X:" prefix Gemini may have added — TTS will re-add it
                text = _re.sub(r'^Ví\s+dụ\s+\d+\s*:\s*', '', ex.strip())
                examples.append(text)
            elif isinstance(ex, dict):
                # Case 1: {question, expected_answer} — Gemini confused examples with exercises
                if "question" in ex:
                    q = ex.get("question", "")
                    a = ex.get("expected_answer", "")
                    examples.append(f"{q} (Đáp án: {a})" if a else q)
                # Case 2: {description, source_page} or {text, content, ...}
                else:
                    text = ex.get("description") or ex.get("text") or ex.get("content") or str(ex)
                    src = ex.get("source_page") or ex.get("page")
                    examples.append(f"{text} (trang {src})" if src else text)

        entry = {
            "daily_unit_id": uid,
            "lesson_id": lid,
            "grade": grade,
            "subject": unit.get("subject", ""),
            "title": unit.get("title", ""),
            "content": {
                "objective":   content.get("objective", ""),
                "explanation": content.get("explanation", ""),
                "examples":    examples,
                "remember":    content.get("remember", ""),
                "parent_note": content.get("parent_note", ""),
            },
            "exercises":      content.get("exercises", []),
            "check_question": content.get("check_question", {}),
            "content_source": "sgk_metadata" if (use_local or use_deepseek) else ("sgk_pdf" if has_pdf else "sgk_metadata"),
            "pdf_lesson_id":  lid,
        }

        checkpoint[uid] = entry
        results.append(entry)
        save_checkpoint(grade, checkpoint, dry_run=dry_run)

        async with print_lock:
            pdf_tag = "PDF" if has_pdf else "META"
            print(f"  Grade {grade} [{progress}] OK {uid} ({unit.get('subject','')} | {pdf_tag}): {unit.get('title','')[:45]}")

    return results


def _load_env_key(env_file: Path, key_prefix: str) -> str:
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith(key_prefix):
                return line.split("=", 1)[1].strip()
    return ""


async def main_async(args):
    use_local = getattr(args, "local", False)
    use_deepseek = getattr(args, "deepseek", False)

    if use_local:
        client = "local"
        rate_rpm = 999  # no external rate limit
        print("[LOCAL MODE] Dùng Ollama qwen2.5:7b — không cần API key\n")

    elif use_deepseek:
        ds_key = (
            getattr(args, "deepseek_key", None)
            or os.environ.get("DEEPSEEK_API_KEY", "")
            or _load_env_key(PROJECT_ROOT / ".local" / "deepseek.env", "DEEPSEEK_API_KEY=")
        )
        if not ds_key and not args.dry_run:
            print("ERROR: Thiếu DEEPSEEK_API_KEY. Set trong .local/deepseek.env.")
            sys.exit(1)
        ds_model = getattr(args, "deepseek_model", None) or "deepseek-v4-pro"
        client = {"provider": "deepseek", "api_key": ds_key, "model_name": ds_model}
        rate_rpm = 30  # conservative — V4-Pro allows 500 concurrent but we're polite
        print(f"[DEEPSEEK MODE] Model: {ds_model}\n")

    else:
        api_key = getattr(args, "api_key", None) or os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            api_key = _load_env_key(PROJECT_ROOT / ".local" / "gemini.env", "GEMINI_API_KEY=")
        if not api_key and not args.dry_run:
            print("ERROR: Thiếu GEMINI_API_KEY. Dùng --deepseek hoặc --local.")
            sys.exit(1)
        if not args.dry_run:
            from google import genai as google_genai
            client = google_genai.Client(api_key=api_key)
        else:
            client = None
            print("[DRY RUN MODE] Khong goi API that\n")
        rate_rpm = 14

    grades = [int(g) for g in args.grades.split(",")] if args.grades else [1, 2, 3, 4, 5]

    rate_limiter = RateLimiter(rate=rate_rpm, period=60.0)
    print_lock = asyncio.Lock()

    if use_deepseek:
        mode = f"DeepSeek/{client['model_name']}"
    elif use_local:
        mode = "LOCAL/Ollama"
    else:
        mode = "Gemini"

    print(f"Mode: {mode} | Grades: {grades} | Limit per grade: {args.limit or 'ALL'} | Dry run: {args.dry_run}")
    print(f"Checkpoints: {CHECKPOINT_DIR}")
    print()

    # Local mode: limit concurrency to 2; others: all grades in parallel
    concurrency = 2 if use_local else len(grades)
    sem = asyncio.Semaphore(concurrency)

    async def run_grade(grade):
        async with sem:
            return await process_grade(grade, client, rate_limiter, args.limit, args.dry_run, print_lock)

    tasks = [run_grade(grade) for grade in grades]

    all_results = await asyncio.gather(*tasks)

    # Write output files
    for grade, results in zip(grades, all_results):
        out_path = CURRICULUM_DIR / f"grade_{grade}" / "lesson_content_sgk.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"\nGrade {grade}: {len(results)} units → {out_path.name}")

    total = sum(len(r) for r in all_results)
    print(f"\nDone: {total} units total")

    missing = CHECKPOINT_DIR / "missing_pdfs.txt"
    if missing.exists():
        count = len(missing.read_text().splitlines())
        print(f"Missing PDFs logged: {count} → {missing}")


def main():
    parser = argparse.ArgumentParser(description="Generate SGK lesson content (DeepSeek / Gemini / Ollama)")
    # Provider selection
    parser.add_argument("--deepseek", action="store_true", help="Use DeepSeek API (key in .local/deepseek.env)")
    parser.add_argument("--deepseek-model", default="deepseek-v4-pro", help="DeepSeek model name (default: deepseek-v4-pro)")
    parser.add_argument("--deepseek-key", help="DeepSeek API key (or set DEEPSEEK_API_KEY env)")
    parser.add_argument("--local", action="store_true", help="Use local Ollama qwen2.5:7b")
    parser.add_argument("--api-key", help="Gemini API key (or set GEMINI_API_KEY env)")
    # Run control
    parser.add_argument("--dry-run", action="store_true", help="Run without calling any model")
    parser.add_argument("--limit", type=int, help="Max units per grade (e.g. 1 for test)")
    parser.add_argument("--grades", help="Comma-separated grades, e.g. '2,3' (default: all)")
    args = parser.parse_args()
    asyncio.run(main_async(args))


if __name__ == "__main__":
    main()
