"""Split SGK PDFs into per-lesson PDF files based on lessons.json page ranges."""
import json
import os
import sys

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "data")
CURRICULUM_DIR = os.path.join(DATA_DIR, "curriculum")
SOURCE_DIR = os.path.join(DATA_DIR, "source_sgk")
OUTPUT_DIR = os.path.join(DATA_DIR, "lesson_pdfs")


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def split_grade(grade_num, force=False):
    grade_dir = os.path.join(CURRICULUM_DIR, f"grade_{grade_num}")
    lessons_path = os.path.join(grade_dir, "lessons.json")
    books_path = os.path.join(grade_dir, "books.json")

    if not os.path.isfile(lessons_path):
        print(f"  [SKIP] Grade {grade_num}: no lessons.json")
        return 0

    lessons = load_json(lessons_path)
    books = {b["book_id"]: b for b in load_json(books_path)}

    by_book = {}
    for lesson in lessons:
        bid = lesson.get("book_id")
        if bid not in by_book:
            by_book[bid] = []
        by_book[bid].append(lesson)

    ok = 0
    fail = 0

    for book_id, book_lessons in by_book.items():
        book = books.get(book_id, {})
        source_file = book.get("source_file")
        if not source_file:
            print(f"  [SKIP] {book_id}: no source_file")
            continue

        pdf_path = os.path.join(SOURCE_DIR, f"grade_{grade_num}", source_file)
        if not os.path.isfile(pdf_path):
            print(f"  [MISS] {source_file} not found")
            fail += 1
            continue

        try:
            import pikepdf
            src = pikepdf.open(pdf_path)
            total_pages = len(src.pages)
        except Exception as e:
            print(f"  [ERR] Cannot read {source_file}: {e}")
            fail += 1
            continue

        book_lessons_sorted = sorted(
            [l for l in book_lessons if l.get("page_start")],
            key=lambda l: l["page_start"]
        )

        for i, lesson in enumerate(book_lessons_sorted):
            lesson_id = lesson["lesson_id"]
            page_start = lesson["page_start"] - 1  # 0-indexed

            if i + 1 < len(book_lessons_sorted) and book_lessons_sorted[i+1].get("page_start"):
                page_end = book_lessons_sorted[i+1]["page_start"] - 2
            elif lesson.get("page_end"):
                page_end = lesson["page_end"] - 1
            else:
                page_end = min(page_start + 3, total_pages - 1)

            page_end = min(page_end, total_pages - 1)

            if page_start > total_pages - 1:
                continue

            out_dir = os.path.join(OUTPUT_DIR, f"grade_{grade_num}")
            os.makedirs(out_dir, exist_ok=True)
            out_path = os.path.join(out_dir, f"{lesson_id}.pdf")

            if os.path.isfile(out_path) and not force:
                ok += 1
                continue

            try:
                dst = pikepdf.Pdf.new()
                dst.pages.extend([src.pages[p] for p in range(page_start, page_end + 1)])
                dst.save(out_path)
                dst.close()
                size_kb = os.path.getsize(out_path) / 1024
                ok += 1
                print(f"  [OK] {lesson_id}: pages {page_start+1}-{page_end+1} ({size_kb:.0f} KB)")
            except Exception as e:
                print(f"  [ERR] {lesson_id}: {e}")
                fail += 1

        src.close()

    return ok, fail


if __name__ == "__main__":
    force = "--force" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    grades = [int(g) for g in args] if args else [1, 2, 3, 4, 5]

    try:
        import pikepdf
        print("Using pikepdf")
    except ImportError:
        print("ERROR: Install pikepdf first: pip install pikepdf")
        sys.exit(1)

    total_ok = 0
    total_fail = 0
    for g in grades:
        print(f"--- Grade {g} ---")
        result = split_grade(g, force=force)
        if result:
            ok, fail = result
            total_ok += ok
            total_fail += fail
            print(f"  Grade {g}: {ok} ok, {fail} fail")

    total_size = 0
    for root, dirs, files in os.walk(OUTPUT_DIR):
        for f in files:
            total_size += os.path.getsize(os.path.join(root, f))

    print(f"\nDone: {total_ok} ok, {total_fail} fail")
    print(f"Output dir: {OUTPUT_DIR}")
    print(f"Total size: {total_size / 1024 / 1024:.1f} MB")
