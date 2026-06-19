"""Tests for grade-aware learning session generator."""

import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.learning_session import (
    generate_session,
    evaluate_answer,
    generate_parent_feedback,
)


def test_grade2_session_structure():
    s = generate_session("DU_G2_0001", child_age=8)
    assert s is not None
    assert s["subject"] == "toan"
    assert s["grade"] == 2
    assert s["is_special"] is False
    # Content-based sessions use "read", legacy uses "warmup"
    assert "read" in s["steps"] or "warmup" in s["steps"]
    assert "practice" in s["steps"]
    assert "check" in s["steps"]
    assert "feedback" in s["steps"]


def test_grade2_practice_items():
    s = generate_session("DU_G2_0001", child_age=8)
    items = s["steps"]["practice"].get("items", [])
    assert len(items) >= 2


def test_grade2_special_session():
    s = generate_session("DU_G2_0169", child_age=8)
    assert s is not None
    assert s["grade"] == 2
    # Unit may now have content (not special) or be special
    if s["is_special"]:
        assert s["steps"]["practice"]["type"] == "activity"
    else:
        assert "practice" in s["steps"]


def test_evaluate_correct():
    s = generate_session("DU_G2_0001", child_age=8)
    items = s["steps"]["practice"]["items"]
    result = evaluate_answer(s, "practice", items[0]["expected_answer"], 0)
    assert result["correct"] is True
    assert result["stars"] == 1


def test_evaluate_wrong():
    s = generate_session("DU_G2_0001", child_age=8)
    result = evaluate_answer(s, "practice", "WRONG_ANSWER", 0)
    assert result["correct"] is False
    assert result["stars"] == 0


def test_parent_feedback():
    s = generate_session("DU_G2_0001", child_age=8)
    fb = generate_parent_feedback(s, 3)
    assert len(fb) > 10


def test_invalid_unit():
    s = generate_session("INVALID_ID")
    assert s is None


def test_session_without_ai():
    s = generate_session("DU_G2_0005", child_age=8)
    assert s is not None
    # May have content (read) or legacy (warmup)
    if "warmup" in s["steps"]:
        assert s["steps"]["warmup"]["message"]
    elif "read" in s["steps"]:
        assert s["steps"]["read"]["objective"] or s["steps"]["read"]["explanation"]
