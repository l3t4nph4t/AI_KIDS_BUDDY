"""
Import full curriculum data (lessons + daily_learning_units) for Grades 1, 3, 4, 5.
Matches the structure and quality of the Grade 2 seed data.
Uses the KNTT (Kết nối tri thức với cuộc sống) textbook series curriculum.

Usage: python scripts/import_curriculum_g1345.py
"""

import json
import os

SERIES = "Kết nối tri thức với cuộc sống"
CONFIDENCE = "toc_seed_from_visual"
RIGHTS = "Index/metadata only. Do not store full copyrighted page text unless licensed/approved."

# ── Grade 1 Curriculum ──────────────────────────────────────────────
GRADE_1 = {
    "KNTT_G1_MATH_T1": {
        "title": "SGK Toán 1 - Tập 1", "subject": "toan", "term": 1,
        "units": [
            ("Chương 1. Số đếm từ 1 đến 5", [
                "Số 1, số 2", "Số 3, số 4, số 5", "So sánh 1, 2, 3, 4, 5",
                "Phép cộng trong phạm vi 5", "Phép trừ trong phạm vi 5",
            ]),
            ("Chương 2. Số đếm từ 6 đến 10", [
                "Số 6", "Số 7", "Số 8", "Số 9", "Số 10",
                "So sánh các số trong phạm vi 10", "Phép cộng trong phạm vi 10",
                "Phép trừ trong phạm vi 10", "Luyện tập chung",
            ]),
            ("Chương 3. Hình vuông, hình tròn, hình tam giác", [
                "Hình vuông", "Hình tròn", "Hình tam giác", "Thực hành vẽ hình",
            ]),
        ]
    },
    "KNTT_G1_MATH_T2": {
        "title": "SGK Toán 1 - Tập 2", "subject": "toan", "term": 2,
        "units": [
            ("Chương 4. Phép cộng, phép trừ trong phạm vi 10", [
                "Bảng cộng trong phạm vi 10", "Bảng trừ trong phạm vi 10",
                "Luyện tập cộng trừ trong phạm vi 10",
            ]),
            ("Chương 5. Số đếm từ 11 đến 20", [
                "Nhóm 10 và vài đơn vị", "Số 11 đến 15", "Số 16 đến 20",
                "So sánh các số trong phạm vi 20",
            ]),
            ("Chương 6. Phép cộng, phép trừ trong phạm vi 20", [
                "Phép cộng trong phạm vi 20", "Phép trừ trong phạm vi 20",
                "Cộng trừ trong phạm vi 20", "Luyện tập chung",
            ]),
            ("Chương 7. Đo độ dài", [
                "Làm quen với độ dài", "Xăng-ti-mét", "Đo và vẽ đoạn thẳng",
            ]),
            ("Chương 8. Bảng số", [
                "Bảng cộng", "Bảng trừ", "Ôn tập cuối năm",
            ]),
        ]
    },
    "KNTT_G1_VIETNAMESE_T1": {
        "title": "SGK Tiếng Việt 1 - Tập 1", "subject": "tieng_viet", "term": 1,
        "units": [
            ("Chương 1. Làm quen với chữ cái", [
                "Các nguyên âm: a, ă, â", "Các phụ âm: b, c, d",
                "Phần đọc: Vần a, ă, â", "Phần viết: Tập viết chữ a, ă, â",
                "Các nguyên âm: e, ê, i, y", "Các phụ âm: đ, g, h",
                "Phần đọc: Vần e, ê, i", "Phần viết: Tập viết chữ e, ê, i",
            ]),
            ("Chương 2. Các chữ cái tiếp theo", [
                "Nguyên âm: o, ô, ơ", "Phụ âm: k, l, m, n",
                "Phần đọc: Vần o, ô, ơ", "Phần viết: Tập viết chữ o, ô, ơ",
                "Nguyên âm: u, ư", "Phụ âm: p, q, r, s, t",
                "Phần đọc: Vần u, ư", "Phần viết: Tập viết chữ u, ư",
            ]),
            ("Chương 3. Tập đọc - Tập viết", [
                "Các phụ âm: v, x", "Phần đọc: Câu ngắn",
                "Phần viết: Tập viết câu", "Luyện tập tổng hợp",
            ]),
        ]
    },
    "KNTT_G1_VIETNAMESE_T2": {
        "title": "SGK Tiếng Việt 1 - Tập 2", "subject": "tieng_viet", "term": 2,
        "units": [
            ("Chương 4. Đọc truyện", [
                "Truyện: Con gà trống", "Truyện: Bạn thỏ",
                "Truyện: Mẹ hiền", "Truyện: Ông mặt trời",
            ]),
            ("Chương 5. Tập đọc - Tập viết", [
                "Đọc vần: an, ăn, ân", "Đọc vần: ang,ăng, âng",
                "Đọc vần: ac, ăc, âc", "Tập viết từ và câu",
                "Đọc vần: on, ôn, ơn", "Đọc vần: ong, ông",
            ]),
            ("Chương 6. Luyện tập tổng hợp", [
                "Đọc thuộc thơ", "Kể chuyện", "Tập viết đoạn ngắn",
                "Ôn tập cuối năm",
            ]),
        ]
    },
    "KNTT_G1_TNXH": {
        "title": "SGK Tự nhiên và Xã hội 1", "subject": "tu_nhien_xa_hoi", "term": None,
        "units": [
            ("Chủ đề 1. Trường học của em", [
                "Trường học", "Lớp học", "Thầy cô và bạn bè",
                "Em đến trường",
            ]),
            ("Chủ đề 2. Gia đình của em", [
                "Gia đình em", "Ông bà", "Bố mẹ", "Anh chị em",
            ]),
            ("Chủ đề 3. Bản thân em", [
                "Cơ thể em", "Giữ gìn vệ sinh", "Em lớn rồi",
            ]),
            ("Chủ đề 4. Cộng đồng quanh em", [
                "Hàng xóm", "Làng quê em", "Thành phố em",
            ]),
            ("Chủ đề 5. Trái đất - Ngôi nhà chung", [
                "Mùa xuân", "Mùa hạ", "Mùa thu", "Mùa đông",
                "Ôn tập cuối năm",
            ]),
        ]
    },
    "KNTT_G1_MUSIC": {
        "title": "SGK Âm nhạc 1", "subject": "am_nhac", "term": None,
        "units": [
            ("Chủ đề 1. Em yêu trường", [
                "Hát: Em đến trường", "Hát: Trường em",
                "Nhịp phách", "Luyện tập",
            ]),
            ("Chủ đề 2. Em yêu gia đình", [
                "Hát: Mẹ hiền", "Hát: Bố là tất cả",
                "Nghe nhạc: Điệu valse", "Luyện tập",
            ]),
            ("Chủ đề 3. Em yêu quê hương", [
                "Hát: Quê hương em", "Hát: Làng quê",
                "Nhịp 2/4", "Luyện tập",
            ]),
            ("Chủ đề 4. Em yêu thiên nhiên", [
                "Hát: Mùa xuân", "Hát: Ông mặt trời",
                "Nghe nhạc: Điệu polka", "Ôn tập cuối năm",
            ]),
        ]
    },
    "KNTT_G1_PE": {
        "title": "SGK Giáo dục thể chất 1", "subject": "giao_duc_the_chat", "term": None,
        "units": [
            ("Phần 1. Kiến thức chung", [
                "Vệ sinh cá nhân", "An toàn trong tập luyện",
            ]),
            ("Phần 2. Đội hình đội ngũ", [
                "Xếp hàng dọc, hàng ngang", "Đứng thành vòng tròn",
                "Quay phải, quay trái", "Đi đều bước",
            ]),
            ("Phần 3. Bài tập thể dục", [
                "Vươn thở", "Tay ngang, tay trước", "Xoay người",
                "Bài thể dục toàn thân",
            ]),
            ("Phần 4. Vận động cơ bản", [
                "Chạy", "Nhảy", "Ném bóng", "Luyện tập tổng hợp",
            ]),
        ]
    },
    "KNTT_G1_EXPERIENTIAL": {
        "title": "SGK Hoạt động trải nghiệm 1", "subject": "hoat_dong_trai_nghiem", "term": None,
        "units": [
            ("Chủ đề 1. Em đến trường", [
                "Làm quen với trường", "Làm quen với lớp",
                "Quy tắc lớp học", "Em yêu trường em",
            ]),
            ("Chủ đề 2. Em và bạn bè", [
                "Làm quen bạn mới", "Chơi cùng bạn", "Chia sẻ với bạn",
            ]),
            ("Chủ đề 3. Em và gia đình", [
                "Em giúp mẹ", "Em giúp bố", "Cả nhà cùng vui",
            ]),
            ("Chủ đề 4. Em với cộng đồng", [
                "Hàng xóm láng giềng", "Em bảo vệ môi trường",
                "Ôn tập cuối năm",
            ]),
        ]
    },
}

