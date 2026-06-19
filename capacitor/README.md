# Capacitor APK Build Guide

## Prerequisites
- Node.js 18+
- Android Studio
- Java 17+

## Setup
```bash
cd C:\AI_KIDS_BUDDY
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "AI Kids Buddy" "com.aikidsbuddy.app" --web-dir web
npx cap add android
```

## Build
```bash
# Copy web files to native project
npx cap copy android

# Open in Android Studio
npx cap open android
```

## Android Permissions
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
```

## Xiaomi Sideloading
1. Enable Developer Options: Settings > About Phone > MIUI Version (tap 7 times)
2. Enable USB Debugging: Settings > Additional Settings > Developer Options
3. Build APK in Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
4. Transfer APK to phone via USB or file manager
5. Install: Open APK file > Allow from this source > Install

## Notes
- Update `server.url` in `capacitor.config.json` to your backend IP
- For production, use HTTPS
- Test microphone permission on real device
