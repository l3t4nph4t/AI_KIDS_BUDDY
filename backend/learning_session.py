"""VyVy — Learning Session Generator (Multi-Grade).

Generates learning sessions from lesson content when available.
Falls back to template-based generation for units without content.

New flow: read -> practice -> check -> feedback
Legacy flow: warmup -> practice -> check -> feedback
"""

import os
import random
from typing import Any, Dict, List, Optional

from backend.curriculum import (
    SUBJECT_EMOJI,
    SUBJECT_LABEL,
    get_daily_unit_by_id,
    get_book_by_id,
    is_special_subject,
    get_bot_name,
)
from backend.lesson_content import get_content_by_unit_id, get_pdf_info

# ── Legacy templates (fallback for units without content) ──

MATH_WARMUP = [
    "Hôm nay tụi mình học '{title}' nhé! Bạn sẵn sàng chưa? 😊",
    "Chào bạn! Hôm nay mình cùng khám phá '{title}' nha! 🌟",
    "Bạn ơi, hôm nay mình học '{title}' nhé. Vui lắm đó! 💖",
]

MATH_PRACTICE_TEMPLATES = [
    {
        "question": "Bạn tính thử: {a} + {b} = ?",
        "generator": lambda: (lambda a, b: {"a": a, "b": b, "answer": a + b})(
            random.randint(1, 50), random.randint(1, 50)
        ),
    },
    {
        "question": "Bạn tính thử: {a} - {b} = ?",
        "generator": lambda: (lambda a, b: {"a": a, "b": b, "answer": a - b})(
            random.randint(10, 99), random.randint(1, 50)
        ),
    },
    {
        "question": "Số nào lớn hơn: {a} hay {b}?",
        "generator": lambda: (lambda a, b: {
            "a": a, "b": b,
            "answer": str(max(a, b)),
        })(random.randint(1, 99), random.randint(1, 99)),
    },
    {
        "question": "Đếm tiếp: {a}, {b}, {c}, ... Số tiếp theo là mấy?",
        "generator": lambda: (lambda s: {
            "a": s, "b": s + 1, "c": s + 2, "answer": s + 3,
        })(random.randint(1, 90)),
    },
]

MATH_CHECK_TEMPLATES = [
    {
        "question": "Bạn tính nhanh: {a} + {b} = ?",
        "generator": lambda: (lambda a, b: {"a": a, "b": b, "answer": a + b})(
            random.randint(1, 30), random.randint(1, 30)
        ),
    },
    {
        "question": "Số liền sau của {a} là số mấy?",
        "generator": lambda: (lambda a: {"a": a, "answer": a + 1})(random.randint(1, 98)),
    },
]

VIET_WARMUP = [
    "Hôm nay tụi mình học '{title}' nhé! Bạn thích đọc không? 📖",
    "Chào bạn! Hôm nay mình cùng khám phá '{title}' nha! 🌟",
    "Bạn ơi, hôm nay mình học '{title}'. Mình thích lắm! 💖",
]

VIET_PRACTICE_TEMPLATES = [
    {
        "question": "Bạn tìm vần trong từ '{word}' nhé. Từ này có vần gì?",
        "generator": lambda: random.choice([
            {"word": "nhà", "answer": "nhà"},
            {"word": "trường", "answer": "trường"},
            {"word": "bạn", "answer": "bạn"},
            {"word": "hoa", "answer": "hoa"},
            {"word": "sách", "answer": "sách"},
            {"word": "mẹ", "answer": "mẹ"},
        ]),
    },
    {
        "question": "Bạn đặt câu với từ '{word}' nhé!",
        "generator": lambda: random.choice([
            {"word": "vui", "answer": "Ví dụ: Con vui quá!"},
            {"word": "yêu", "answer": "Ví dụ: Con yêu mẹ."},
            {"word": "học", "answer": "Ví dụ: Con học bài."},
            {"word": "chơi", "answer": "Ví dụ: Con chơi vui."},
        ]),
    },
    {
        "question": "Từ nào đồng nghĩa với '{word}'?",
        "generator": lambda: random.choice([
            {"word": "vui", "answer": "hạnh phúc"},
            {"word": "đẹp", "answer": "xinh"},
            {"word": "nhanh", "answer": "lẹ"},
        ]),
    },
]

VIET_CHECK_TEMPLATES = [
    {
        "question": "Bạn đọc to từ này: '{word}'",
        "generator": lambda: random.choice([
            {"word": "con mèo", "answer": "con mèo"},
            {"word": "bông hoa", "answer": "bông hoa"},
            {"word": "ngôi nhà", "answer": "ngôi nhà"},
        ]),
    },
]

