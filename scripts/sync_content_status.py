"""
Sync content_status in daily_learning_units.json.
Sets content_status='ready' for units that have content in lesson_content.json.
Usage: python scripts/sync_content_status.py
"""
import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
CURRICULUM_DIR = os.path.join(PROJECT_ROOT, "backend", "data", "curriculum")


def load_json(path):
    if not os.path.isfile(path):
        return []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


total_updated = 0
total_already = 0
total_missing = 0

for grade in range(1, 6):
    grade_dir = os.path.join(CURRICULUM_DIR, f"grade_{grade}")
    units_path = os.path.join(grade_dir, "daily_learning_units.json")
    content_path = os.path.join(grade_dir, "lesson_content.json")

    if not os.path.isfile(units_path):
        continue

    units = load_json(units_path)
    content_items = load_json(content_path)
    content_ids = {item["daily_unit_id"] for item in content_items}

    updated = 0
    already_ready = 0
    missing = 0

    for unit in units:
        uid = unit["daily_unit_id"]
        if uid in content_ids:
            if unit.get("content_status") != "ready":
                unit["content_status"] = "ready"
                updated += 1
            else:
                already_ready += 1
        else:
            missing += 1

    if updated > 0:
        save_json(units_path, units)

    print(f"Grade {grade}: {updated} updated->ready, {already_ready} already ready, {missing} still missing content")
    total_updated += updated
    total_already += already_ready
    total_missing += missing

print(f"\nDone. Total: {total_updated} updated, {total_already} already ready, {total_missing} no content")