# ── Grade 3 Curriculum ──────────────────────────────────────────────
GRADE_3 = {
    "KNTT_G3_MATH_T1": {
        "title": "SGK Toán 3 - Tập 1", "subject": "toan", "term": 1,
        "units": [
            ("Chương 1. Ôn tập và bổ sung", [
                "Ôn tập số tự nhiên", "Phép cộng, phép trừ trong phạm vi 1000",
                "Phép nhân, phép chia trong phạm vi 100", "Luyện tập chung",
            ]),
            ("Chương 2. Phép nhân trong phạm vi 1000", [
                "Bảng nhân (tiếp theo)", "Phép nhân với số có một chữ số",
                "Phép nhân với số có hai chữ số", "Luyện tập chung",
            ]),
            ("Chương 3. Phép chia trong phạm vi 1000", [
                "Bảng chia (tiếp theo)", "Phép chia với số có một chữ số",
                "Phép chia có dư", "Luyện tập chung",
            ]),
            ("Chương 4. Các số đến 10000", [
                "Đếm, đọc, viết số đến 10000", "So sánh số tự nhiên",
                "Làm tròn số", "Phép cộng trừ trong phạm vi 10000",
            ]),
        ]
    },
    "KNTT_G3_MATH_T2": {
        "title": "SGK Toán 3 - Tập 2", "subject": "toan", "term": 2,
        "units": [
            ("Chương 5. Phép nhân, phép chia với số nhiều chữ số", [
                "Phép nhân với số có 2 chữ số", "Phép chia với số có 2 chữ số",
                "Luyện tập chung",
            ]),
            ("Chương 6. Đo lường", [
                "Độ dài: ki-lô-mét", "Khối lượng: tạ, tấn",
                "Thời gian: phút, giờ", "Luyện tập chung",
            ]),
            ("Chương 7. Hình học", [
                "Đường thẳng, đoạn thẳng", "Góc", "Hình chữ nhật, hình vuông",
                "Chu vi hình chữ nhật, hình vuông",
            ]),
            ("Chương 8. Ôn tập cuối năm", [
                "Ôn tập số tự nhiên", "Ôn tập phép tính", "Ôn tập hình học",
                "Ôn tập đo lường",
            ]),
        ]
    },
    "KNTT_G3_VIETNAMESE_T1": {
        "title": "SGK Tiếng Việt 3 - Tập 1", "subject": "tieng_viet", "term": 1,
        "units": [
            ("Tuần 1-2. Tiếng Việt", [
                "Chính tả: Nghe viết", "Tập đọc: Cánh đồng",
                "Kể chuyện: Truyện cổ tích", "Từ và câu: Từ loại",
                "Chính tả: Nghe viết câu", "Tập đọc: Bài thơ",
                "Luyện từ và câu: Từ đồng nghĩa", "Kể chuyện: Kể lại truyện",
            ]),
            ("Tuần 3-4. Tiếng Việt", [
                "Chính tả: Chính tả", "Tập đọc: Câu chuyện",
                "Từ và câu: Từ trái nghĩa", "Kể chuyện: Kể chuyện sáng tạo",
                "Chính tả: Nghe viết đoạn", "Tập đọc: Thơ",
                "Luyện từ và câu: Đặt câu", "Kể chuyện: Kể lại",
            ]),
            ("Tuần 5-6. Tiếng Việt", [
                "Chính tả", "Tập đọc: Bé kể chuyện", "Từ và câu", "Kể chuyện",
                "Chính tả", "Tập đọc: Truyện kể", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 7-8. Tiếng Việt", [
                "Chính tả", "Tập đọc", "Từ và câu", "Kể chuyện",
                "Chính tả", "Tập đọc", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 9-10. Tiếng Việt", [
                "Chính tả", "Tập đọc", "Từ và câu", "Kể chuyện",
                "Ôn tập giữa kỳ",
            ]),
        ]
    },
    "KNTT_G3_VIETNAMESE_T2": {
        "title": "SGK Tiếng Việt 3 - Tập 2", "subject": "tieng_viet", "term": 2,
        "units": [
            ("Tuần 19-20. Tiếng Việt", [
                "Chính tả", "Tập đọc", "Từ và câu", "Kể chuyện",
                "Chính tả", "Tập đọc", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 21-22. Tiếng Việt", [
                "Chính tả", "Tập đọc", "Từ và câu", "Kể chuyện",
                "Chính tả", "Tập đọc", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 23-24. Tiếng Việt", [
                "Chính tả", "Tập đọc", "Từ và câu", "Kể chuyện",
                "Chính tả", "Tập đọc", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 25-26. Tiếng Việt", [
                "Chính tả", "Tập đọc", "Từ và câu", "Kể chuyện",
                "Chính tả", "Tập đọc", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 33-35. Ôn tập cuối năm", [
                "Ôn tập chính tả", "Ôn tập từ vựng", "Ôn tập ngữ pháp",
                "Ôn tập kể chuyện",
            ]),
        ]
    },
    "KNTT_G3_ENGLISH_T1": {
        "title": "SGK Tiếng Anh 3 - Tập 1", "subject": "tieng_anh", "term": 1,
        "units": [
            ("Unit 1. Hello", [
                "Lesson 1: Hello", "Lesson 2: How are you?", "Lesson 3: Review",
            ]),
            ("Unit 2. My school", [
                "Lesson 1: My classroom", "Lesson 2: My school things",
                "Lesson 3: Review",
            ]),
            ("Unit 3. My friends", [
                "Lesson 1: Who is he?", "Lesson 2: She is my friend",
                "Lesson 3: Review",
            ]),
            ("Unit 4. My family", [
                "Lesson 1: This is my family", "Lesson 2: My mother is a teacher",
                "Lesson 3: Review",
            ]),
            ("Unit 5. My body", [
                "Lesson 1: Touch your head", "Lesson 2: My face",
                "Lesson 3: Review",
            ]),
        ]
    },
    "KNTT_G3_ENGLISH_T2": {
        "title": "SGK Tiếng Anh 3 - Tập 2", "subject": "tieng_anh", "term": 2,
        "units": [
            ("Unit 6. My favourite food", [
                "Lesson 1: I like noodles", "Lesson 2: Do you like fish?",
                "Lesson 3: Review",
            ]),
            ("Unit 7. My house", [
                "Lesson 1: This is my house", "Lesson 2: The living room",
                "Lesson 3: Review",
            ]),
            ("Unit 8. My day", [
                "Lesson 1: What time is it?", "Lesson 2: My daily routine",
                "Lesson 3: Review",
            ]),
            ("Unit 9. My favourite toys", [
                "Lesson 1: I have a doll", "Lesson 2: What is this?",
                "Lesson 3: Review",
            ]),
            ("Unit 10. Our hobbies", [
                "Lesson 1: I like reading", "Lesson 2: What do you like?",
                "Lesson 3: Review",
            ]),
        ]
    },
    "KNTT_G3_TNXH": {
        "title": "SGK Tự nhiên và Xã hội 3", "subject": "tu_nhien_xa_hoi", "term": None,
        "units": [
            ("Bài 1. Nơi em sống", [
                "Quê hương em", "Làng xóm em", "Thành phố em",
            ]),
            ("Bài 2. Con người và môi trường", [
                "Nước và không khí", "Cây xanh", "Bảo vệ môi trường",
            ]),
            ("Bài 3. An toàn cho em", [
                "An toàn giao thông", "An toàn khi vui chơi",
                "Phòng tránh tai nạn",
            ]),
            ("Bài 4. Gia đình và cộng đồng", [
                "Gia đình em", "Trường học em", "Cộng đồng em",
            ]),
            ("Bài 5. Khám phá thế giới", [
                "Mùa và thời tiết", "Động vật", "Thực vật",
                "Ôn tập cuối năm",
            ]),
        ]
    },
    "KNTT_G3_INFORMATICS": {
        "title": "SGK Tin học 3", "subject": "tin_hoc", "term": None,
        "units": [
            ("Chủ đề 1. Làm quen với máy tính", [
                "Máy tính và các bộ phận", "Bàn phím và chuột",
                "Khởi động máy tính", "Thực hành",
            ]),
            ("Chủ đề 2. Sử dụng máy tính", [
                "Mở và đóng phần mềm", "Tập gõ bàn phím",
                "Vẽ trên máy tính", "Thực hành",
            ]),
            ("Chủ đề 3. Tìm kiếm thông tin", [
                "Tìm kiếm trên máy tính", "Sắp xếp tệp tin",
                "Thư mục", "Thực hành",
            ]),
            ("Chủ đề 4. An toàn khi sử dụng", [
                "Thời gian sử dụng máy tính", "Tư thế ngồi đúng",
                "Bảo vệ mắt", "Ôn tập cuối năm",
            ]),
        ]
    },
    "KNTT_G3_MUSIC": {
        "title": "SGK Âm nhạc 3", "subject": "am_nhac", "term": None,
        "units": [
            ("Chủ đề 1. Em yêu trường", [
                "Hát: Mái trường mến yêu", "Hát: Bạn bè",
                "Nhịp 3/4", "Luyện tập",
            ]),
            ("Chủ đề 2. Em yêu gia đình", [
                "Hát: Gia đình", "Hát: Bố mẹ",
                "Nghe nhạc: Giao hưởng", "Luyện tập",
            ]),
            ("Chủ đề 3. Em yêu quê hương", [
                "Hát: Quê hương", "Hát: Đất nước",
                "Nhịp 4/4", "Luyện tập",
            ]),
            ("Chủ đề 4. Em với thiên nhiên", [
                "Hát: Mùa xuân đến", "Hát: Ông mặt trời",
                "Nghe nhạc: Hòa tấu", "Ôn tập cuối năm",
            ]),
        ]
    },
    "KNTT_G3_ART": {
        "title": "SGK Mĩ thuật 3", "subject": "mi_thuat", "term": None,
        "units": [
            ("Chủ đề 1. Vẽ từ nét đến hình", [
                "Vẽ đường thẳng, đường cong", "Vẽ hình vuông, hình tròn",
                "Vẽ hình tam giác", "Thực hành",
            ]),
            ("Chủ đề 2. Vẽ tranh", [
                "Vẽ phong cảnh", "Vẽ con vật", "Vẽ người",
                "Thực hành",
            ]),
            ("Chủ đề 3. Tạo hình", [
                "Nặn hình", "Gấp giấy", "Xé dán",
                "Thực hành",
            ]),
            ("Chủ đề 4. Trang trí", [
                "Trang trí hoa văn", "Trang trí viền",
                "Trang trí thiệp", "Ôn tập cuối năm",
            ]),
        ]
    },
    "KNTT_G3_PE": {
        "title": "SGK Giáo dục thể chất 3", "subject": "giao_duc_the_chat", "term": None,
        "units": [
            ("Phần 1. Kiến thức chung", [
                "Vệ sinh cá nhân", "An toàn trong tập luyện",
            ]),
            ("Phần 2. Đội hình đội ngũ", [
                "Xếp hàng dọc, hàng ngang", "Đội hình tam giác",
                "Đội hình chữ V", "Đi đều bước",
            ]),
            ("Phần 3. Bài tập thể dục", [
                "Vươn thở", "Tay ngang, tay trước", "Xoay người",
                "Bài thể dục toàn thân",
            ]),
            ("Phần 4. Vận động cơ bản", [
                "Chạy cự ly ngắn", "Nhảy xa", "Ném bóng",
                "Kéo co", "Luyện tập tổng hợp",
            ]),
        ]
    },
    "KNTT_G3_EXPERIENTIAL": {
        "title": "SGK Hoạt động trải nghiệm 3", "subject": "hoat_dong_trai_nghiem", "term": None,
        "units": [
            ("Chủ đề 1. Em với mái trường", [
                "Trường em", "Lớp em", "Em yêu trường",
            ]),
            ("Chủ đề 2. Em với bạn bè", [
                "Bạn bè em", "Chơi cùng bạn", "Giúp đỡ bạn",
            ]),
            ("Chủ đề 3. Em với gia đình", [
                "Gia đình em", "Em giúp bố mẹ", "Cả nhà vui",
            ]),
            ("Chủ đề 4. Em với cộng đồng", [
                "Bảo vệ môi trường", "An toàn giao thông",
                "Ôn tập cuối năm",
            ]),
        ]
    },
}