SPECIAL_INTROS = {
    "am_nhac": [
        "Hôm nay mình học '{title}' nhé! Con thích hát không? 🎵",
        "Bạn ơi, hôm nay mình tìm hiểu về '{title}' nha! 🎶",
    ],
    "mi_thuat": [
        "Hôm nay mình học '{title}' nhé! Con thích vẽ không? 🎨",
        "Bạn ơi, hôm nay mình cùng khám phá '{title}' nha! 🖌️",
    ],
    "hoat_dong_trai_nghiem": [
        "Hôm nay mình học '{title}' nhé! Con thích khám phá không? 🌈",
        "Bạn ơi, hôm nay mình cùng thử '{title}' nha! 🌟",
    ],
    "giao_duc_the_chat": [
        "Hôm nay mình học '{title}' nhé! Con thích vận động không? 🏃",
        "Bạn ơi, hôm nay mình cùng tìm hiểu '{title}' nha! 💪",
    ],
}

SPECIAL_ACTIVITIES = {
    "am_nhac": [
        "Con thử hát theo giai điệu bài này nhé! Có thể vỗ tay theo nhịp 🎵",
        "Con nghe một bài hát thiếu nhi và kể cho VyVy nghe con thích gì nhất nhé! 🎶",
        "Con thử đếm nhịp: 1, 2, 3, 4... rồi vỗ tay theo nhé! 👏",
    ],
    "mi_thuat": [
        "Con thử vẽ một bức tranh về chủ đề '{title}' nhé! 🎨",
        "Con tìm một vật xung quanh và thử vẽ nó nhé! Không cần đẹp, vui là được! 🖍️",
        "Con thử dùng màu con thích nhất để vẽ một hình gì đó nhé! 🌈",
    ],
    "hoat_dong_trai_nghiem": [
        "Con thử quan sát xung quanh và kể cho VyVy nghe con thấy gì nhé! 👀",
        "Con hỏi bố/mẹ một câu hỏi về chủ đề '{title}' nhé! 💡",
        "Con thử kể lại một kỷ niệm vui liên quan đến '{title}' nhé! 🌟",
    ],
    "giao_duc_the_chat": [
        "Con thử đứng dậy và vươn vai 5 lần nhé! 💪",
        "Con thử nhảy tại chỗ 10 lần nhé! Đếm xem đúng không! 🏃",
        "Con thử bài tập đơn giản: giơ tay trái, giơ tay phải, lặp lại 5 lần nhé! 🤸",
    ],
}

SPECIAL_CHECK_QUESTIONS = [
    "Con có vui không khi thử hoạt động này? Kể VyVy nghe nhé! 😊",
    "Con thích nhất phần nào? 💖",
    "Con có muốn thử lại không? 🌟",
]

PRAISE_CORRECT = [
    "Giỏi quá! Con làm đúng rồi! ⭐",
    "Tuyệt vời! Con giỏi lắm! 🌟",
    "Đúng rồi! VyVy vui quá! 💖",
    "Siêu lắm! Con thật giỏi! ⭐⭐",
    "Chính xác! Con thông minh quá! 🧠✨",
]

PRAISE_EFFORT = [
    "Cố gắng giỏi lắm! Lần sau mình làm tốt hơn nhé! 💪",
    "Không sao đâu! Mình cùng thử lại nhé! 🌟",
    "Con cố gắng rồi, VyVy rất vui! Lần sau sẽ đúng thôi! 💖",
    "Gần đúng rồi! Con giỏi lắm, thử lại nhé! 😊",
]

FEEDBACK_TEMPLATE = (
    "Hôm nay con đã học '{title}' ({subject}). "
    "Con được {stars}⭐. "
    "{detail}"
)


def _fill_template(template: str, **kwargs: Any) -> str:
    try:
        return template.format(**kwargs)
    except (KeyError, IndexError):
        return template


def _generate_options(correct_answer: str, count: int = 4) -> List[str]:
    """Generate multiple choice options for numeric answers."""
    try:
        correct = int(correct_answer)
    except (ValueError, TypeError):
        return []

    options = {correct}
    # Generate plausible wrong answers
    offsets = [-3, -2, -1, 1, 2, 3, 5, -5, 10, -10]
    random.shuffle(offsets)
    for offset in offsets:
        if len(options) >= count:
            break
        wrong = correct + offset
        if wrong >= 0:
            options.add(wrong)

    # Fill remaining with random numbers near correct
    while len(options) < count:
        wrong = correct + random.randint(-10, 10)
        if wrong >= 0:
            options.add(wrong)

    result = list(options)
    random.shuffle(result)
    return [str(x) for x in result]


