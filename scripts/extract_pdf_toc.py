"""Fill page_start/page_end in lessons.json based on page_count distribution."""
import json
import os
import sys

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "data")
CURRICULUM_DIR = os.path.join(DATA_DIR, "curriculum")
SOURCE_DIR = os.path.join(DATA_DIR, "source_sgk")


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_pdf_page_count(pdf_path):
    """Get total pages from PDF."""
    try:
        from pypdf import PdfReader
    except ImportError:
        from PyPDF2 import PdfReader
    try:
        reader = PdfReader(pdf_path)
        return len(reader.pages)
    except Exception:
        return None


def fill_page_metadata(grade_num):
    """Fill page_start/page_end for a grade's lessons."""
    grade_dir = os.path.join(CURRICULUM_DIR, f"grade_{grade_num}")
    lessons_path = os.path.join(grade_dir, "lessons.json")
    books_path = os.path.join(grade_dir, "books.json")

    if not os.path.isfile(lessons_path):
        print(f"  [SKIP] Grade {grade_num}: no lessons.json")
        return 0

    lessons = load_json(lessons_path)
    books = {b["book_id"]: b for b in load_json(books_path)}

    # Group lessons by book
    by_book = {}
    for lesson in lessons:
        bid = lesson.get("book_id")
        if bid not in by_book:
            by_book[bid] = []
        by_book[bid].append(lesson)

    updated_count = 0

    for book_id, book_lessons in by_book.items():
        book = books.get(book_id, {})
        source_file = book.get("source_file")
        if not source_file:
            print(f"  [SKIP] {book_id}: no source_file")
            continue

        pdf_path = os.path.join(SOURCE_DIR, f"grade_{grade_num}", source_file)
        if not os.path.isfile(pdf_path):
            print(f"  [MISS] {source_file} not found")
            continue

        # Get page count from book metadata or from PDF
        page_count = book.get("page_count")
        if not page_count:
            page_count = get_pdf_page_count(pdf_path)
            if page_count:
                book["page_count"] = page_count
                print(f"  [INFO] {book_id}: detected {page_count} pages from PDF")

        if not page_count:
            print(f"  [SKIP] {book_id}: no page_count")
            continue

        # Check if lessons already have page_start
        has_pages = sum(1 for l in book_lessons if l.get("page_start"))
        if has_pages == len(book_lessons):
            print(f"  [OK] {book_id}: all {has_pages} lessons already have page_start")
            continue

        # Sort lessons by lesson_no
        sorted_lessons = sorted(
            book_lessons,
            key=lambda l: int(l.get("lesson_no", 0)) if isinstance(l.get("lesson_no"), str) else l.get("lesson_no", 0)
        )

        # Skip first few pages (cover, TOC, etc.)
        start_offset = min(6, page_count // 10)
        usable_pages = page_count - start_offset

        # Calculate pages per lesson
        num_lessons = len(sorted_lessons)
        if num_lessons == 0:
            continue

        pages_per_lesson = usable_pages / num_lessons

        print(f"  [BOOK] {book_id}: {num_lessons} lessons, {page_count} pages, ~{pages_per_lesson:.1f} pages/lesson")

        for i, lesson in enumerate(sorted_lessons):
            if not lesson.get("page_start"):
                page_start = int(start_offset + i * pages_per_lesson) + 1
                page_end = int(start_offset + (i + 1) * pages_per_lesson)

                # Ensure page_end doesn't exceed page_count
                page_end = min(page_end, page_count)

                # Ensure at least 1 page
                if page_end < page_start:
                    page_end = page_start

                lesson["page_start"] = page_start
                lesson["page_end"] = page_end
                lesson["page_source"] = "estimated"
                updated_count += 1
                print(f"    [EST] {lesson['lesson_id']}: pages {page_start}-{page_end}")
            elif not lesson.get("page_end"):
                # Has page_start but no page_end - compute from next lesson
                if i + 1 < len(sorted_lessons) and sorted_lessons[i + 1].get("page_start"):
                    lesson["page_end"] = sorted_lessons[i + 1]["page_start"] - 1
                else:
                    lesson["page_end"] = min(lesson["page_start"] + 3, page_count)
                lesson["page_source"] = lesson.get("page_source", "toc")
                updated_count += 1

    # Save updated lessons
    save_json(lessons_path, lessons)
    print(f"  [SAVED] {lessons_path} ({updated_count} pages updated)")
    return updated_count


def main():
    grades = [int(g) for g in sys.argv[1:]] if len(sys.argv) > 1 else [1, 2, 3, 4, 5]

    total = 0
    for g in grades:
        print(f"\n=== Grade {g} ===")
        count = fill_page_metadata(g)
        total += count
        print(f"  Grade {g}: {count} pages updated")

    print(f"\nTotal: {total} pages updated across {len(grades)} grades")


if __name__ == "__main__":
    main()
