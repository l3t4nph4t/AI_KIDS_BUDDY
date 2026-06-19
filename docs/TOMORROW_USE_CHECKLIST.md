# VyVy — Hướng dẫn sử dụng cho ngày mai

## Cài đặt

### 1. Cài Python packages
```
pip install fastapi uvicorn httpx
```

### 2. Kiểm tra MIMO key
File `.local/mimo.env` phải có `MIMO_TOKEN_PLAN_KEY`.

---

## Chạy ứng dụng

### Terminal 1 — Backend
```
cd C:\AI_KIDS_BUDDY
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8010
```

### Terminal 2 — Web
```
cd C:\AI_KIDS_BUDDY
python -m http.server 5173 -d web --bind 0.0.0.0
```

---

## Mở trên laptop
```
http://127.0.0.1:5173
```

## Mở trên Xiaomi (cùng mạng LAN)

### Bước 1: Lấy IP laptop
```
ipconfig
```
Tìm dòng `IPv4 Address` (VD: `192.168.1.100`)

### Bước 2: Mở trình duyệt trên Xiaomi
```
http://192.168.1.100:5173
```

### Bước 3: Kiểm tra backend
```
http://192.168.1.100:8010/health
```
Phải thấy: `{"status":"ok","app":"VyVy","version":"1.0.0"}`

---

## Kiểm tra nhanh

- [ ] Mở app trên laptop — thấy VyVy
- [ ] Nhắn tin cho VyVy — VyVy trả lời
- [ ] Nhấn nút "VyVy kể chuyện" — VyVy kể chuyện
- [ ] Nhấn nút "Đố vui cùng VyVy" — VyVy đố vui
- [ ] Nhấn nút "Học tiếng Anh nhẹ" — VyVy dạy từ mới
- [ ] Nhấn nút "Toán vui cùng VyVy" — VyVy cho bài toán
- [ ] Nhấn nút "Cùng VyVy tưởng tượng" — VyVy kể tình huống
- [ ] Nhấn nút "Hôm nay con thấy sao?" — VyVy hỏi thăm
- [ ] Mở cài đặt (biểu tượng bánh răng) — nhập PIN — thay đổi tên/tuổi
- [ ] Lưu cài đặt — VyVy nhớ tên con
- [ ] Mở app trên Xiaomi — thấy VyVy
- [ ] Nhắn tin trên Xiaomi — VyVy trả lời
- [ ] Nhấn "Gọi VyVy" (nếu trình duyệt hỗ trợ) — nói chuyện giọng nói
- [ ] Nhấn "Kết thúc" — dừng gọi

---

## Xử lý lỗi thường gặp

### Lỗi: "VyVy bị lỗi rồi"
- **Nguyên nhân:** Backend chưa chạy
- **Khắc phục:** Kiểm tra Terminal 1 có đang chạy không

### Lỗi: Không mở được trên Xiaomi
- **Nguyên nhân:** Sai IP hoặc khác mạng WiFi
- **Khắc phục:** 
  1. Kiểm tra `ipconfig` lấy đúng IP
  2. Đảm bảo Xiaomi và laptop cùng mạng WiFi
  3. Tắt firewall tạm thời để test

### Lỗi: "Máy này chưa hỗ trợ gọi giọng nói"
- **Nguyên nhân:** Trình duyệt không hỗ trợ SpeechRecognition
- **Khắc phục:** Dùng Chrome trên Xiaomi, hoặc nhắn tin thay thế

### Lỗi: Backend không khởi động
- **Nguyên nhân:** Thiếu package
- **Khắc phục:** `pip install fastapi uvicorn httpx`

### Lỗi: Trang trắng
- **Nguyên nhân:** Web server chưa chạy
- **Khắc phục:** Kiểm tra Terminal 2

### Lỗi: Firewall chặn
- **Khắc phục:** 
  ```
  netsh advfirewall firewall add rule name="VyVy-8010" dir=in action=allow protocol=tcp localport=8010
  netsh advfirewall firewall add rule name="VyVy-5173" dir=in action=allow protocol=tcp localport=5173
  ```

---

## Mẹo cho phụ huynh

1. **Giám sát:** Luôn ngồi cạnh con khi sử dụng
2. **PIN:** PIN phụ huynh mặc định do bạn tạo lần đầu
3. **Cài đặt:** Chọn tuổi và chế độ phù hợp
4. **Nội dung:** 60+ giờ nội dung đa dạng (chuyện, toán, tiếng Anh, cảm xúc)
5. **Bộ nhớ:** VyVy nhớ sở thích của con qua localStorage
6. **Xóa bộ nhớ:** Vào cài đặt → Xóa bộ nhớ VyVy
7. **Tóm tắt:** Vào cài đặt → Tóm tắt hôm nay để xem hoạt động
