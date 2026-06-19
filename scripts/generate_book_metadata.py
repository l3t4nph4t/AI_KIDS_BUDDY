"""Generate book-level metadata for Grades 1, 3, 4, 5 from PDF filenames."""

import json
import os
import re

SUBJECT_MAP = {
    "TOAN": ("toan", "Toan"),
    "TIENG VIET": ("tieng_viet", "Tieng Viet"),
    "TIENG ANH": ("tieng_anh", "Tieng Anh"),
    "TU NHIEN VA XA HOI": ("tu_nhien_xa_hoi", "Tu nhien va Xa hoi"),
    "KHOA HOC": ("khoa_hoc", "Khoa hoc"),
    "LICH SU VA DIA LI": ("lich_su_dia_li", "Lich su va Dia li"),
    "TIN HOC": ("tin_hoc", "Tin hoc"),
    "CONG NGHE": ("cong_nghe", "Cong nghe"),
    "AM NHAC": ("am_nhac", "Am nhac"),
    "MI THUAT": ("mi_thuat", "Mi thuat"),
    "GIAO DUC THE CHAT": ("giao_duc_the_chat", "Giao duc the chat"),
    "HOAT DONG TRAI NGHIEM": ("hoat_dong_trai_nghiem", "Hoat dong trai nghiem"),
    "DAO DUC": ("dao_duc", "Dao duc"),
}

SUBJECT_ID_MAP = {
    "toan": "math",
    "tieng_viet": "vietnamese",
    "tieng_anh": "english",
    "tu_nhien_xa_hoi": "tnxh",
    "khoa_hoc": "science",
    "lich_su_dia_li": "history_geo",
    "tin_hoc": "informatics",
    "cong_nghe": "technology",
    "am_nhac": "music",
    "mi_thuat": "art",
    "giao_duc_the_chat": "pe",
    "hoat_dong_trai_nghiem": "experiential",
    "dao_duc": "ethics",
}

DISPLAY_MAP = {
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


def remove_diacritics(text):
    """Remove Vietnamese diacritics for matching."""
    mapping = {
        "á": "a", "à": "a", "ả": "a", "ã": "a", "ạ": "a",
        "ă": "a", "ắ": "a", "ằ": "a", "ẳ": "a", "ẵ": "a", "ặ": "a",
        "â": "a", "ấ": "a", "ầ": "a", "ẩ": "a", "ẫ": "a", "ậ": "a",
        "đ": "d",
        "é": "e", "è": "e", "ẻ": "e", "ẽ": "e", "ẹ": "e",
        "ê": "e", "ế": "e", "ề": "e", "ể": "e", "ễ": "e", "ệ": "e",
        "í": "i", "ì": "i", "ỉ": "i", "ĩ": "i", "ị": "i",
        "ó": "o", "ò": "o", "ỏ": "o", "õ": "o", "ọ": "o",
        "ô": "o", "ố": "o", "ồ": "o", "ổ": "o", "ỗ": "o", "ộ": "o",
        "ơ": "o", "ớ": "o", "ờ": "o", "ở": "o", "ỡ": "o", "ợ": "o",
        "ú": "u", "ù": "u", "ủ": "u", "ũ": "u", "ụ": "u",
        "ư": "u", "ứ": "u", "ừ": "u", "ử": "u", "ữ": "u", "ự": "u",
        "ý": "y", "ỳ": "y", "ỷ": "y", "ỹ": "y", "ỵ": "y",
    }
    result = text.lower()
    for vn, en in mapping.items():
        result = result.replace(vn, en)
    return result.upper()


def parse_pdf_filename(filename):
    fname = filename.replace(".pdf", "").replace(".PDF", "")
    fname_norm = remove_diacritics(fname)
    grade_match = re.search(r"LOP\s+(\d)", fname_norm)
    grade = int(grade_match.group(1)) if grade_match else None
    term_match = re.search(r"TAP\s+(\d)", fname_norm)
    term = int(term_match.group(1)) if term_match else None
    subject_code = None
    for vn_key, (code, label) in SUBJECT_MAP.items():
        if vn_key in fname_norm:
            subject_code = code
            break
    return {"grade": grade, "subject": subject_code, "term": term}


def generate_book_id(grade, subject, term):
    subj_id = SUBJECT_ID_MAP.get(subject, subject)
    if term:
        return f"g{grade}_{subj_id}_t{term}"
    return f"g{grade}_{subj_id}"


def main():
    grades_to_process = [1, 3, 4, 5]
    for grade in grades_to_process:
        grade_dir = f"backend/data/source_sgk/grade_{grade}"
        if not os.path.isdir(grade_dir):
            print(f"Grade {grade}: no source dir")
            continue
        pdfs = [f for f in os.listdir(grade_dir) if f.lower().endswith(".pdf")]
        books = []
        for pdf in sorted(pdfs):
            info = parse_pdf_filename(pdf)
            if not info["grade"] or not info["subject"]:
                print(f"  SKIP (unparsed): {pdf}")
                continue
            book_id = generate_book_id(info["grade"], info["subject"], info["term"])
            subj_name = DISPLAY_MAP.get(info["subject"], info["subject"])
            title = f"SGK {subj_name} {info['grade']}"
            if info["term"]:
                title += f" - Tập {info['term']}"
            book = {
                "book_id": book_id,
                "title": title,
                "subject": info["subject"],
                "subject_name": subj_name,
                "grade": info["grade"],
                "series": "Kết nối tri thức với cuộc sống",
                "term": info["term"],
                "source_file": pdf,
                "source_type": "metadata_only",
                "parse_status": "BOOKS_ONLY",
                "page_count": None,
                "rights_note": "Index/metadata only. Do not store full copyrighted content unless licensed.",
            }
            books.append(book)
        out_dir = f"backend/data/curriculum/grade_{grade}"
        os.makedirs(out_dir, exist_ok=True)
        with open(os.path.join(out_dir, "books.json"), "w", encoding="utf-8") as f:
            json.dump(books, f, ensure_ascii=False, indent=2)
        with open(os.path.join(out_dir, "lessons.json"), "w", encoding="utf-8") as f:
            json.dump([], f)
        with open(os.path.join(out_dir, "daily_learning_units.json"), "w", encoding="utf-8") as f:
            json.dump([], f)
        print(f"Grade {grade}: {len(books)} books created")
        for b in books:
            print(f"  {b['book_id']}: {b['title']}")


if __name__ == "__main__":
    main()
