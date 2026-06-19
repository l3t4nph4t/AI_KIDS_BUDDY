"""Full backtest for multi-grade curriculum."""
import sys
sys.path.insert(0, ".")

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)
results = []

def check(name, condition, detail=""):
    status = "PASS" if condition else "FAIL"
    results.append((name, status, detail))
    print(f"[{status}] {name}" + (f" -- {detail}" if detail else ""))

# Health
r = client.get("/health")
check("HEALTH", r.status_code == 200 and r.json()["status"] == "ok")

# Chat
r = client.post("/chat", json={"text": "Xin chao", "child_age": 8})
check("CHAT", r.status_code == 200 and "reply" in r.json())

# Grades
r = client.get("/curriculum/grades")
check("GRADES", len(r.json()["grades"]) == 5)

# Status
r = client.get("/curriculum/status")
data = r.json()
check("STATUS", data["grades_available"] == 5 and data["total_books"] == 45)

# Subjects per grade
for g in [1, 2, 3, 4, 5]:
    r = client.get(f"/curriculum/subjects?grade={g}")
    check(f"SUBJECTS_G{g}", r.status_code == 200 and len(r.json()["subjects"]) > 0)

# Books per grade
for g in [1, 2, 3, 4, 5]:
    r = client.get(f"/curriculum/books?grade={g}")
    count = r.json()["count"]
    check(f"BOOKS_G{g}", count > 0, f"count={count}")

# Grade 2 regression
r = client.get("/curriculum/books?grade=2")
check("G2_BOOKS", r.json()["count"] == 8)
r = client.get("/curriculum/lessons?grade=2&subject=toan")
check("G2_LESSONS", r.json()["count"] > 0)

# Daily unit
r = client.get("/curriculum/daily-unit?grade=2&subject=toan")
check("DAILY_UNIT_G2", r.status_code == 200)

r = client.get("/curriculum/daily-unit?grade=1&subject=toan")
check("DAILY_UNIT_G1", r.status_code == 200 or r.status_code == 404)

# Session start G2
r = client.post("/curriculum/session/start", json={"subject": "toan", "grade": 2, "child_age": 8})
check("SESSION_G2", r.status_code == 200 and r.json().get("current_step") == "warmup")

# Full flow G2
session = r.json()["session"]
items = session["steps"]["practice"]["items"]

# warmup
r = client.post("/curriculum/session/respond", json={
    "session_data": session, "step": "warmup", "user_answer": "Ok", "child_age": 8
})
resp = r.json()
check("FLOW_WARMUP", resp["next_step"] == "practice")

# practice
total_stars = 0
for i in range(len(items)):
    ans = str(items[i]["expected_answer"])
    r = client.post("/curriculum/session/respond", json={
        "session_data": session, "step": "practice", "user_answer": ans, "item_index": i, "child_age": 8
    })
    resp = r.json()
    ev = resp.get("evaluation", {})
    total_stars += ev.get("stars", 0)
check("FLOW_PRACTICE", resp["next_step"] == "check")

# check
check_ans = str(session["steps"]["check"]["expected_answer"])
r = client.post("/curriculum/session/respond", json={
    "session_data": session, "step": "check", "user_answer": check_ans, "child_age": 8
})
resp = r.json()
check("FLOW_CHECK", resp["next_step"] == "feedback")

# feedback
r = client.post("/curriculum/session/respond", json={
    "session_data": session, "step": "feedback", "user_answer": "", "child_age": 8
})
resp = r.json()
check("FLOW_DONE", resp["next_step"] == "done")

# Complete
r = client.post("/curriculum/complete", json={"unit_id": session["unit_id"], "subject": "toan", "grade": 2, "score": 80, "stars": 3})
check("COMPLETE", r.json()["status"] == "completed")

# Progress
r = client.get("/curriculum/progress?grade=2")
check("PROGRESS_G2", session["unit_id"] in r.json()["completed_units"])

# Active grade
r = client.post("/curriculum/active-grade", json={"grade": 3})
check("ACTIVE_GRADE", r.json()["active_grade"] == 3)
r = client.post("/curriculum/active-grade", json={"grade": 2})
check("ACTIVE_GRADE_RESET", r.json()["active_grade"] == 2)

# Reset
r = client.post("/curriculum/reset", json={"confirm": True, "grade": 2})
check("RESET_G2", r.json()["status"] == "reset")

r = client.post("/curriculum/reset", json={"confirm": False})
check("RESET_NO_CONFIRM", r.status_code == 400)

# UTF-8
r = client.get("/curriculum/books?grade=2")
for book in r.json()["books"]:
    assert "Toán" in book["title"] or "Tiếng" in book["title"] or "Âm" in book["title"] or "Mĩ" in book["title"] or "Hoạt" in book["title"] or "Giáo" in book["title"]
check("UTF8_API", True)

# Wrong answer
r = client.post("/curriculum/session/start", json={"subject": "toan", "grade": 2, "child_age": 8})
s = r.json()["session"]
r = client.post("/curriculum/session/respond", json={
    "session_data": s, "step": "practice", "user_answer": "WRONG", "item_index": 0, "child_age": 8
})
check("WRONG_ANSWER", r.json()["evaluation"]["correct"] is False)

# Summary
print()
passed = sum(1 for _, s, _ in results if s == "PASS")
failed = sum(1 for _, s, _ in results if s == "FAIL")
print(f"TOTAL: {len(results)} | PASS: {passed} | FAIL: {failed}")
if failed:
    for n, s, d in results:
        if s == "FAIL":
            print(f"  FAIL: {n}: {d}")
else:
    print("ALL TESTS PASSED")