# ── Grade 4 Curriculum ──────────────────────────────────────────────
GRADE_4 = {
    "KNTT_G4_MATH_T1": {
        "title": "SGK Toán 4 - Tập 1", "subject": "toan", "term": 1,
        "units": [
            ("Chương 1. Số tự nhiên", [
                "Đọc, viết số tự nhiên đến hàng triệu", "So sánh số tự nhiên",
                "Làm tròn số", "Phép cộng trừ số tự nhiên",
                "Phép nhân chia số tự nhiên", "Luyện tập chung",
            ]),
            ("Chương 2. Phép nhân với số có nhiều chữ số", [
                "Nhân với số có 2 chữ số", "Nhân với số có 3 chữ số",
                "Luyện tập chung",
            ]),
            ("Chương 3. Phép chia với số có nhiều chữ số", [
                "Chia cho số có 2 chữ số", "Chia cho số có 3 chữ số",
                "Luyện tập chung",
            ]),
            ("Chương 4. Các yếu tố hình học", [
                "Điểm, đường thẳng, đoạn thẳng", "Góc, các loại góc",
                "Đo góc", "Luyện tập chung",
            ]),
        ]
    },
    "KNTT_G4_MATH_T2": {
        "title": "SGK Toán 4 - Tập 2", "subject": "toan", "term": 2,
        "units": [
            ("Chương 5. Phân số", [
                "Tập phân số", "So sánh phân số", "Phân số bằng nhau",
                "Luyện tập chung",
            ]),
            ("Chương 6. Các phép tính với phân số", [
                "Cộng phân số", "Trừ phân số", "Nhân phân số với số tự nhiên",
                "Luyện tập chung",
            ]),
            ("Chương 7. Đo lường", [
                "Diện tích (tiếp theo)", "Thể tích",
                "Luyện tập chung",
            ]),
            ("Chương 8. Ôn tập cuối năm", [
                "Ôn tập số tự nhiên", "Ôn tập phân số",
                "Ôn tập hình học", "Ôn tập đo lường",
            ]),
        ]
    },
    "KNTT_G4_VIETNAMESE_T1": {
        "title": "SGK Tiếng Việt 4 - Tập 1", "subject": "tieng_viet", "term": 1,
        "units": [
            ("Tuần 1. Bài 1-2", [
                "Tập đọc: Cánh đồng", "Chính tả: Nghe viết",
                "Từ và câu: Từ loại", "Kể chuyện: Kể lại",
                "Tập đọc: Bài thơ", "Chính tả: Chính tả",
                "Từ và câu: Từ đồng nghĩa", "Kể chuyện: Sáng tạo",
            ]),
            ("Tuần 2-3. Bài 3-4", [
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 4-5. Bài 5-6", [
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 6-7. Bài 7-8", [
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 8-10. Ôn tập giữa kỳ", [
                "Ôn tập tập đọc", "Ôn tập chính tả",
                "Ôn tập từ và câu", "Ôn tập kể chuyện",
            ]),
        ]
    },
    "KNTT_G4_VIETNAMESE_T2": {
        "title": "SGK Tiếng Việt 4 - Tập 2", "subject": "tieng_viet", "term": 2,
        "units": [
            ("Tuần 19-20. Bài 21-22", [
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 21-22. Bài 23-24", [
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 23-24. Bài 25-26", [
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 25-26. Bài 27-28", [
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 33-35. Ôn tập cuối năm", [
                "Ôn tập tập đọc", "Ôn tập chính tả",
                "Ôn tập từ vựng", "Ôn tập ngữ pháp",
            ]),
        ]
    },
    "KNTT_G4_SCIENCE": {
        "title": "SGK Khoa học 4", "subject": "khoa_hoc", "term": None,
        "units": [
            ("Chủ đề 1. Sinh vật và môi trường", [
                "Các nhóm sinh vật", "Môi trường sống",
                "Chuỗi thức ăn", "Bảo vệ sinh vật",
            ]),
            ("Chủ đề 2. Vật chất và năng lượng", [
                "Các trạng thái của vật chất", "Nhiệt độ",
                "Nhiệt và sự nóng chảy", "Năng lượng",
            ]),
            ("Chủ đề 3. Trái Đất và Vũ trụ", [
                "Địa hình", "Nước trên Trái Đất",
                "Thời tiết và khí hậu", "Bảo vệ môi trường",
            ]),
            ("Chủ đề 4. Cơ thể người", [
                "Cơ quan tiêu hóa", "Cơ quan hô hấp",
                "Cơ quan tuần hoàn", "Bảo vệ sức khỏe",
            ]),
        ]
    },
    "KNTT_G4_HISTORY_GEO": {
        "title": "SGK Lịch sử và Địa lí 4", "subject": "lich_su_dia_li", "term": None,
        "units": [
            ("Chủ đề 1. Lịch sử Việt Nam", [
                "Người Việt cổ", "Các vua Hùng",
                "Anh hùng dân tộc", "Truyền thống lịch sử",
            ]),
            ("Chủ đề 2. Địa lí Việt Nam", [
                "Tự nhiên Việt Nam", "Con người Việt Nam",
                "Các vùng miền", "Bảo vệ tài nguyên",
            ]),
            ("Chủ đề 3. Lịch sử thế giới", [
                "Các nền văn minh cổ", "Phát minh lớn",
            ]),
            ("Chủ đề 4. Địa lí thế giới", [
                "Các châu lục", "Khí hậu thế giới",
                "Ôn tập cuối năm",
            ]),
        ]
    },
    "KNTT_G4_MUSIC": {
        "title": "SGK Âm nhạc 4", "subject": "am_nhac", "term": None,
        "units": [
            ("Chủ đề 1. Hát múa", [
                "Hát: Đất nước", "Hát: Quê hương",
                "Múa dân gian", "Luyện tập",
            ]),
            ("Chủ đề 2. Nhạc cụ", [
                "Đàn bầu", "Đàn tranh", "Sáo trúc",
                "Luyện tập",
            ]),
            ("Chủ đề 3. Nghe nhạc", [
                "Nhạc giao hưởng", "Nhạc dân ca",
                "Nhạc thiếu nhi", "Luyện tập",
            ]),
            ("Chủ đề 4. Sáng tạo âm nhạc", [
                "Sáng tác bài hát", "Hòa âm cơ bản",
                "Biểu diễn", "Ôn tập cuối năm",
            ]),
        ]
    },
}

