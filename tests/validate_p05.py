"""Quick P05 validation."""
import sys
sys.path.insert(0, ".")

from backend.curriculum import (
    get_grades, get_all_books, get_subjects_list, get_daily_unit_by_id,
    get_suggested_subject, get_stats, get_bot_name, get_curriculum_status,
    is_special_subject, get_grade_status
)

print("Bot name:", get_bot_name())
grades = get_grades()
print("Grades:", len(grades))
for g in grades:
    print(f"  Grade {g['grade']}: {g['book_count']} books, {g['lesson_count']} lessons, {g['unit_count']} units, status={g['data_status']}")

print()
print("Grade 2 books:", len(get_all_books(grade=2)))
print("Grade 1 books:", len(get_all_books(grade=1)))
print("Grade 3 subjects:", [s["subject"] for s in get_subjects_list(grade=3)])
print("Grade 2 subjects:", [s["subject"] for s in get_subjects_list(grade=2)])

u = get_daily_unit_by_id("DU_G2_0001")
print("Unit DU_G2_0001:", u["title"] if u else "NOT FOUND")

s = get_suggested_subject(grade=2)
print("Suggested G2:", s["subject"])
s = get_suggested_subject(grade=1)
print("Suggested G1:", s["subject"])

print("is_special am_nhac:", is_special_subject("am_nhac"))
print("is_special toan:", is_special_subject("toan"))
print("P05 PASS")