# ── Content-based session (NEW) ────────────────────────────

def _generate_content_session(
    unit: Dict[str, Any],
    content: Dict[str, Any],
    child_age: int = 8,
) -> Dict[str, Any]:
    subject = unit.get("subject", "toan")
    title = unit.get("title", "bài học")
    unit_id = unit.get("daily_unit_id", "")
    lesson_content = content.get("content", {})
    exercises = content.get("exercises", [])
    check_q = content.get("check_question", {})

    book_id = unit.get("book_id", "")
    pdf_page = None
    pdf_file = None
    pdf_lesson_id = None
    book = get_book_by_id(book_id)
    if book:
        pdf_file = book.get("source_file", "")
        from backend.curriculum import get_lessons_by_book
        for l in get_lessons_by_book(book_id):
            if l["lesson_id"] == content.get("lesson_id"):
                pdf_page = l.get("page_start")
                pdf_lesson_id = l.get("lesson_id")
                break

    practice_items = []
    for ex in exercises:
        expected = str(ex.get("expected_answer", ""))
        item = {
            "question": ex.get("question", ""),
            "expected_answer": expected,
            "difficulty": ex.get("difficulty", 1),
            "skill": ex.get("skill", ""),
        }
        # Generate multiple choice options for numeric answers
        if subject == "toan":
            options = _generate_options(expected)
            if options:
                item["options"] = options
                item["input_type"] = "multiple_choice"
        practice_items.append(item)

    return {
        "unit_id": unit_id,
        "grade": unit.get("grade", 2),
        "subject": subject,
        "subject_label": SUBJECT_LABEL.get(subject, subject),
        "subject_emoji": SUBJECT_EMOJI.get(subject, "📚"),
        "title": title,
        "has_content": True,
        "steps": {
            "read": {
                "type": "read",
                "objective": lesson_content.get("objective", ""),
                "explanation": lesson_content.get("explanation", ""),
                "examples": lesson_content.get("examples", []),
                "remember": lesson_content.get("remember", ""),
                "parent_note": lesson_content.get("parent_note", ""),
                "pdf_page": pdf_page,
                "pdf_file": pdf_file,
                "pdf_lesson_id": pdf_lesson_id,
                "book_id": book_id,
            },
            "practice": {
                "type": "practice",
                "items": practice_items,
                "duration_min": 7,
            },
            "check": {
                "type": "check",
                "question": check_q.get("question", ""),
                "expected_answer": str(check_q.get("expected_answer", "")),
                "difficulty": check_q.get("difficulty", 3),
            },
            "feedback": {
                "type": "feedback",
                "template": FEEDBACK_TEMPLATE,
            },
        },
        "is_special": False,
    }


# ── Legacy template-based session (fallback) ───────────────

def _generate_core_session(
    unit: Dict[str, Any],
    child_age: int = 8,
) -> Dict[str, Any]:
    subject = unit.get("subject", "toan")
    title = unit.get("title", "bài học")
    unit_id = unit.get("daily_unit_id", "")

    if subject == "toan":
        warmup_pool = MATH_WARMUP
        practice_pool = MATH_PRACTICE_TEMPLATES
        check_pool = MATH_CHECK_TEMPLATES
    else:
        warmup_pool = VIET_WARMUP
        practice_pool = VIET_PRACTICE_TEMPLATES
        check_pool = VIET_CHECK_TEMPLATES

    warmup_msg = _fill_template(random.choice(warmup_pool), title=title)

    practice_items = []
    chosen_practice = random.sample(practice_pool, min(3, len(practice_pool)))
    for tpl in chosen_practice:
        gen = tpl["generator"]()
        q = _fill_template(tpl["question"], **gen)
        expected = str(gen.get("answer", ""))
        item = {
            "question": q,
            "expected_answer": expected,
        }
        # Generate multiple choice options for math
        if subject == "toan":
            options = _generate_options(expected)
            if options:
                item["options"] = options
                item["input_type"] = "multiple_choice"
        practice_items.append(item)

    check_tpl = random.choice(check_pool)
    check_gen = check_tpl["generator"]()
    check_question = _fill_template(check_tpl["question"], **check_gen)
    check_answer = str(check_gen.get("answer", ""))

    return {
        "unit_id": unit_id,
        "grade": unit.get("grade", 2),
        "subject": subject,
        "subject_label": SUBJECT_LABEL.get(subject, subject),
        "subject_emoji": SUBJECT_EMOJI.get(subject, "📚"),
        "title": title,
        "has_content": False,
        "steps": {
            "warmup": {
                "type": "warmup",
                "message": warmup_msg,
                "duration_min": 3,
            },
            "practice": {
                "type": "practice",
                "items": practice_items,
                "duration_min": 7,
            },
            "check": {
                "type": "check",
                "question": check_question,
                "expected_answer": check_answer,
            },
            "feedback": {
                "type": "feedback",
                "template": FEEDBACK_TEMPLATE,
            },
        },
        "is_special": False,
    }


