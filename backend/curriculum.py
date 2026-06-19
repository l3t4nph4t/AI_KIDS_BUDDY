"""VyVy — Grade-Aware SGK Curriculum Loader (Grades 1-5).

Loads books, lessons, daily_learning_units from per-grade directories.
Provides grade-aware lookup helpers for curriculum API endpoints.
"""

import json
import os
from typing import Any, Dict, List, Optional

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
CURRICULUM_DIR = os.path.join(DATA_DIR, "curriculum")
BOT_CONFIG_FILE = os.path.join(DATA_DIR, "bot_config.json")

_GRADES: List[Dict[str, Any]] = []
_SUBJECTS_CATALOG: Dict[str, Any] = {}
_GRADE_SUBJECTS: Dict[str, List[str]] = {}
_BOT_CONFIG: Dict[str, Any] = {}

_grade_books: Dict[int, List[Dict[str, Any]]] = {}
_grade_lessons: Dict[int, List[Dict[str, Any]]] = {}
_grade_units: Dict[int, List[Dict[str, Any]]] = {}

_all_books_by_id: Dict[str, Dict[str, Any]] = {}
_all_lessons_by_id: Dict[str, Dict[str, Any]] = {}
_all_units_by_id: Dict[str, Dict[str, Any]] = {}

SUBJECT_EMOJI: Dict[str, str] = {}
SUBJECT_LABEL: Dict[str, str] = {}
SPECIAL_SUBJECTS: set = set()
CORE_SUBJECTS: set = set()

_loaded = False


def _load_data() -> None:
    global _loaded
    if _loaded:
        return

    global _GRADES, _SUBJECTS_CATALOG, _GRADE_SUBJECTS, _BOT_CONFIG
    global _grade_books, _grade_lessons, _grade_units
    global _all_books_by_id, _all_lessons_by_id, _all_units_by_id
    global SUBJECT_EMOJI, SUBJECT_LABEL, SPECIAL_SUBJECTS, CORE_SUBJECTS

    def _read_json(path: str) -> Any:
        with open(path, encoding="utf-8") as f:
            return json.load(f)

    # Load grades.json
    grades_path = os.path.join(CURRICULUM_DIR, "grades.json")
    if os.path.isfile(grades_path):
        _GRADES = _read_json(grades_path)

    # Load subjects.json
    subjects_path = os.path.join(CURRICULUM_DIR, "subjects.json")
    if os.path.isfile(subjects_path):
        subj_data = _read_json(subjects_path)
        _SUBJECTS_CATALOG = subj_data.get("subject_catalog", {})
        _GRADE_SUBJECTS = subj_data.get("grade_subjects", {})

    # Build subject lookup maps
    for code, info in _SUBJECTS_CATALOG.items():
        SUBJECT_EMOJI[code] = info.get("emoji", "📚")
        SUBJECT_LABEL[code] = info.get("label", code)
        if info.get("is_special"):
            SPECIAL_SUBJECTS.add(code)
        if info.get("is_core"):
            CORE_SUBJECTS.add(code)

    # Load bot config
    if os.path.isfile(BOT_CONFIG_FILE):
        _BOT_CONFIG = _read_json(BOT_CONFIG_FILE)

    # Load per-grade data
    for grade_num in [1, 2, 3, 4, 5]:
        grade_dir = os.path.join(CURRICULUM_DIR, f"grade_{grade_num}")
        if not os.path.isdir(grade_dir):
            continue

        books_file = os.path.join(grade_dir, "books.json")
        lessons_file = os.path.join(grade_dir, "lessons.json")
        units_file = os.path.join(grade_dir, "daily_learning_units.json")

        if os.path.isfile(books_file):
            books = _read_json(books_file)
            _grade_books[grade_num] = books
            for b in books:
                _all_books_by_id[b["book_id"]] = b

        if os.path.isfile(lessons_file):
            lessons = _read_json(lessons_file)
            _grade_lessons[grade_num] = lessons
            for l in lessons:
                _all_lessons_by_id[l["lesson_id"]] = l

        if os.path.isfile(units_file):
            units = _read_json(units_file)
            _grade_units[grade_num] = units
            for u in units:
                _all_units_by_id[u["daily_unit_id"]] = u

    _loaded = True


def _resolve_grade(grade: Optional[int] = None) -> int:
    if grade is not None:
        return grade
    try:
        from backend.learning_progress import get_progress
        p = get_progress()
        return p.get("active_grade", 2)
    except Exception:
        return 2


