# Kinh nghiệm tối ưu Token khi làm việc với AI

## 1. Nguyên tắc vàng

### Mỗi session = 1 task cụ thể
```
❌ "Fix PDF feature, deploy, rồi test luôn"
✅ "Fix bug Grade 5 PDF splitting - file 50MB thay vì 2MB"
```

### Mô tả rõ ràng NGAY TỪ ĐẦU
```
❌ "PDF bị lỗi, sửa đi"
✅ "Grade 5 lesson PDFs mỗi file 50MB. Nguyên nhân: pypdf copy shared XObjects. 
    Cần prune unused XObjects, target size ~2-5MB/file. 
    Source: backend/data/source_sgk/grade_5/*.pdf
    Output: backend/data/lesson_pdfs/grade_5/*.pdf"
```

---

## 2. Cấu trúc yêu cầu hiệu quả

### Template yêu cầu
```
## Mục tiêu
[1 câu mô tả ngắn gọn]

## Vấn đề hiện tại
- [Symptom]: [Mô tả cụ thể]
- [Root cause]: [Nếu biết]

## Output mong đợi
- [File nào thay đổi]
- [Kết quả cụ thể, có số]

## Ràng buộc
- [Không được phá cái X]
- [Phải tương thích với Y]

## Context (nếu cần)
- [File liên quan]
- [Code snippet quan trọng]
```

### Ví dụ
```
## Mục tiêu
Sửa Grade 5 PDF splitting - mỗi lesson PDF phải < 5MB

## Vấn đề hiện tại
- Symptom: Mỗi lesson PDF = 50MB (bằng source PDF)
- Root cause: pypdf copy tất cả shared XObjects vào mỗi page

## Output mong đợi
- Sửa scripts/split_pdf_lessons.py
- Chạy lại cho Grade 5
- Mỗi file ~2-5MB

## Ràng buộc
- Không sửa Grade 1-4 (đã OK)
- Giữ nguyên page range từ lessons.json

## Context
- Source PDF: backend/data/source_sgk/grade_5/
- Lesson metadata: backend/data/curriculum/grade_5/lessons.json
```

---

## 3. Tránh lãng phí Token

### Không đọc file lớn toàn bộ
```
❌ Đọc lessons.json 3000 dòng
✅ Đọc lessons.json dòng 1-50 để hiểu structure, rồi grep cho cụ thể
```

### Dùng task tool cho work phức tạp
```
❌ Tự làm 10 bước trong 1 session
✅ Task tool: "Tìm tất cả file liên quan đến PDF splitting và tóm tắt"
   → Agent riêng, context mới, không pollute session chính
```

### Batch nhiều thao tác
```
❌ Message 1: Đọc file A
   Message 2: Đọc file B  
   Message 3: So sánh A và B
✅ Message: Đọc file A và B, so sánh differences
```

### Không lặp lại code
```
❌ Sửa code → Test → Sai → Sửa lại → Test → Sai → Sửa lại
✅ Test approach trước bằng script nhỏ → Khi OK → Apply vào code chính
```

---

## 4. Workflow tối ưu

### Bước 1: Explore (1-2 messages)
- Dùng task tool để hiểu codebase
- Nhận tóm tắt, không cần đọc chi tiết

### Bước 2: Plan (1 message)
- AI đề xuất plan
- Anh confirm hoặc sửa

### Bước 3: Implement (2-3 messages)
- AI viết code
- Anh review

### Bước 4: Test (1-2 messages)
- Chạy test
- Fix nếu cần

**Tổng: 5-8 messages cho 1 feature đơn giản**

---

## 5. Session hiện tại - Phân tích lãng phí

| Nguyên nhân | Token ước tính | Cách tránh |
|-------------|---------------|------------|
| Đọc lessons.json nhiều lần | ~500K | Đọc 1 lần, cache trong response |
| Debug PDF splitting 10+ vòng | ~2M | Test approach trước bằng script nhỏ |
| Đọc source PDF content | ~1M | Không cần đọc binary content |
| Mỗi message thêm context | ~500K | Batch thao tác |
| Lặp lại cùng code | ~1M | Viết đúng ngay lần đầu |

**Tổng lãng phí ước tính: ~5M token** (session này ~1B token = 99.5% lãng phí)

---

## 6. Checklist trước khi gửi yêu cầu

- [ ] Task có cụ thể không? (có số, có file path)
- [ ] Có thể chia nhỏ thành task con không?
- [ ] Có cần đọc file lớn không? (dùng grep thay vì read)
- [ ] Có thể batch nhiều thao tác không?
- [ ] Context có cần thiết không? (chỉ gửi code liên quan)

---

## 7. Khi nào dùng task tool

Dùng task tool khi:
- Tìm kiếm codebase (tìm file, tìm function)
- Phân tích code (review, refactor suggestions)
- Work độc lập (không cần context session hiện tại)

Không dùng task tool khi:
- Sửa file cụ thể
- Chạy command cụ thể
- Hỏi đáp đơn giản
