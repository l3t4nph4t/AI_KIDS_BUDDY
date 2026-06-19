"""VyVy — Learning Progress Tracker (Multi-Grade).

Stores completed units, scores, streak in backend/data/learning_progress.json.
Supports active_grade and per-grade progress tracking.
Uses atomic temp-file replace + process-level lock for safe writes.
"""

import json
import os
import tempfile
import threading
from datetime import datetime, timezone, date
from typing import Any, Dict, List, Optional

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
PROGRESS_FILE = os.path.join(DATA_DIR, "learning_progress.json")

_lock = threading.Lock()

DEFAULT_SCHEMA: Dict[str, Any] = {
    "active_grade": 2,
    "completed_units": [],
    "unit_scores": {},
    "grade_progress": {},
    "subject_progress": {},
    "streak": 0,
    "last_date": None,
    "sessions": [],
    "purchased_avatars": [],
}


def _ensure_file() -> None:
    if not os.path.isfile(PROGRESS_FILE):
        _atomic_write(DEFAULT_SCHEMA)


def _read() -> Dict[str, Any]:
    _ensure_file()
    try:
        with open(PROGRESS_FILE, encoding="utf-8") as f:
            data = json.load(f)
        for key, val in DEFAULT_SCHEMA.items():
            if key not in data:
                data[key] = val
        return data
    except (json.JSONDecodeError, OSError):
        return dict(DEFAULT_SCHEMA)


def _atomic_write(data: Dict[str, Any]) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(suffix=".tmp", dir=DATA_DIR)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as tmp_f:
            json.dump(data, tmp_f, ensure_ascii=False, indent=2)
            tmp_f.flush()
            os.fsync(tmp_f.fileno())
        os.replace(tmp_path, PROGRESS_FILE)
    except Exception:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


def _detect_grade_from_unit(unit_id: str) -> int:
    """Detect grade from unit_id prefix like DU_G2_0001 -> 2."""
    import re
    match = re.search(r"_G(\d)_", unit_id)
    if match:
        return int(match.group(1))
    return 2


def get_progress(grade: Optional[int] = None) -> Dict[str, Any]:
    with _lock:
        data = _read()
        if grade is not None:
            filtered_completed = [
                uid for uid in data.get("completed_units", [])
                if _detect_grade_from_unit(uid) == grade
            ]
            filtered_scores = {
                k: v for k, v in data.get("unit_scores", {}).items()
                if v.get("grade") == grade
            }
            grade_prog = data.get("grade_progress", {}).get(str(grade), {})
            return {
                "active_grade": data.get("active_grade", 2),
                "completed_units": filtered_completed,
                "unit_scores": filtered_scores,
                "grade_progress": {str(grade): grade_prog},
                "subject_progress": grade_prog.get("subject_progress", {}),
                "streak": data.get("streak", 0),
                "last_date": data.get("last_date"),
                "sessions": [
                    s for s in data.get("sessions", [])
                    if s.get("grade") == grade
                ],
            }
        return data


def get_active_grade() -> int:
    with _lock:
        data = _read()
        return data.get("active_grade", 2)


def set_active_grade(grade: int) -> Dict[str, Any]:
    with _lock:
        data = _read()
        data["active_grade"] = grade
        _atomic_write(data)
        return {"status": "ok", "active_grade": grade}


def get_subject_progress(subject: str, grade: Optional[int] = None) -> Dict[str, Any]:
    with _lock:
        data = _read()
        g = grade if grade is not None else data.get("active_grade", 2)

        subject_completed = []
        for uid in data.get("completed_units", []):
            unit_data = data.get("unit_scores", {}).get(uid, {})
            if unit_data.get("subject") == subject and unit_data.get("grade") == g:
                subject_completed.append(uid)

        grade_prog = data.get("grade_progress", {}).get(str(g), {})
        subj_prog = grade_prog.get("subject_progress", {})
        total = subj_prog.get(subject, 0)

        return {
            "subject": subject,
            "grade": g,
            "completed_count": len(subject_completed),
            "total_from_tracker": total,
            "units": subject_completed,
        }