def get_bot_name() -> str:
    _load_data()
    name = _BOT_CONFIG.get("bot_name", "")
    return name if name else "VyVy"


def get_bot_config() -> Dict[str, Any]:
    _load_data()
    return dict(_BOT_CONFIG)


def get_grades() -> List[Dict[str, Any]]:
    _load_data()
    result = []
    for g in _GRADES:
        grade_num = g["grade"]
        book_count = len(_grade_books.get(grade_num, []))
        lesson_count = len(_grade_lessons.get(grade_num, []))
        unit_count = len(_grade_units.get(grade_num, []))
        result.append({
            **g,
            "book_count": book_count,
            "lesson_count": lesson_count,
            "unit_count": unit_count,
        })
    return result


def get_grade_status(grade: int) -> Dict[str, Any]:
    _load_data()
    for g in _GRADES:
        if g["grade"] == grade:
            book_count = len(_grade_books.get(grade, []))
            lesson_count = len(_grade_lessons.get(grade, []))
            unit_count = len(_grade_units.get(grade, []))
            return {
                **g,
                "book_count": book_count,
                "lesson_count": lesson_count,
                "unit_count": unit_count,
            }
    return {"grade": grade, "data_status": "NOT_FOUND"}


def get_curriculum_status() -> Dict[str, Any]:
    _load_data()
    total_books = sum(len(v) for v in _grade_books.values())
    total_lessons = sum(len(v) for v in _grade_lessons.values())
    total_units = sum(len(v) for v in _grade_units.values())
    return {
        "grades_available": len(_GRADES),
        "total_books": total_books,
        "total_lessons": total_lessons,
        "total_units": total_units,
        "grade_details": [
            {
                "grade": g["grade"],
                "status": g.get("data_status", "UNKNOWN"),
                "books": len(_grade_books.get(g["grade"], [])),
                "lessons": len(_grade_lessons.get(g["grade"], [])),
                "units": len(_grade_units.get(g["grade"], [])),
            }
            for g in _GRADES
        ],
    }


def get_all_books(grade: Optional[int] = None, subject: Optional[str] = None) -> List[Dict[str, Any]]:
    _load_data()
    g = _resolve_grade(grade)
    books = list(_grade_books.get(g, []))
    if subject:
        books = [b for b in books if b.get("subject") == subject]
    return books


def get_subjects_list(grade: Optional[int] = None) -> List[Dict[str, Any]]:
    _load_data()
    g = _resolve_grade(grade)
    grade_key = str(g)
    subject_codes = _GRADE_SUBJECTS.get(grade_key, [])
    books = _grade_books.get(g, [])

    subjects = []
    seen = set()
    for code in subject_codes:
        if code in seen:
            continue
        seen.add(code)
        book_count = sum(1 for b in books if b.get("subject") == code)
        unit_count = 0
        for u in _grade_units.get(g, []):
            if u.get("subject") == code:
                unit_count += 1
        subjects.append({
            "subject": code,
            "label": SUBJECT_LABEL.get(code, code),
            "emoji": SUBJECT_EMOJI.get(code, "📚"),
            "book_count": book_count,
            "unit_count": unit_count,
            "is_special": code in SPECIAL_SUBJECTS,
            "is_core": code in CORE_SUBJECTS,
            "grade": g,
        })
    return subjects


def get_lessons_by_subject(subject: str, grade: Optional[int] = None) -> List[Dict[str, Any]]:
    _load_data()
    g = _resolve_grade(grade)
    lessons = _grade_lessons.get(g, [])
    return [l for l in lessons if l.get("subject") == subject]


def get_lessons_by_book(book_id: str) -> List[Dict[str, Any]]:
    _load_data()
    return [l for l in _all_lessons_by_id.values() if l.get("book_id") == book_id]


def get_daily_units_by_subject(subject: str, grade: Optional[int] = None) -> List[Dict[str, Any]]:
    _load_data()
    g = _resolve_grade(grade)
    units = _grade_units.get(g, [])
    return [u for u in units if u.get("subject") == subject]


def get_daily_unit_by_id(unit_id: str) -> Optional[Dict[str, Any]]:
    _load_data()
    return _all_units_by_id.get(unit_id)


