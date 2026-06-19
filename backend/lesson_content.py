"""VyVy — Lesson Content Loader.

Two content sources per grade:
  lesson_content_sgk.json  — SGK-based content (main "học bài" flow)
  lesson_content.json      — AI-generated explanation ("Giải thích", optional supplement)
"""

import json
import os
from typing import Any, Dict, List, Optional

from backend.curriculum import DATA_DIR, get_book_by_id

CURRICULUM_DIR = os.path.join(DATA_DIR, "curriculum")

# SGK content (primary — drives main reading flow and TTS)
_grade_content_sgk: Dict[int, Dict[str, Dict[str, Any]]] = {}
# Explanation content (secondary — "Giải thích" on demand)
_grade_content_exp: Dict[int, Dict[str, Dict[str, Any]]] = {}
_loaded = False

# Keep alias so callers that import _grade_content directly still work
_grade_content = _grade_content_sgk


def _load_grade(path: str) -> Dict[str, Dict[str, Any]]:
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as f:
        items = json.load(f)
    return {item["daily_unit_id"]: item for item in items if item.get("daily_unit_id")}


def _load_data() -> None:
    global _loaded
    if _loaded:
        return

    for grade_num in [1, 2, 3, 4, 5]:
        grade_dir = os.path.join(CURRICULUM_DIR, f"grade_{grade_num}")
        _grade_content_sgk[grade_num] = _load_grade(
            os.path.join(grade_dir, "lesson_content_sgk.json")
        )
        _grade_content_exp[grade_num] = _load_grade(
            os.path.join(grade_dir, "lesson_content.json")
        )

    _loaded = True


# ---------------------------------------------------------------------------
# Primary SGK content (main flow)
# ---------------------------------------------------------------------------

def get_content_by_unit_id(unit_id: str) -> Optional[Dict[str, Any]]:
    """Returns SGK content for the main reading/audio flow."""
    _load_data()
    for grade_map in _grade_content_sgk.values():
        if unit_id in grade_map:
            return grade_map[unit_id]
    return None


def get_content_by_lesson_id(lesson_id: str) -> Optional[Dict[str, Any]]:
    _load_data()
    for grade_map in _grade_content_sgk.values():
        for item in grade_map.values():
            if item.get("lesson_id") == lesson_id:
                return item
    return None


def has_content(unit_id: str) -> bool:
    return get_content_by_unit_id(unit_id) is not None


def get_content_for_grade(grade: int) -> List[Dict[str, Any]]:
    _load_data()
    return list(_grade_content_sgk.get(grade, {}).values())


def get_content_for_subject(subject: str, grade: Optional[int] = None) -> List[Dict[str, Any]]:
    _load_data()
    result = []
    grades = [grade] if grade else [1, 2, 3, 4, 5]
    for g in grades:
        for item in _grade_content_sgk.get(g, {}).values():
            if item.get("subject") == subject:
                result.append(item)
    return result


# ---------------------------------------------------------------------------
# Explanation content ("Giải thích", optional supplement)
# ---------------------------------------------------------------------------

def get_explanation_by_unit_id(unit_id: str) -> Optional[Dict[str, Any]]:
    """Returns AI-generated explanation content (lesson_content.json)."""
    _load_data()
    for grade_map in _grade_content_exp.values():
        if unit_id in grade_map:
            return grade_map[unit_id]
    return None


def has_explanation(unit_id: str) -> bool:
    return get_explanation_by_unit_id(unit_id) is not None


# ---------------------------------------------------------------------------
# Stats & PDF helpers
# ---------------------------------------------------------------------------

def get_content_stats() -> Dict[str, Any]:
    _load_data()
    total_sgk = 0
    total_exp = 0
    by_grade: Dict[str, Dict[str, int]] = {}
    by_subject: Dict[str, int] = {}

    for grade_num in [1, 2, 3, 4, 5]:
        n_sgk = len(_grade_content_sgk.get(grade_num, {}))
        n_exp = len(_grade_content_exp.get(grade_num, {}))
        total_sgk += n_sgk
        total_exp += n_exp
        by_grade[str(grade_num)] = {"sgk": n_sgk, "explanation": n_exp}
        for item in _grade_content_sgk.get(grade_num, {}).values():
            subj = item.get("subject", "unknown")
            by_subject[subj] = by_subject.get(subj, 0) + 1

    return {
        "total_units_with_content": total_sgk,
        "total_explanation_units": total_exp,
        "by_grade": by_grade,
        "by_subject": by_subject,
    }


def get_pdf_info(unit_id: str) -> Optional[Dict[str, Any]]:
    content = get_content_by_unit_id(unit_id)
    if not content:
        return None

    from backend.curriculum import get_daily_unit_by_id

    unit = get_daily_unit_by_id(unit_id)
    if not unit:
        return None

    book = get_book_by_id(unit.get("book_id", ""))
    if not book:
        return None

    lesson_id = content.get("lesson_id")
    lesson = None
    if lesson_id:
        from backend.curriculum import get_lessons_by_book
        for l in get_lessons_by_book(book["book_id"]):
            if l["lesson_id"] == lesson_id:
                lesson = l
                break

    return {
        "book_id": book["book_id"],
        "book_title": book.get("title", ""),
        "source_file": book.get("source_file", ""),
        "page_start": lesson.get("page_start") if lesson else None,
    }


def reload() -> None:
    global _loaded
    _loaded = False
    _grade_content_sgk.clear()
    _grade_content_exp.clear()
    _load_data()
