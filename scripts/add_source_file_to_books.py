"""Add source_file field to books.json for all grades, matching PDF files in source_sgk/."""
import json
import os
import sys
import unicodedata
import re

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
CURRICULUM_DIR = os.path.join(PROJECT_ROOT, "backend", "data", "curriculum")
SGK_DIR = os.path.join(PROJECT_ROOT, "backend", "data", "source_sgk")

SUBJECT_TO_VIETNAMESE = {
    "toan": "Toán",
    "tieng_viet": "Tiếng Việt",
    "tieng_anh": "Tiếng Anh",
    "tu_nhien_xa_hoi": "Tự nhiên và Xã hội",
    "khoa_hoc": "Khoa học",
    "lich_su_dia_li": "Lịch sử và Địa lí",
    "tin_hoc": "Tin học",
    "cong_nghe": "Công nghệ",
    "am_nhac": "Âm nhạc",
    "mi_thuat": "Mĩ thuật",
    "giao_duc_the_chat": "Giáo dục thể chất",
    "hoat_dong_trai_nghiem": "Hoạt động trải nghiệm",
    "dao_duc": "Đạo đức",
}


def strip_accents(s: str) -> str:
    """Remove diacritics from Vietnamese text."""
    nfkd = unicodedata.normalize("NFKD", s)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def normalize(s: str) -> str:
    """Normalize for matching: strip accents, lowercase, collapse spaces."""
    return re.sub(r"\s+", " ", strip_accents(s).lower()).strip()


def find_pdf_for_book(book: dict, pdf_files: list[str]) -> str | None:
    """Find the best matching PDF filename for a book."""
    subject_vi = SUBJECT_TO_VIETNAMESE.get(book.get("subject", ""), "")
    grade = book.get("grade", 0)
    term = book.get("term")

    # Build expected pattern parts
    subject_norm = normalize(subject_vi)
    grade_str = f"lop {grade}"

    candidates = []
    for pdf in pdf_files:
        pdf_norm = normalize(pdf)
        # Must match grade
        if grade_str not in pdf_norm:
            continue
        # Must match subject
        if subject_norm not in pdf_norm:
            continue

        # Score: prefer term match
        score = 10
        if term == 1 and "tap 1" in pdf_norm:
            score += 5
        elif term == 2 and "tap 2" in pdf_norm:
            score += 5
        elif term is None and "tap" not in pdf_norm:
            score += 5

        candidates.append((score, pdf))

    if not candidates:
        return None

    candidates.sort(key=lambda x: -x[0])
    return candidates[0][1]


def process_grade(grade_num: int):
    books_path = os.path.join(CURRICULUM_DIR, f"grade_{grade_num}", "books.json")
    sgk_dir = os.path.join(SGK_DIR, f"grade_{grade_num}")

    if not os.path.isfile(books_path):
        print(f"Grade {grade_num}: no books.json")
        return

    if not os.path.isdir(sgk_dir):
        print(f"Grade {grade_num}: no source_sgk/grade_{grade_num}/")
        return

    books = json.load(open(books_path, encoding="utf-8"))
    pdf_files = os.listdir(sgk_dir)
    pdf_files = [f for f in pdf_files if f.lower().endswith(".pdf")]

    updated = 0
    for book in books:
        if book.get("source_file"):
            continue
        matched = find_pdf_for_book(book, pdf_files)
        if matched:
            book["source_file"] = matched
            updated += 1
            print(f"  {book['book_id']} -> {matched}")
        else:
            print(f"  {book['book_id']} -> NO MATCH")

    if updated > 0:
        with open(books_path, "w", encoding="utf-8") as f:
            json.dump(books, f, ensure_ascii=False, indent=2)
        print(f"Grade {grade_num}: updated {updated} books")
    else:
        print(f"Grade {grade_num}: no updates needed")


if __name__ == "__main__":
    for g in [1, 2, 3, 4, 5]:
        print(f"\n--- Grade {g} ---")
        process_grade(g)