def get_book_by_id(book_id: str) -> Optional[Dict[str, Any]]:
    _load_data()
    return _all_books_by_id.get(book_id)


def get_suggested_subject(grade: Optional[int] = None) -> Dict[str, Any]:
    _load_data()
    g = _resolve_grade(grade)
    grade_key = str(g)
    subject_codes = _GRADE_SUBJECTS.get(grade_key, ["toan", "tieng_viet"])

    for code in subject_codes:
        units = [u for u in _grade_units.get(g, []) if u.get("subject") == code]
        if units:
            return {
                "subject": code,
                "label": SUBJECT_LABEL.get(code, code),
                "emoji": SUBJECT_EMOJI.get(code, "📚"),
                "grade": g,
            }
    if subject_codes:
        code = subject_codes[0]
        return {
            "subject": code,
            "label": SUBJECT_LABEL.get(code, code),
            "emoji": SUBJECT_EMOJI.get(code, "📚"),
            "grade": g,
        }
    return {"subject": "toan", "label": "Toán", "emoji": "🔢", "grade": g}


def is_special_subject(subject: str) -> bool:
    return subject in SPECIAL_SUBJECTS


def get_stats(grade: Optional[int] = None) -> Dict[str, int]:
    _load_data()
    g = _resolve_grade(grade)
    return {
        "grade": g,
        "books": len(_grade_books.get(g, [])),
        "lessons": len(_grade_lessons.get(g, [])),
        "daily_units": len(_grade_units.get(g, [])),
    }


def get_lessons_grouped_by_book(subject: str, grade: Optional[int] = None) -> List[Dict[str, Any]]:
    """Get lessons grouped by book for a subject, with daily units under each lesson."""
    _load_data()
    g = _resolve_grade(grade)
    books = [b for b in _grade_books.get(g, []) if b.get("subject") == subject]
    lessons = [l for l in _grade_lessons.get(g, []) if l.get("subject") == subject]
    units = [u for u in _grade_units.get(g, []) if u.get("subject") == subject]

    # Index lessons by book_id
    lessons_by_book: Dict[str, List[Dict[str, Any]]] = {}
    for l in lessons:
        bid = l.get("book_id", "")
        lessons_by_book.setdefault(bid, []).append(l)

    # Index units by lesson_id
    units_by_lesson: Dict[str, List[Dict[str, Any]]] = {}
    for u in units:
        lid = u.get("lesson_id", "")
        units_by_lesson.setdefault(lid, []).append(u)

    result = []
    for book in books:
        bid = book.get("book_id", "")
        book_lessons = sorted(lessons_by_book.get(bid, []), key=lambda l: l.get("lesson_order", 0))
        lesson_list = []
        for l in book_lessons:
            lid = l.get("lesson_id", "")
            lesson_units = sorted(units_by_lesson.get(lid, []), key=lambda u: u.get("unit_order", 0))
            lesson_list.append({
                "lesson_id": lid,
                "title": l.get("title", ""),
                "page_start": l.get("page_start"),
                "unit_count": len(lesson_units),
                "units": [
                    {
                        "daily_unit_id": u.get("daily_unit_id", ""),
                        "title": u.get("title", ""),
                    }
                    for u in lesson_units
                ],
            })
        result.append({
            "book_id": bid,
            "title": book.get("title", ""),
            "subject": subject,
            "lesson_count": len(lesson_list),
            "lessons": lesson_list,
        })
    return result


def get_adjacent_units(unit_id: str, subject: str, grade: Optional[int] = None) -> Dict[str, Any]:
    """Get previous and next units relative to the given unit_id."""
    _load_data()
    g = _resolve_grade(grade)
    units = sorted(
        [u for u in _grade_units.get(g, []) if u.get("subject") == subject],
        key=lambda u: u.get("unit_order", 0)
    )
    current_idx = -1
    for i, u in enumerate(units):
        if u.get("daily_unit_id") == unit_id:
            current_idx = i
            break

    prev_unit = None
    next_unit = None
    if current_idx > 0:
        u = units[current_idx - 1]
        prev_unit = {"daily_unit_id": u.get("daily_unit_id", ""), "title": u.get("title", "")}
    if current_idx >= 0 and current_idx < len(units) - 1:
        u = units[current_idx + 1]
        next_unit = {"daily_unit_id": u.get("daily_unit_id", ""), "title": u.get("title", "")}

    return {"prev": prev_unit, "next": next_unit}