# ── Grade 5 Curriculum ──────────────────────────────────────────────
GRADE_5 = {
    "KNTT_G5_MATH_T1": {
        "title": "SGK Toán 5 - Tập 1", "subject": "toan", "term": 1,
        "units": [
            ("Chương 1. Ôn tập số tự nhiên", [
                "Đọc, viết số tự nhiên đến hàng tỷ", "So sánh, làm tròn số",
                "Phép cộng trừ số tự nhiên", "Phép nhân chia số tự nhiên",
                "Luyện tập chung",
            ]),
            ("Chương 2. Phân số và số thập phân", [
                "Tập phân số", "So sánh phân số", "Phân số bằng nhau",
                "Số thập phân", "Luyện tập chung",
            ]),
            ("Chương 3. Các phép tính với phân số", [
                "Cộng trừ phân số", "Nhân phân số", "Chia phân số",
                "Luyện tập chung",
            ]),
            ("Chương 4. Hình học", [
                "Diện tích hình tam giác", "Diện tích hình thang",
                "Thể tích hình hộp chữ nhật", "Luyện tập chung",
            ]),
        ]
    },
    "KNTT_G5_MATH_T2": {
        "title": "SGK Toán 5 - Tập 2", "subject": "toan", "term": 2,
        "units": [
            ("Chương 5. Tỉ số phần trăm", [
                "Tỉ số phần trăm", "Phần trăm của một số",
                "Bài toán phần trăm", "Luyện tập chung",
            ]),
            ("Chương 6. Số đo thời gian và vận tốc", [
                "Đo thời gian", "Quãng đường và vận tốc",
                "Bài toán chuyển động", "Luyện tập chung",
            ]),
            ("Chương 7. Thống kê và xác suất", [
                "Tần số và tần suất", "Số trung bình",
                "Biểu đồ", "Luyện tập chung",
            ]),
            ("Chương 8. Ôn tập cuối năm", [
                "Ôn tập số tự nhiên", "Ôn tập phân số",
                "Ôn tập hình học", "Ôn tập thống kê",
            ]),
        ]
    },
    "KNTT_G5_VIETNAMESE_T1": {
        "title": "SGK Tiếng Việt 5 - Tập 1", "subject": "tieng_viet", "term": 1,
        "units": [
            ("Tuần 1. Bài 1-2", [
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 2-3. Bài 3-4", [
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 4-5. Bài 5-6", [
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 6-7. Bài 7-8", [
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 8-10. Ôn tập giữa kỳ", [
                "Ôn tập tập đọc", "Ôn tập chính tả",
                "Ôn tập từ và câu", "Ôn tập kể chuyện",
            ]),
        ]
    },
    "KNTT_G5_VIETNAMESE_T2": {
        "title": "SGK Tiếng Việt 5 - Tập 2", "subject": "tieng_viet", "term": 2,
        "units": [
            ("Tuần 19-20. Bài 21-22", [
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 21-22. Bài 23-24", [
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 23-24. Bài 25-26", [
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 25-26. Bài 27-28", [
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
                "Tập đọc", "Chính tả", "Từ và câu", "Kể chuyện",
            ]),
            ("Tuần 33-35. Ôn tập cuối năm", [
                "Ôn tập tập đọc", "Ôn tập chính tả",
                "Ôn tập từ vựng", "Ôn tập ngữ pháp",
            ]),
        ]
    },
    "KNTT_G5_ENGLISH_T1": {
        "title": "SGK Tiếng Anh 5 - Tập 1", "subject": "tieng_anh", "term": 1,
        "units": [
            ("Unit 1. My new school", [
                "Lesson 1: Welcome back!", "Lesson 2: My timetable",
                "Lesson 3: Review",
            ]),
            ("Unit 2. My friends", [
                "Lesson 1: How old are you?", "Lesson 2: Where do you live?",
                "Lesson 3: Review",
            ]),
            ("Unit 3. My daily routine", [
                "Lesson 1: What time do you get up?", "Lesson 2: My weekend",
                "Lesson 3: Review",
            ]),
            ("Unit 4. My hobbies", [
                "Lesson 1: What is your hobby?", "Lesson 2: I like reading",
                "Lesson 3: Review",
            ]),
            ("Unit 5. My house", [
                "Lesson 1: This is my house", "Lesson 2: The rooms",
                "Lesson 3: Review",
            ]),
        ]
    },
    "KNTT_G5_ENGLISH_T2": {
        "title": "SGK Tiếng Anh 5 - Tập 2", "subject": "tieng_anh", "term": 2,
        "units": [
            ("Unit 6. My favourite food", [
                "Lesson 1: What would you like?", "Lesson 2: Cooking",
                "Lesson 3: Review",
            ]),
            ("Unit 7. My city", [
                "Lesson 1: Where is the post office?", "Lesson 2: In the city",
                "Lesson 3: Review",
            ]),
            ("Unit 8. My holiday", [
                "Lesson 1: Where did you go?", "Lesson 2: My summer holiday",
                "Lesson 3: Review",
            ]),
            ("Unit 9. My future job", [
                "Lesson 1: What do you want to be?", "Lesson 2: Jobs",
                "Lesson 3: Review",
            ]),
            ("Unit 10. Our world", [
                "Lesson 1: Protect the environment", "Lesson 2: The future",
                "Lesson 3: Review",
            ]),
        ]
    },
    "KNTT_G5_HISTORY_GEO": {
        "title": "SGK Lịch sử và Địa lí 5", "subject": "lich_su_dia_li", "term": None,
        "units": [
            ("Chủ đề 1. Lịch sử Việt Nam", [
                "Các triều đại phong kiến", "Kháng chiến chống ngoại xâm",
                "Truyền thống văn hóa", "Anh hùng dân tộc",
            ]),
            ("Chủ đề 2. Địa lí Việt Nam", [
                "Địa hình tự nhiên", "Khí hậu và thời tiết",
                "Dân cư và kinh tế", "Bảo vệ tài nguyên thiên nhiên",
            ]),
            ("Chủ đề 3. Lịch sử thế giới", [
                "Các cuộc cách mạng", "Phát minh khoa học",
            ]),
            ("Chủ đề 4. Địa lí thế giới", [
                "Các châu lục và đại dương", "Khí hậu thế giới",
                "Ôn tập cuối năm",
            ]),
        ]
    },
    "KNTT_G5_TECHNOLOGY": {
        "title": "SGK Công nghệ 5", "subject": "cong_nghe", "term": None,
        "units": [
            ("Chủ đề 1. Công nghệ trong gia đình", [
                "Sử dụng đồ gia dụng", "Bảo quản đồ dùng",
                "Sửa chữa đơn giản", "Thực hành",
            ]),
            ("Chủ đề 2. Công nghệ trong trường học", [
                "Sử dụng máy tính", "Internet an toàn",
                "Sáng tạo công nghệ", "Thực hành",
            ]),
            ("Chủ đề 3. Công nghệ và môi trường", [
                "Bảo vệ môi trường", "Tái chế", "Năng lượng sạch",
                "Thực hành",
            ]),
            ("Chủ đề 4. Công nghệ và xã hội", [
                "Công nghệ trong đời sống", "An toàn công nghệ",
                "Ôn tập cuối năm",
            ]),
        ]
    },
    "KNTT_G5_ETHICS": {
        "title": "SGK Đạo đức 5", "subject": "dao_duc", "term": None,
        "units": [
            ("Chủ đề 1. Đạo đức cá nhân", [
                "Trung thực", "Dũng cảm", "Tự trọng", "Siêng năng",
            ]),
            ("Chủ đề 2. Đạo đức gia đình", [
                "Hiếu thảo", "Yêu thương", "Giúp đỡ gia đình",
            ]),
            ("Chủ đề 3. Đạo đức xã hội", [
                "Tôn trọng người khác", "Giúp đỡ cộng đồng",
                "Bảo vệ môi trường", "Trách nhiệm công dân",
            ]),
            ("Chủ đề 4. Ôn tập", [
                "Ôn tập đạo đức cá nhân", "Ôn tập đạo đức gia đình",
                "Ôn tập đạo đức xã hội", "Ôn tập cuối năm",
            ]),
        ]
    },
    "KNTT_G5_MUSIC": {
        "title": "SGK Âm nhạc 5", "subject": "am_nhac", "term": None,
        "units": [
            ("Chủ đề 1. Hát múa", [
                "Hát: Đất nước lời ru", "Hát: Mùa xuân",
                "Múa hiện đại", "Luyện tập",
            ]),
            ("Chủ đề 2. Nhạc cụ", [
                "Đàn organ", "Guitar cơ bản",
                "Trống", "Luyện tập",
            ]),
            ("Chủ đề 3. Sáng tạo", [
                "Sáng tác bài hát", "Hòa âm",
                "Biểu diễn nhóm", "Luyện tập",
            ]),
            ("Chủ đề 4. Ôn tập", [
                "Ôn tập hát", "Ôn tập nhạc cụ",
                "Biểu diễn cuối năm", "Ôn tập tổng hợp",
            ]),
        ]
    },
}


