import os
import re
import json
import logging
from fastapi import FastAPI, Request, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

logger = logging.getLogger("vyvy")

from backend.safety_alpha import check_safety
from backend.prompts import build_prompt, build_learning_prompt
from backend.mimo_client import call_mimo
from backend.curriculum import (
    get_all_books,
    get_subjects_list,
    get_lessons_by_subject,
    get_daily_unit_by_id,
    get_daily_units_by_subject,
    get_suggested_subject,
    get_lessons_grouped_by_book,
    get_adjacent_units,
    get_stats,
    is_special_subject,
    get_grades,
    get_grade_status,
    get_curriculum_status,
    get_bot_name,
    get_bot_config,
    SUBJECT_LABEL,
    SUBJECT_EMOJI,
)
from backend.music_data import get_songs
from backend.learning_progress import (
    get_progress,
    get_subject_progress,
    mark_completed,
    reset_progress,
    get_active_grade,
    set_active_grade,
    get_next_unit,
    get_learning_history,
    get_cumulative_stars,
    get_avatar,
    set_avatar,
    get_purchased_avatars,
)
from backend.learning_session import (
    generate_session,
    evaluate_answer,
    generate_parent_feedback,
)
from backend.lesson_content import (
    get_content_by_unit_id,
    has_content as unit_has_content,
    get_content_stats,
    get_pdf_info,
    get_explanation_by_unit_id,
    has_explanation,
)