def mark_completed(
    unit_id: str,
    subject: str,
    score: int = 0,
    stars: int = 0,
    grade: Optional[int] = None,
) -> Dict[str, Any]:
    with _lock:
        data = _read()
        now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        today_str = date.today().isoformat()
        g = grade if grade is not None else _detect_grade_from_unit(unit_id)

        if unit_id in data["completed_units"]:
            return {"status": "already_completed", "unit_id": unit_id}

        data["completed_units"].append(unit_id)

        data["unit_scores"][unit_id] = {
            "grade": g,
            "subject": subject,
            "score": score,
            "stars": stars,
            "completed_at": now_iso,
        }

        grade_key = str(g)
        if grade_key not in data["grade_progress"]:
            data["grade_progress"][grade_key] = {"subject_progress": {}, "completed_count": 0}
        grade_prog = data["grade_progress"][grade_key]
        grade_prog["completed_count"] = grade_prog.get("completed_count", 0) + 1
        subj_prog = grade_prog.get("subject_progress", {})
        subj_prog[subject] = subj_prog.get(subject, 0) + 1
        grade_prog["subject_progress"] = subj_prog

        global_subj = data.get("subject_progress", {})
        global_subj[subject] = global_subj.get(subject, 0) + 1
        data["subject_progress"] = global_subj

        last = data.get("last_date")
        if last == today_str:
            pass
        elif last is not None:
            try:
                last_d = date.fromisoformat(last)
                today_d = date.today()
                diff = (today_d - last_d).days
                if diff == 1:
                    data["streak"] = data.get("streak", 0) + 1
                elif diff > 1:
                    data["streak"] = 1
            except (ValueError, TypeError):
                data["streak"] = 1
        else:
            data["streak"] = 1

        data["last_date"] = today_str

        session_record = {
            "unit_id": unit_id,
            "grade": g,
            "subject": subject,
            "score": score,
            "stars": stars,
            "completed_at": now_iso,
        }
        data.setdefault("sessions", []).append(session_record)

        _atomic_write(data)

        return {
            "status": "completed",
            "unit_id": unit_id,
            "grade": g,
            "subject": subject,
            "score": score,
            "stars": stars,
            "streak": data["streak"],
        }


def reset_progress(grade: Optional[int] = None) -> Dict[str, Any]:
    with _lock:
        if grade is not None:
            data = _read()
            grade_key = str(grade)
            units_to_remove = [
                uid for uid in data.get("completed_units", [])
                if _detect_grade_from_unit(uid) == grade
            ]
            for uid in units_to_remove:
                data["completed_units"].remove(uid)
                data["unit_scores"].pop(uid, None)
            data["grade_progress"].pop(grade_key, None)
            data["sessions"] = [
                s for s in data.get("sessions", [])
                if s.get("grade") != grade
            ]
            _atomic_write(data)
            return {"status": "reset", "grade": grade, "message": f"Grade {grade} progress cleared."}
        else:
            _atomic_write(dict(DEFAULT_SCHEMA))
            return {"status": "reset", "message": "All progress cleared."}


def get_next_unit(grade: int, subject: str) -> Optional[Dict[str, Any]]:
    """Find the next uncompleted unit for a given grade and subject."""
    from backend.curriculum import get_daily_units_by_subject
    with _lock:
        data = _read()
        completed = set(data.get("completed_units", []))
        units = get_daily_units_by_subject(subject, grade=grade)
        if not units:
            return None
        pending = [u for u in units if u["daily_unit_id"] not in completed]
        if pending:
            return pending[0]
        return None


def get_learning_history(grade: Optional[int] = None, limit: int = 50) -> List[Dict[str, Any]]:
    """Return recent learning sessions, newest first."""
    with _lock:
        data = _read()
        sessions = data.get("sessions", [])
        if grade is not None:
            sessions = [s for s in sessions if s.get("grade") == grade]
        sessions = sorted(sessions, key=lambda s: s.get("completed_at", ""), reverse=True)
        return sessions[:limit]


def get_cumulative_stars(grade: Optional[int] = None) -> Dict[str, Any]:
    """Calculate total stars earned across all completed units."""
    with _lock:
        data = _read()
        total_stars = 0
        stars_by_subject = {}
        
        for uid, score_data in data.get("unit_scores", {}).items():
            if grade is not None and score_data.get("grade") != grade:
                continue
            stars = score_data.get("stars", 0)
            subject = score_data.get("subject", "unknown")
            total_stars += stars
            stars_by_subject[subject] = stars_by_subject.get(subject, 0) + stars
        
        return {
            "total_stars": total_stars,
            "stars_by_subject": stars_by_subject,
            "grade": grade,
        }


def get_avatar() -> Dict[str, Any]:
    """Get current selected avatar."""
    with _lock:
        data = _read()
        return data.get("avatar", {"id": "robot_default", "name": "Robot VyVy", "emoji": "🤖"})


def set_avatar(avatar_id: str, avatar_name: str, avatar_emoji: str) -> Dict[str, Any]:
    """Save selected avatar and add to purchased list."""
    with _lock:
        data = _read()
        data["avatar"] = {
            "id": avatar_id,
            "name": avatar_name,
            "emoji": avatar_emoji,
        }
        # Add to purchased avatars if not already there
        purchased = data.get("purchased_avatars", [])
        if not any(a.get("id") == avatar_id for a in purchased):
            purchased.append({
                "id": avatar_id,
                "name": avatar_name,
                "emoji": avatar_emoji,
            })
            data["purchased_avatars"] = purchased
        _atomic_write(data)
        return data["avatar"]


def get_purchased_avatars() -> List[Dict[str, Any]]:
    """Get list of purchased avatars."""
    with _lock:
        data = _read()
        return data.get("purchased_avatars", [])
