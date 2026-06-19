"""Tests for multi-grade learning progress tracker."""

import json
import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.learning_progress import (
    get_progress,
    get_subject_progress,
    mark_completed,
    reset_progress,
    get_active_grade,
    set_active_grade,
    PROGRESS_FILE,
)


@pytest.fixture(autouse=True)
def clean_progress():
    reset_progress()
    yield
    reset_progress()


def test_default_active_grade():
    assert get_active_grade() == 2


def test_set_active_grade():
    set_active_grade(3)
    assert get_active_grade() == 3
    set_active_grade(2)
    assert get_active_grade() == 2


def test_default_progress():
    p = get_progress()
    assert p["completed_units"] == []
    assert p["active_grade"] == 2


def test_mark_completed_with_grade():
    result = mark_completed("DU_G2_TEST", "toan", score=80, stars=3, grade=2)
    assert result["status"] == "completed"
    assert result["grade"] == 2


def test_mark_completed_auto_grade():
    result = mark_completed("DU_G3_TEST", "tieng_viet", score=90, stars=4)
    assert result["grade"] == 3


def test_progress_filtered_by_grade():
    mark_completed("DU_G2_A", "toan", grade=2)
    mark_completed("DU_G3_A", "toan", grade=3)
    p2 = get_progress(grade=2)
    p3 = get_progress(grade=3)
    assert len(p2["completed_units"]) == 1
    assert len(p3["completed_units"]) == 1


def test_grade_progress():
    mark_completed("DU_G2_X1", "toan", grade=2)
    mark_completed("DU_G2_X2", "toan", grade=2)
    p = get_progress(grade=2)
    gp = p["grade_progress"].get("2", {})
    assert gp.get("completed_count", 0) == 2


def test_subject_progress_by_grade():
    mark_completed("DU_G2_SP1", "am_nhac", grade=2)
    sp = get_subject_progress("am_nhac", grade=2)
    assert sp["completed_count"] == 1


def test_duplicate():
    mark_completed("DU_DUP", "toan", grade=2)
    r = mark_completed("DU_DUP", "toan", grade=2)
    assert r["status"] == "already_completed"


def test_reset_grade():
    mark_completed("DU_G2_RST", "toan", grade=2)
    reset_progress(grade=2)
    p = get_progress(grade=2)
    assert len(p["completed_units"]) == 0


def test_reset_all():
    mark_completed("DU_RST_A", "toan", grade=2)
    reset_progress()
    p = get_progress()
    assert len(p["completed_units"]) == 0
    assert p["active_grade"] == 2


def test_json_parse():
    mark_completed("DU_PARSE", "toan", grade=2)
    with open(PROGRESS_FILE, encoding="utf-8") as f:
        data = json.load(f)
    assert isinstance(data, dict)
    assert "active_grade" in data


def test_utf8_no_mojibake():
    mark_completed("DU_UTF8", "toan", grade=2)
    with open(PROGRESS_FILE, encoding="utf-8") as f:
        content = f.read()
    for pat in ["Há»", "Tiáº", "\ufffd"]:
        assert pat not in content


def test_unit_scores_has_grade():
    mark_completed("DU_SCORE", "toan", score=75, stars=3, grade=2)
    p = get_progress()
    score_data = p["unit_scores"]["DU_SCORE"]
    assert score_data["grade"] == 2
    assert score_data["score"] == 75
    assert score_data["stars"] == 3