app = FastAPI(title="VyVy — bạn AI của con")

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB_DIR = os.path.join(PROJECT_ROOT, "web")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Pre-warm curriculum data on startup to avoid lazy-load delays."""
    try:
        from backend.curriculum import _load_data
        _load_data()
        logger.info("Curriculum data pre-warmed successfully")
    except Exception as e:
        logger.warning(f"Failed to pre-warm curriculum data: {e}")
    try:
        from backend.lesson_content import get_content_stats
        stats = get_content_stats()
        logger.info(f"Lesson content stats: {stats}")
    except Exception as e:
        logger.warning(f"Failed to load lesson content stats: {e}")


class ChatRequest(BaseModel):
    text: str
    child_age: int = 8
    mode: str = "balanced"
    nickname: Optional[str] = None
    goal: Optional[str] = None
    learning_goal: Optional[str] = None
    learning_mode: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = None
    profile_memory: Optional[Dict[str, Any]] = None
    session_mode: Optional[str] = "free_chat"


class ChatResponse(BaseModel):
    reply: str
    safety_flag: Optional[bool] = None


def _text_chat_fallback(user_text: str, nickname: str, session_mode: str) -> str:
    text = (user_text or "").strip().lower()
    name = nickname or "ban nho"
    if any(word in text for word in ["xin chao", "chao", "hello", "hi"]):
        return f"Chao {name}! VyVy day. Hom nay ban muon hoc, ke chuyen, hay noi ve dieu gi?"
    if any(word in text for word in ["toan", "cong", "tru", "nhan", "chia"]):
        return "VyVy nghe ban nhac den Toan. Ban gui phep tinh hoac bai tap, minh cung lam tung buoc nhe."
    if any(word in text for word in ["hoc", "bai", "sgk", "tieng viet"]):
        return "VyVy da nhan tin cua ban. Ban chon lop, mon va bai hoc, minh se giup doc bai va luyen tap."
    if session_mode == "free_chat":
        return f"VyVy da doc tin nhan cua {name}: \"{user_text[:80]}\". Ban ke them mot chut nua nhe."
    return "VyVy da nhan tin nhan cua ban. Minh se tra loi don gian va de hieu nhe."


def _is_provider_fallback(reply_text: str) -> bool:
    text = (reply_text or "").strip().lower()
    fallback_markers = [
        "chưa cấu hình",
        "chua cau hinh",
        "chưa nghe rõ",
        "chua nghe ro",
        "chưa hiểu câu hỏi",
        "chua hieu cau hoi",
    ]
    return any(marker in text for marker in fallback_markers)


@app.get("/health")
async def health():
    return {"status": "ok", "app": "VyVy", "version": "2.0.0"}


@app.get("/tts/status")
async def tts_status():
    try:
        import edge_tts
        return {
            "available": True,
            "voices": ["vi-VN-HoaiMyNeural", "vi-VN-NamMinhNeural"],
            "presets": {
                "ban-nho": {"label": "Bạn nhỏ", "pitch": "+20Hz", "rate": "+5%"},
                "vui-tuoi": {"label": "Vui tươi", "pitch": "+30Hz", "rate": "+15%"},
                "binh-thuong": {"label": "Bình thường", "pitch": "+5Hz", "rate": "-5%"}
            }
        }
    except ImportError:
        return {"available": False}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    user_text = req.text.strip()

    if not user_text:
        return JSONResponse(
            content={"reply": "Bạn chưa nói gì nè, thử lại nhé!", "safety_flag": None},
            media_type="application/json; charset=utf-8",
        )

    safety_result = check_safety(user_text)

    if safety_result["blocked"]:
        return JSONResponse(
            content={"reply": safety_result["redirect_message"], "safety_flag": True},
            media_type="application/json; charset=utf-8",
        )

    child_age = max(5, min(12, req.child_age))
    nickname = req.nickname or "bạn nhỏ"
    goal = req.goal or "vui vẻ và học hỏi"
    session_mode = req.session_mode or "free_chat"
    learning_goal = req.learning_goal or req.goal
    learning_mode = req.learning_mode or req.mode

    system_prompt = build_prompt(
        child_age=child_age,
        nickname=nickname,
        goal=goal,
        mode=req.mode,
        session_mode=session_mode,
        learning_goal=learning_goal,
        profile_memory=req.profile_memory,
        history=req.history,
    )

    messages = [{"role": "system", "content": system_prompt}]

    if req.history:
        for msg in req.history[-10:]:
            if isinstance(msg, dict) and msg.get("role") and msg.get("content"):
                messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": user_text})

    try:
        reply_text = await call_mimo(system_prompt, user_text, history=req.history)
        if _is_provider_fallback(reply_text):
            reply_text = _text_chat_fallback(user_text, nickname, session_mode)
    except Exception as exc:
        logger.error("MIMO call failed: %s", exc, exc_info=True)
        reply_text = _text_chat_fallback(user_text, nickname, session_mode)

    return JSONResponse(
        content={"reply": reply_text, "safety_flag": None},
        media_type="application/json; charset=utf-8",
    )


# ── Curriculum Pydantic models ─────────────

class SessionStartRequest(BaseModel):
    unit_id: Optional[str] = None
    subject: Optional[str] = None
    grade: Optional[int] = None
    child_age: int = 8
    nickname: Optional[str] = None


class SessionRespondRequest(BaseModel):
    session_data: Dict[str, Any]
    step: str
    user_answer: str = ""
    item_index: int = 0
    child_age: int = 8
    nickname: Optional[str] = None
    practice_stars: Optional[int] = None


class CompleteRequest(BaseModel):
    unit_id: str
    subject: str
    grade: Optional[int] = None
    score: int = 0
    stars: int = 0


class ResetRequest(BaseModel):
    confirm: bool = False
    grade: Optional[int] = None
    pin: Optional[str] = None


class ActiveGradeRequest(BaseModel):
    grade: int


# ── Curriculum endpoints ────────────────────

@app.get("/curriculum/grades")
async def curriculum_grades():
    grades = get_grades()
    return JSONResponse(
        content={"grades": grades},
        media_type="application/json; charset=utf-8",
    )


@app.get("/curriculum/status")
async def curriculum_status():
    status = get_curriculum_status()
    return JSONResponse(
        content=status,
        media_type="application/json; charset=utf-8",
    )


@app.get("/curriculum/subjects")
async def curriculum_subjects(grade: Optional[int] = None):
    g = grade if grade is not None else get_active_grade()
    subjects = get_subjects_list(grade=g)
    return JSONResponse(
        content={"subjects": subjects, "grade": g},
        media_type="application/json; charset=utf-8",
    )


@app.get("/curriculum/books")
async def curriculum_books(grade: Optional[int] = None, subject: str = ""):
    g = grade if grade is not None else get_active_grade()
    books = get_all_books(grade=g, subject=subject if subject else None)
    return JSONResponse(
        content={"books": books, "count": len(books), "grade": g},
        media_type="application/json; charset=utf-8",
    )


@app.get("/curriculum/lessons")
async def curriculum_lessons(grade: Optional[int] = None, subject: str = "", book_id: str = ""):
    g = grade if grade is not None else get_active_grade()
    if book_id:
        from backend.curriculum import get_lessons_by_book
        lessons = get_lessons_by_book(book_id)
        return JSONResponse(
            content={"lessons": lessons, "count": len(lessons), "grade": g},
            media_type="application/json; charset=utf-8",
        )
    if not subject:
        return JSONResponse(
            content={"error": "Missing 'subject' or 'book_id' parameter", "lessons": []},
            status_code=400,
            media_type="application/json; charset=utf-8",
        )
    lessons = get_lessons_by_subject(subject, grade=g)
    return JSONResponse(
        content={"lessons": lessons, "count": len(lessons), "subject": subject, "grade": g},
        media_type="application/json; charset=utf-8",
    )


@app.get("/curriculum/lessons-grouped")
async def curriculum_lessons_grouped(grade: Optional[int] = None, subject: str = ""):
    """Get lessons grouped by book for a subject, with completion status."""
    if not subject:
        return JSONResponse(
            content={"error": "Missing 'subject' parameter", "books": []},
            status_code=400,
            media_type="application/json; charset=utf-8",
        )
    g = grade if grade is not None else get_active_grade()
    from backend.learning_progress import get_progress
    progress = get_progress(g)
    completed = set(progress.get("completed_units", []))

    books = get_lessons_grouped_by_book(subject, grade=g)
    # Mark completion status for each unit
    for book in books:
        for lesson in book.get("lessons", []):
            completed_count = 0
            for unit in lesson.get("units", []):
                uid = unit.get("daily_unit_id", "")
                unit["completed"] = uid in completed
                if uid in completed:
                    completed_count += 1
            lesson["completed_count"] = completed_count
            lesson["all_completed"] = completed_count == len(lesson.get("units", [])) if lesson.get("units") else False

    return JSONResponse(
        content={"books": books, "subject": subject, "grade": g},
        media_type="application/json; charset=utf-8",
    )


@app.get("/curriculum/adjacent-units")
async def curriculum_adjacent_units(unit_id: str = "", subject: str = "", grade: Optional[int] = None):
    """Get previous and next units for navigation."""
    if not unit_id or not subject:
        return JSONResponse(
            content={"error": "Missing 'unit_id' or 'subject' parameter"},
            status_code=400,
            media_type="application/json; charset=utf-8",
        )
    g = grade if grade is not None else get_active_grade()
    result = get_adjacent_units(unit_id, subject, grade=g)
    return JSONResponse(
        content=result,
        media_type="application/json; charset=utf-8",
    )


@app.get("/curriculum/daily-unit")
async def curriculum_daily_unit(grade: Optional[int] = None, subject: str = ""):
    import random
    g = grade if grade is not None else get_active_grade()

    if subject:
        units = get_daily_units_by_subject(subject, grade=g)
    else:
        suggested = get_suggested_subject(grade=g)
        subject = suggested["subject"]
        units = get_daily_units_by_subject(subject, grade=g)

    if not units:
        return JSONResponse(
            content={"error": f"No units for subject '{subject}' at grade {g}", "units": [], "grade": g},
            status_code=404,
            media_type="application/json; charset=utf-8",
        )

    progress = get_progress(grade=g)
    completed = set(progress.get("completed_units", []))
    pending = [u for u in units if u["daily_unit_id"] not in completed]
    if not pending:
        pending = units

    unit = random.choice(pending)

    return JSONResponse(
        content={
            "unit": unit,
            "subject": subject,
            "grade": g,
            "subject_label": SUBJECT_LABEL.get(subject, subject),
            "subject_emoji": SUBJECT_EMOJI.get(subject, "📚"),
            "is_special": is_special_subject(subject),
        },
        media_type="application/json; charset=utf-8",
    )


@app.post("/curriculum/session/start")
async def curriculum_session_start(req: SessionStartRequest):
    import random
    g = req.grade if req.grade is not None else get_active_grade()
    unit_id = req.unit_id

    if not unit_id:
        if req.subject:
            units = get_daily_units_by_subject(req.subject, grade=g)
        else:
            suggested = get_suggested_subject(grade=g)
            units = get_daily_units_by_subject(suggested["subject"], grade=g)

        if not units:
            return JSONResponse(
                content={"error": "No units available", "grade": g},
                status_code=404,
                media_type="application/json; charset=utf-8",
            )

        progress = get_progress(grade=g)
        completed = set(progress.get("completed_units", []))
        pending = [u for u in units if u["daily_unit_id"] not in completed]
        if not pending:
            pending = units
        unit_id = random.choice(pending)["daily_unit_id"]

    session = generate_session(unit_id, child_age=req.child_age)
    if session is None:
        return JSONResponse(
            content={"error": f"Unit '{unit_id}' not found"},
            status_code=404,
            media_type="application/json; charset=utf-8",
        )

    if session.get("has_content"):
        read_step = session["steps"]["read"]
        return JSONResponse(
            content={
                "session": session,
                "current_step": "read",
                "message": read_step.get("objective", ""),
                "unit_id": unit_id,
                "grade": g,
            },
            media_type="application/json; charset=utf-8",
        )

    warmup_msg = session["steps"]["warmup"]["message"]

    return JSONResponse(
        content={
            "session": session,
            "current_step": "warmup",
            "message": warmup_msg,
            "unit_id": unit_id,
            "grade": g,
        },
        media_type="application/json; charset=utf-8",
    )


@app.post("/curriculum/session/respond")
async def curriculum_session_respond(req: SessionRespondRequest):
    session = req.session_data
    step = req.step
    bot_name = get_bot_name()

    if step == "read":
        practice_items = session.get("steps", {}).get("practice", {}).get("items", [])
        if practice_items:
            first_q = practice_items[0].get("question", "")
            return JSONResponse(
                content={
                    "next_step": "practice",
                    "message": first_q,
                    "item_index": 0,
                    "total_items": len(practice_items),
                },
                media_type="application/json; charset=utf-8",
            )
        else:
            activity_msg = session.get("steps", {}).get("practice", {}).get("message", "")
            return JSONResponse(
                content={
                    "next_step": "practice",
                    "message": activity_msg,
                    "item_index": 0,
                    "total_items": 0,
                },
                media_type="application/json; charset=utf-8",
            )

    if step == "warmup":
        practice_items = session.get("steps", {}).get("practice", {}).get("items", [])
        if practice_items:
            first_q = practice_items[0].get("question", "")
            return JSONResponse(
                content={
                    "next_step": "practice",
                    "message": first_q,
                    "item_index": 0,
                    "total_items": len(practice_items),
                },
                media_type="application/json; charset=utf-8",
            )
        else:
            activity_msg = session.get("steps", {}).get("practice", {}).get("message", "")
            return JSONResponse(
                content={
                    "next_step": "practice",
                    "message": activity_msg,
                    "item_index": 0,
                    "total_items": 0,
                },
                media_type="application/json; charset=utf-8",
            )

    if step == "practice":
        result = evaluate_answer(session, "practice", req.user_answer, req.item_index)
        practice_items = session.get("steps", {}).get("practice", {}).get("items", [])

        if not result.get("correct", False):
            # Wrong answer: show correct answer and re-ask same question
            expected = result.get("expected", "")
            current_q = ""
            if 0 <= req.item_index < len(practice_items):
                current_q = practice_items[req.item_index].get("question", "")
            msg = result["praise"]
            if expected:
                msg += "\nĐáp án đúng là: **" + str(expected) + "**"
            if current_q:
                msg += "\nThử lại nhé: " + current_q
            return JSONResponse(
                content={
                    "next_step": "practice",
                    "evaluation": result,
                    "message": msg,
                    "item_index": req.item_index,
                    "total_items": len(practice_items),
                    "retry": True,
                },
                media_type="application/json; charset=utf-8",
            )

        # Correct answer: advance to next
        next_index = req.item_index + 1
        if next_index < len(practice_items):
            next_q = practice_items[next_index].get("question", "")
            return JSONResponse(
                content={
                    "next_step": "practice",
                    "evaluation": result,
                    "message": result["praise"] + "\n" + next_q,
                    "item_index": next_index,
                    "total_items": len(practice_items),
                },
                media_type="application/json; charset=utf-8",
            )
        else:
            check_q = session.get("steps", {}).get("check", {}).get("question", "")
            return JSONResponse(
                content={
                    "next_step": "check",
                    "evaluation": result,
                    "message": result["praise"] + "\n" + check_q,
                    "item_index": next_index,
                    "total_items": len(practice_items),
                },
                media_type="application/json; charset=utf-8",
            )

    if step == "check":
        result = evaluate_answer(session, "check", req.user_answer)
        check_stars = result.get("stars", 0)
        # Use practice_stars from frontend if provided, otherwise fallback to len(items)
        practice_stars = getattr(req, 'practice_stars', None)
        if practice_stars is None:
            practice_stars = len(session.get("steps", {}).get("practice", {}).get("items", []))
        total_stars = practice_stars + check_stars
        feedback = generate_parent_feedback(session, total_stars)
        return JSONResponse(
            content={
                "next_step": "feedback",
                "evaluation": result,
                "message": result["praise"] + "\n\n" + feedback,
                "total_stars": total_stars,
                "parent_feedback": feedback,
                "unit_id": session.get("unit_id", ""),
                "subject": session.get("subject", ""),
                "grade": session.get("grade", 2),
            },
            media_type="application/json; charset=utf-8",
        )

    if step == "feedback":
        return JSONResponse(
            content={
                "next_step": "done",
                "message": f"Buổi học kết thúc rồi! {bot_name} vui quá! 🌟",
            },
            media_type="application/json; charset=utf-8",
        )

    return JSONResponse(
        content={"error": f"Unknown step '{step}'"},
        status_code=400,
        media_type="application/json; charset=utf-8",
    )


@app.post("/curriculum/complete")
async def curriculum_complete(req: CompleteRequest):
    g = req.grade if req.grade is not None else get_active_grade()
    result = mark_completed(
        unit_id=req.unit_id,
        subject=req.subject,
        score=req.score,
        stars=req.stars,
        grade=g,
    )
    return JSONResponse(
        content=result,
        media_type="application/json; charset=utf-8",
    )


@app.get("/curriculum/progress")
async def curriculum_progress(grade: Optional[int] = None):
    g = grade if grade is not None else get_active_grade()
    progress = get_progress(grade=g)
    stars = get_cumulative_stars(grade=g)
    progress["cumulative_stars"] = stars
    return JSONResponse(
        content=progress,
        media_type="application/json; charset=utf-8",
    )


@app.post("/curriculum/active-grade")
async def curriculum_active_grade(req: ActiveGradeRequest):
    if req.grade < 1 or req.grade > 5:
        return JSONResponse(
            content={"error": "Grade must be 1-5"},
            status_code=400,
            media_type="application/json; charset=utf-8",
        )
    result = set_active_grade(req.grade)
    return JSONResponse(
        content=result,
        media_type="application/json; charset=utf-8",
    )


@app.get("/curriculum/next-unit")
async def curriculum_next_unit(grade: Optional[int] = None, subject: str = ""):
    g = grade if grade is not None else get_active_grade()
    if not subject:
        suggested = get_suggested_subject(grade=g)
        subject = suggested["subject"]
    unit = get_next_unit(g, subject)
    if unit is None:
        return JSONResponse(
            content={"unit": None, "subject": subject, "grade": g, "message": "Không còn bài mới"},
            media_type="application/json; charset=utf-8",
        )
    return JSONResponse(
        content={
            "unit": unit,
            "subject": subject,
            "grade": g,
            "subject_label": SUBJECT_LABEL.get(subject, subject),
            "subject_emoji": SUBJECT_EMOJI.get(subject, "📚"),
        },
        media_type="application/json; charset=utf-8",
    )


@app.get("/curriculum/history")
async def curriculum_history(grade: Optional[int] = None, limit: int = 50):
    sessions = get_learning_history(grade=grade, limit=limit)
    return JSONResponse(
        content={"sessions": sessions, "count": len(sessions)},
        media_type="application/json; charset=utf-8",
    )


@app.get("/music/songs")
async def music_songs():
    songs = get_songs()
    return JSONResponse(
        content={"songs": songs, "count": len(songs)},
        media_type="application/json; charset=utf-8",
    )


@app.get("/curriculum/weekly-report")
async def curriculum_weekly_report(grade: Optional[int] = None):
    from datetime import datetime, timedelta, timezone
    sessions = get_learning_history(grade=grade, limit=200)
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    week_sessions = []
    for s in sessions:
        try:
            dt = datetime.fromisoformat(s.get("completed_at", "").replace("Z", "+00:00"))
            if dt >= week_ago:
                week_sessions.append(s)
        except (ValueError, TypeError):
            pass

    total = len(week_sessions)
    total_stars = sum(s.get("stars", 0) for s in week_sessions)
    subjects = {}
    for s in week_sessions:
        subj = s.get("subject", "unknown")
        subjects[subj] = subjects.get(subj, 0) + 1

    return JSONResponse(
        content={
            "total_sessions": total,
            "total_stars": total_stars,
            "avg_stars": round(total_stars / total, 1) if total > 0 else 0,
            "subjects": subjects,
            "days_active": len(set(s.get("completed_at", "")[:10] for s in week_sessions)),
        },
        media_type="application/json; charset=utf-8",
    )


@app.post("/curriculum/reset")
async def curriculum_reset(req: ResetRequest):
    if not req.confirm:
        return JSONResponse(
            content={"error": "Set confirm=true to reset progress"},
            status_code=400,
            media_type="application/json; charset=utf-8",
        )
    g = req.grade if req.grade is not None else None
    result = reset_progress(grade=g)
    return JSONResponse(
        content=result,
        media_type="application/json; charset=utf-8",
    )


# ── Avatar endpoints ──────────────────────

@app.get("/curriculum/avatar")
async def curriculum_avatar():
    avatar = get_avatar()
    purchased = get_purchased_avatars()
    return JSONResponse(
        content={**avatar, "purchased": purchased},
        media_type="application/json; charset=utf-8",
    )


class AvatarRequest(BaseModel):
    avatar_id: str
    avatar_name: str
    avatar_emoji: str


@app.post("/curriculum/avatar")
async def curriculum_avatar_set(req: AvatarRequest):
    result = set_avatar(req.avatar_id, req.avatar_name, req.avatar_emoji)
    return JSONResponse(
        content=result,
        media_type="application/json; charset=utf-8",
    )


# ── Lesson Content endpoints ──────────────

@app.get("/curriculum/lesson-content")
async def curriculum_lesson_content(unit_id: str = ""):
    if not unit_id:
        return JSONResponse(
            content={"error": "Missing unit_id parameter"},
            status_code=400,
            media_type="application/json; charset=utf-8",
        )
    content = get_content_by_unit_id(unit_id)
    if content is None:
        return JSONResponse(
            content={"error": f"No content for unit '{unit_id}'", "has_content": False},
            status_code=404,
            media_type="application/json; charset=utf-8",
        )
    pdf = get_pdf_info(unit_id)
    return JSONResponse(
        content={"content": content, "has_content": True, "pdf_info": pdf},
        media_type="application/json; charset=utf-8",
    )


@app.get("/curriculum/content-stats")
async def curriculum_content_stats():
    stats = get_content_stats()
    return JSONResponse(
        content=stats,
        media_type="application/json; charset=utf-8",
    )


_UPLOAD_TOKEN = "VYVY_SGK_2026"


@app.post("/admin/upload-sgk")
async def upload_sgk(
    file: UploadFile = File(...),
    token: str = Query(...),
    grade: int = Query(..., ge=1, le=5),
):
    if token != _UPLOAD_TOKEN:
        raise HTTPException(status_code=403, detail="Forbidden")

    filename = os.path.basename(file.filename or "")
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    dest_dir = os.path.join(PROJECT_ROOT, "backend", "data", "source_sgk", f"grade_{grade}")
    os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, filename)

    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)

    return JSONResponse(
        content={
            "ok": True,
            "grade": grade,
            "filename": filename,
            "bytes": len(content),
            "path": f"backend/data/source_sgk/grade_{grade}/{filename}",
        },
        media_type="application/json; charset=utf-8",
    )


@app.get("/curriculum/pdf/{grade}/{filename}")
async def curriculum_pdf(grade: int, filename: str):
    import urllib.parse
    import unicodedata
    pdf_dir = os.path.join(PROJECT_ROOT, "backend", "data", "source_sgk", f"grade_{grade}")
    decoded = urllib.parse.unquote(filename)
    pdf_path = os.path.join(pdf_dir, decoded)

    if not os.path.isdir(pdf_dir):
        return JSONResponse(
            content={"detail": "PDF directory not found", "grade": grade},
            status_code=404,
            media_type="application/json; charset=utf-8",
        )

    if not os.path.isfile(pdf_path):
        def _normalize(s):
            s = unicodedata.normalize('NFD', s.lower())
            return ''.join(c for c in s if unicodedata.category(c) != 'Mn')

        norm_req = _normalize(decoded)
        for f in os.listdir(pdf_dir):
            if f.lower().endswith('.pdf'):
                if _normalize(f) == norm_req:
                    pdf_path = os.path.join(pdf_dir, f)
                    break
        else:
            best = None
            best_score = 0
            for f in os.listdir(pdf_dir):
                if f.lower().endswith('.pdf'):
                    norm_f = _normalize(f)
                    common = sum(1 for a, b in zip(norm_req, norm_f) if a == b)
                    if common > best_score:
                        best_score = common
                        best = f
            if best and best_score > len(norm_req) * 0.5:
                pdf_path = os.path.join(pdf_dir, best)
            else:
                return JSONResponse(
                    content={"detail": "PDF not found", "requested": decoded},
                    status_code=404,
                    media_type="application/json; charset=utf-8",
                )

    return FileResponse(pdf_path, media_type="application/pdf")


@app.get("/curriculum/lesson-pdf/{lesson_id}")
async def curriculum_lesson_pdf(lesson_id: str):
    cache_dir = os.path.join(PROJECT_ROOT, "backend", "data", "lesson_pdf_cache")
    cache_path = os.path.join(cache_dir, f"{lesson_id}.pdf")

    if os.path.isfile(cache_path):
        return FileResponse(cache_path, media_type="application/pdf")

    lesson_pdf_dir = os.environ.get(
        "LESSON_PDFS_DIR",
        os.path.join(PROJECT_ROOT, "backend", "data", "lesson_pdfs")
    )
    pdf_path = os.path.join(lesson_pdf_dir, f"{lesson_id}.pdf")

    if not os.path.isfile(pdf_path) and os.path.isdir(lesson_pdf_dir):
        for grade_dir in os.listdir(lesson_pdf_dir):
            candidate = os.path.join(lesson_pdf_dir, grade_dir, f"{lesson_id}.pdf")
            if os.path.isfile(candidate):
                pdf_path = candidate
                break

    if os.path.isfile(pdf_path):
        return FileResponse(pdf_path, media_type="application/pdf")

    try:
        match = re.match(r"^KNTT_G(\d+)_.*_L\d+$", lesson_id)
        if not match:
            return JSONResponse(
                content={"error": "Invalid lesson_id", "lesson_id": lesson_id},
                status_code=404,
            )
        grade = int(match.group(1))
        book_id = re.sub(r"_L\d+$", "", lesson_id)

        from backend.curriculum import get_lessons_by_book, get_book_by_id
        book = get_book_by_id(book_id)
        if not book:
            return JSONResponse(
                content={"error": "Book not found", "lesson_id": lesson_id},
                status_code=404,
            )

        lesson = None
        for l in get_lessons_by_book(book_id):
            if l["lesson_id"] == lesson_id:
                lesson = l
                break

        page_start_value = lesson.get("pdf_page_start") or lesson.get("page_start") if lesson else None
        if not lesson or not page_start_value:
            return JSONResponse(
                content={"error": "Lesson page range not found"},
                status_code=404,
            )

        source_file = lesson.get("source_file") or book.get("source_file", "")
        source_path = os.path.join(PROJECT_ROOT, "backend", "data", "source_sgk", f"grade_{grade}", source_file)

        if not os.path.isfile(source_path):
            return JSONResponse(
                content={"error": "Source PDF not found", "source_file": source_file},
                status_code=404,
            )

        page_start = int(page_start_value) - 1
        page_end_value = lesson.get("pdf_page_end") or lesson.get("page_end")
        if not page_end_value:
            page_end_value = int(page_start_value) + 3
        page_end = int(page_end_value) - 1

        import pikepdf
        import tempfile

        def get_used_xobjects(page):
            content = page.get("/Contents")
            if content is None:
                return set()
            if isinstance(content, pikepdf.Array):
                stream_data = b""
                for item in content:
                    stream_data += item.read_bytes()
            else:
                stream_data = content.read_bytes()
            return set(d.decode() for d in re.findall(rb"(/\w+)\s+Do", stream_data))

        src = pikepdf.open(source_path)
        
        page_files = []
        temp_dir = tempfile.mkdtemp()
        
        for p in range(page_start, min(page_end + 1, len(src.pages))):
            single_pdf = pikepdf.Pdf.new()
            single_pdf.pages.append(src.pages[p])
            
            page = single_pdf.pages[0]
            used = get_used_xobjects(page)
            
            if "/Resources" in page and "/XObject" in page["/Resources"]:
                old_xobjects = page["/Resources"]["/XObject"]
                for name in list(old_xobjects.keys()):
                    if str(name) not in used:
                        del old_xobjects[name]
            
            page_file = os.path.join(temp_dir, f"page_{p}.pdf")
            single_pdf.save(page_file)
            page_files.append(page_file)
            single_pdf.close()
        
        src.close()
        
        merged = pikepdf.Pdf.new()
        for pf in page_files:
            page_pdf = pikepdf.open(pf)
            merged.pages.extend(page_pdf.pages)
            page_pdf.close()
        
        os.makedirs(cache_dir, exist_ok=True)
        merged.save(cache_path)
        merged.close()
        
        for pf in page_files:
            os.remove(pf)
        os.rmdir(temp_dir)

        return FileResponse(cache_path, media_type="application/pdf")

    except Exception as e:
        return JSONResponse(
            content={"error": f"Failed to generate lesson PDF: {str(e)}"},
            status_code=500,
        )


@app.get("/curriculum/lesson-audio")
async def curriculum_lesson_audio(unit_id: str = "", voice: str = "female"):
    if not unit_id:
        return JSONResponse(
            content={"error": "Missing unit_id parameter"},
            status_code=400,
            media_type="application/json; charset=utf-8",
        )
    content = get_content_by_unit_id(unit_id)
    if content is None:
        return JSONResponse(
            content={"error": f"No content for unit '{unit_id}'"},
            status_code=404,
            media_type="application/json; charset=utf-8",
        )
    try:
        from backend.tts_service import generate_lesson_audio_bytes
        voice_id = "vi-VN-HoaiMyNeural" if voice != "male" else "vi-VN-NamMinhNeural"
        audio_bytes = await generate_lesson_audio_bytes(content, voice_id)
        from fastapi.responses import Response
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        logger.error("TTS error: %s", e, exc_info=True)
        return JSONResponse(
            content={"error": f"TTS generation failed: {str(e)}"},
            status_code=500,
            media_type="application/json; charset=utf-8",
        )


@app.get("/curriculum/lesson-explanation")
async def curriculum_lesson_explanation(unit_id: str = ""):
    """Returns AI-generated explanation content (lesson_content.json) for the 'Giải thích' feature."""
    if not unit_id:
        return JSONResponse(
            content={"error": "Missing unit_id parameter"},
            status_code=400,
            media_type="application/json; charset=utf-8",
        )
    content = get_explanation_by_unit_id(unit_id)
    if content is None:
        return JSONResponse(
            content={"has_content": False, "unit_id": unit_id},
            status_code=200,
            media_type="application/json; charset=utf-8",
        )
    return JSONResponse(
        content={"has_content": True, "unit_id": unit_id, "content": content},
        media_type="application/json; charset=utf-8",
    )


@app.post("/tts")
async def tts_endpoint(request: Request):
    """Generate TTS audio for arbitrary text (fallback when browser has no Vietnamese voice)."""
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            content={"error": "Invalid JSON body"},
            status_code=400,
            media_type="application/json; charset=utf-8",
        )

    text = (body.get("text") or "").strip()
    if not text:
        return JSONResponse(
            content={"error": "Missing 'text' field"},
            status_code=400,
            media_type="application/json; charset=utf-8",
        )

    if len(text) > 500:
        text = text[:500]

    voice = body.get("voice", "female")
    voice_id = "vi-VN-HoaiMyNeural" if voice != "male" else "vi-VN-NamMinhNeural"

    preset = body.get("preset", "")
    pitch = None
    rate = None
    if preset:
        from backend.tts_service import VOICE_PRESETS
        p = VOICE_PRESETS.get(preset)
        if p:
            pitch = p["pitch"]
            rate = p["rate"]

    try:
        from backend.tts_service import generate_tts
        audio_bytes = await generate_tts(text, voice_id, pitch=pitch, rate=rate)
        from fastapi.responses import Response
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        logger.error("TTS error: %s", e, exc_info=True)
        return JSONResponse(
            content={"error": f"TTS failed: {str(e)}"},
            status_code=500,
            media_type="application/json; charset=utf-8",
        )


# ── Static / web-serving routes ─────────────

def _web_file(filename: str) -> str:
    return os.path.join(WEB_DIR, filename)


@app.get("/")
async def serve_index():
    index_path = _web_file("index.html")
    if not os.path.isfile(index_path):
        return JSONResponse({"detail": "index.html not found"}, status_code=404)
    return FileResponse(index_path, media_type="text/html; charset=utf-8")


_ROOT_ASSETS = [
    "style.css", "script.js", "manifest.json", "sw.js",
    "favicon.ico", "robots.txt", "content.js",
    "theme.css", "decor.js", "vyvy-ui.css",
]

for _asset in _ROOT_ASSETS:
    def _make_route(asset_name: str = _asset):
        async def _serve_asset():
            path = _web_file(asset_name)
            if not os.path.isfile(path):
                return JSONResponse({"detail": f"{asset_name} not found"}, status_code=404)
            return FileResponse(path)
        return _serve_asset

    _route_name = f"serve_{_asset.replace('.', '_')}"
    app.get(f"/{_asset}", name=_route_name)(_make_route())


# Serve icons directory
_icons_dir = os.path.join(WEB_DIR, "icons")
if os.path.isdir(_icons_dir):
    @app.get("/icons/{filename}")
    async def serve_icon(filename: str):
        path = os.path.join(_icons_dir, filename)
        if not os.path.isfile(path):
            return JSONResponse({"detail": "not found"}, status_code=404)
        if filename.endswith(".png"):
            return FileResponse(path, media_type="image/png")
        if filename.endswith(".svg"):
            return FileResponse(path, media_type="image/svg+xml")
        if filename.endswith(".ico"):
            return FileResponse(path, media_type="image/x-icon")
        return FileResponse(path)


_static_dir = os.path.join(WEB_DIR, "static")
if os.path.isdir(_static_dir):
    app.mount("/static", StaticFiles(directory=_static_dir), name="static_files")
