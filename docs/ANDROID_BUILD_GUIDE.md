# VyVy — Hướng dẫn build APK (Android)

## Yêu cầu
- Node.js 18+
- Android Studio (để build APK)
- Java JDK 17+

## Bước 1: Cài Capacitor
```bash
cd C:\AI_KIDS_BUDDY\capacitor
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
```

## Bước 2: Khởi tạo Capacitor
```bash
npx cap init "VyVy" "com.vyvy.ai" --web-dir ../web
```

## Bước 3: Thêm Android platform
```bash
npx cap add android
```

## Bước 4: Sync web to Android
```bash
npx cap sync android
```

## Bước 5: Mở Android Studio
```bash
npx cap open android
```

## Bước 6: Build APK
Trong Android Studio:
1. Build → Build Bundle(s) / APK(s) → Build APK(s)
2. Chờ build xong
3. APK nằm trong: `android/app/build/outputs/apk/debug/app-debug.apk`

## Bước 7: Cài lên Xiaomi
- Copy APK vào điện thoại
- Mở file APK → Cài đặt
- Hoặc dùng ADB: `adb install app-debug.apk`

## Lưu ý
- APK cần kết nối backend qua LAN (cùng WiFi)
- Sửa IP trong `capacitor.config.json` thành IP laptop
- Backend phải đang chạy trên laptop
- Đây là debug APK, không phải production

## Sửa IP cho LAN
Trong `capacitor.config.json`, sửa:
```json
{
  "server": {
    "url": "http://YOUR_LAPTOP_IP:5173"
  }
}
```
Thay `YOUR_LAPTOP_IP` bằng IP thực (dùng `ipconfig`).

## Alternative: Dùng PWA thay APK
VyVy là PWA-ready. Trên Xiaomi:
1. Mở Chrome
2. Truy cập `http://YOUR_IP:5173`
3. Menu → "Thêm vào màn hình chính"
4. VyVy sẽ xuất hiện như app