def _generate_special_session(
    unit: Dict[str, Any],
    child_age: int = 8,
) -> Dict[str, Any]:
    subject = unit.get("subject", "am_nhac")
    title = unit.get("title", "bài học")
    unit_id = unit.get("daily_unit_id", "")

    intro_pool = SPECIAL_INTROS.get(subject, SPECIAL_INTROS["am_nhac"])
    activity_pool = SPECIAL_ACTIVITIES.get(subject, SPECIAL_ACTIVITIES["am_nhac"])

    intro_msg = _fill_template(random.choice(intro_pool), title=title)
    activity_msg = _fill_template(random.choice(activity_pool), title=title)
    check_msg = random.choice(SPECIAL_CHECK_QUESTIONS)

    return {
        "unit_id": unit_id,
        "grade": unit.get("grade", 2),
        "subject": subject,
        "subject_label": SUBJECT_LABEL.get(subject, subject),
        "subject_emoji": SUBJECT_EMOJI.get(subject, "📚"),
        "title": title,
        "has_content": False,
        "steps": {
            "warmup": {
                "type": "warmup",
                "message": intro_msg,
                "duration_min": 3,
            },
            "practice": {
                "type": "activity",
                "message": activity_msg,
                "duration_min": 7,
            },
            "check": {
                "type": "check",
                "question": check_msg,
                "expected_answer": None,
            },
            "feedback": {
                "type": "feedback",
                "template": FEEDBACK_TEMPLATE,
            },
        },
        "is_special": True,
    }


# ── Main entry point ───────────────────────────────────────

def generate_session(
    unit_id: str,
    child_age: int = 8,
) -> Optional[Dict[str, Any]]:
    unit = get_daily_unit_by_id(unit_id)
    if unit is None:
        return None

    subject = unit.get("subject", "")

    # Try content-based session first
    content = get_content_by_unit_id(unit_id)
    if content:
        return _generate_content_session(unit, content, child_age)

    # Legacy fallback
    if is_special_subject(subject):
        return _generate_special_session(unit, child_age)
    else:
        return _generate_core_session(unit, child_age)


def evaluate_answer(
    session: Dict[str, Any],
    step_type: str,
    user_answer: str,
    item_index: int = 0,
) -> Dict[str, Any]:
    user_answer_clean = user_answer.strip().lower()

    if step_type == "practice" and not session.get("is_special"):
        items = session["steps"]["practice"].get("items", [])
        if 0 <= item_index < len(items):
            expected = str(items[item_index].get("expected_answer", "")).strip().lower()
            correct = user_answer_clean == expected
            praise = random.choice(PRAISE_CORRECT if correct else PRAISE_EFFORT)
            return {
                "correct": correct,
                "expected": expected,
                "praise": praise,
                "stars": 1 if correct else 0,
            }

    if step_type == "check":
        if session.get("is_special"):
            praise = random.choice(PRAISE_CORRECT)
            return {
                "correct": True,
                "expected": None,
                "praise": praise,
                "stars": 1,
            }
        expected = str(
            session["steps"]["check"].get("expected_answer", "")
        ).strip().lower()
        correct = user_answer_clean == expected
        praise = random.choice(PRAISE_CORRECT if correct else PRAISE_EFFORT)
        return {
            "correct": correct,
            "expected": expected,
            "praise": praise,
            "stars": 1 if correct else 0,
        }

    return {
        "correct": False,
        "expected": None,
        "praise": random.choice(PRAISE_EFFORT),
        "stars": 0,
    }


def generate_parent_feedback(
    session: Dict[str, Any],
    total_stars: int,
) -> str:
    title = session.get("title", "bài học")
    subject_label = session.get("subject_label", "")
    bot_name = get_bot_name()

    if session.get("is_special"):
        detail = "Con đã tham gia hoạt động vui vẻ!"
    elif total_stars >= 3:
        detail = "Con làm rất tốt, nắm bài nhanh!"
    elif total_stars >= 1:
        detail = "Con đã cố gắng, cần luyện thêm một chút."
    else:
        detail = "Con cần ôn lại bài này nhé."

    return FEEDBACK_TEMPLATE.format(
        title=title,
        subject=subject_label,
        stars=min(total_stars, 4),
        detail=detail,
    )
