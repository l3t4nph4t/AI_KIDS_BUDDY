"""Tests for grade-aware curriculum loader."""

import json
import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.curriculum import (
    get_all_books,
    get_subjects_list,
    get_lessons_by_subject,
    get_daily_units_by_subject,
    get_daily_unit_by_id,
    get_book_by_id,
    get_suggested_subject,
    get_stats,
    is_special_subject,
    get_grades,
    get_grade_status,
    get_curriculum_status,
    get_bot_name,
    SUBJECT_LABEL,
    SUBJECT_EMOJI,
    SPECIAL_SUBJECTS,
)


def test_grade2_book_count():
    books = get_all_books(grade=2)
    assert len(books) == 8, f"Expected 8 G2 books, got {len(books)}"


def test_grade2_lesson_count():
    stats = get_stats(grade=2)
    assert stats["lessons"] == 203, f"Expected 203 G2 lessons, got {stats['lessons']}"


def test_grade2_daily_unit_count():
    stats = get_stats(grade=2)
    assert stats["daily_units"] == 198, f"Expected 198 G2 units, got {stats['daily_units']}"


def test_grades_list():
    grades = get_grades()
    assert len(grades) == 5
    grade_nums = [g["grade"] for g in grades]
    assert grade_nums == [1, 2, 3, 4, 5]


def test_grade1_books():
    books = get_all_books(grade=1)
    assert len(books) == 8


def test_grade3_books():
    books = get_all_books(grade=3)
    assert len(books) == 12


def test_grade4_books():
    books = get_all_books(grade=4)
    assert len(books) == 7


def test_grade5_books():
    books = get_all_books(grade=5)
    assert len(books) == 10


def test_grade2_status():
    status = get_grade_status(2)
    assert status["data_status"] == "IMPORTED"
    assert status["book_count"] == 8
    assert status["lesson_count"] == 203


def test_grade1_status():
    status = get_grade_status(1)
    assert status["data_status"] in ("BOOKS_ONLY", "IMPORTED", "COMPLETE")
    assert status["book_count"] == 8


def test_curriculum_status():
    status = get_curriculum_status()
    assert status["grades_available"] == 5
    assert status["total_books"] == 8 + 8 + 12 + 7 + 10
    assert status["total_lessons"] >= 203
    assert status["total_units"] >= 198


def test_subjects_list_grade2():
    subjects = get_subjects_list(grade=2)
    subj_names = [s["subject"] for s in subjects]
    assert "toan" in subj_names
    assert "tieng_viet" in subj_names
    assert "am_nhac" in subj_names


def test_subjects_list_grade3():
    subjects = get_subjects_list(grade=3)
    subj_names = [s["subject"] for s in subjects]
    assert "tieng_anh" in subj_names
    assert "tin_hoc" in subj_names


def test_subjects_list_grade4():
    subjects = get_subjects_list(grade=4)
    subj_names = [s["subject"] for s in subjects]
    assert "khoa_hoc" in subj_names
    assert "lich_su_dia_li" in subj_names


def test_fk_lessons_to_books_grade2():
    books = get_all_books(grade=2)
    book_ids = {b["book_id"] for b in books}
    lessons = get_lessons_by_subject("toan", grade=2)
    for lesson in lessons:
        assert lesson["book_id"] in book_ids


def test_fk_units_to_lessons_grade2():
    from backend.curriculum import _load_data, _all_lessons_by_id
    _load_data()
    units = get_daily_units_by_subject("toan", grade=2)
    for unit in units:
        assert unit["lesson_id"] in _all_lessons_by_id


def test_special_subjects():
    assert is_special_subject("am_nhac") is True
    assert is_special_subject("mi_thuat") is True
    assert is_special_subject("toan") is False
    assert is_special_subject("tieng_viet") is False


def test_daily_unit_lookup():
    unit = get_daily_unit_by_id("DU_G2_0001")
    assert unit is not None
    assert unit["subject"] == "toan"
    assert unit["grade"] == 2


def test_invalid_unit_returns_none():
    unit = get_daily_unit_by_id("INVALID_ID_XYZ")
    assert unit is None


def test_bot_name():
    name = get_bot_name()
    assert name == "VyVy"
    assert len(name) > 0


def test_suggested_subject_grade2():
    s = get_suggested_subject(grade=2)
    assert "subject" in s
    assert s["grade"] == 2


def test_suggested_subject_grade1():
    s = get_suggested_subject(grade=1)
    assert "subject" in s
    assert s["grade"] == 1


def test_json_files_parse():
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "data", "curriculum")
    for grade in [1, 2, 3, 4, 5]:
        grade_dir = os.path.join(data_dir, f"grade_{grade}")
        for fname in ["books.json", "lessons.json", "daily_learning_units.json"]:
            path = os.path.join(grade_dir, fname)
            assert os.path.isfile(path), f"Missing: {path}"
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            assert isinstance(data, list)


def test_utf8_no_mojibake():
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "data", "curriculum")
    patterns = ["Há»", "Tiáº", "\ufffd"]
    for grade in [1, 2, 3, 4, 5]:
        for fname in ["books.json"]:
            path = os.path.join(data_dir, f"grade_{grade}", fname)
            if not os.path.isfile(path):
                continue
            with open(path, encoding="utf-8") as f:
                content = f.read()
            for pat in patterns:
                assert pat not in content, f"Mojibake in {path}"


def test_vietnamese_accents_preserved():
    path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "backend", "data", "curriculum", "grade_2", "books.json"
    )
    with open(path, encoding="utf-8") as f:
        books = json.load(f)
    titles = [b["title"] for b in books]
    assert any("Toán" in t for t in titles)
    assert any("Tiếng" in t for t in titles)


def test_grade_filter_by_subject():
    books = get_all_books(grade=3, subject="toan")
    assert len(books) == 2
    for b in books:
        assert b["subject"] == "toan"
        assert b["grade"] == 3