def build_curriculum(grade_num, grade_data):
    """Build books, lessons, daily_learning_units from curriculum data."""
    books = []
    lessons = []
    daily_units = []
    unit_counter = 0

    for book_id, book_info in grade_data.items():
        subject = book_info["subject"]
        term = book_info["term"]

        # Normalize book_id to match KNTT convention
        book = {
            "book_id": book_id,
            "title": book_info["title"],
            "subject": subject,
            "grade": grade_num,
            "series": SERIES,
            "term": term,
            "source_type": "toc_seed",
            "parse_status": "toc_seed_from_visual",
            "rights_note": RIGHTS,
        }
        books.append(book)

        lesson_no = 0
        for unit_name, lesson_titles in book_info["units"]:
            for title in lesson_titles:
                lesson_no += 1
                lid = f"{book_id}_L{lesson_no:03d}"
                lesson = {
                    "lesson_id": lid,
                    "book_id": book_id,
                    "subject": subject,
                    "grade": grade_num,
                    "unit": unit_name,
                    "week": None,
                    "lesson_no": lesson_no,
                    "title": title,
                    "page_start": None,
                    "page_end": None,
                    "lesson_type": "lesson",
                    "confidence": CONFIDENCE,
                    "rights_note": RIGHTS,
                }
                lessons.append(lesson)

                unit_counter += 1
                du = {
                    "daily_unit_id": f"DU_G{grade_num}_{unit_counter:04d}",
                    "grade": grade_num,
                    "subject": subject,
                    "book_id": book_id,
                    "lesson_id": lid,
                    "title": title,
                    "recommended_duration_min": 15,
                    "ai_task_mode": "guided_practice",
                    "parent_prompt": f"Hôm nay học: {title}. AI chỉ dùng metadata bài học, không đọc nguyên văn SGK nếu chưa có license.",
                    "content_status": "metadata_only_needs_content_extraction",
                }
                daily_units.append(du)

    return books, lessons, daily_units


def write_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    grades = {
        1: GRADE_1,
        3: GRADE_3,
        4: GRADE_4,
        5: GRADE_5,
    }

    for grade_num, grade_data in grades.items():
        out_dir = f"backend/data/curriculum/grade_{grade_num}"
        os.makedirs(out_dir, exist_ok=True)

        books, lessons, daily_units = build_curriculum(grade_num, grade_data)

        write_json(os.path.join(out_dir, "books.json"), books)
        write_json(os.path.join(out_dir, "lessons.json"), lessons)
        write_json(os.path.join(out_dir, "daily_learning_units.json"), daily_units)

        print(f"Grade {grade_num}: {len(books)} books, {len(lessons)} lessons, {len(daily_units)} daily units")
        for b in books:
            print(f"  {b['book_id']}: {b['title']}")


if __name__ == "__main__":
    main()
