# Troubleshooting Guide

## Backend Issues

### MIMO API Key Missing
**Symptom**: Backend returns "Hệ thống chưa cấu hình"
**Fix**: Set environment variable `MIMO_TOKEN_PLAN_KEY` before starting backend
```powershell
$env:MIMO_TOKEN_PLAN_KEY = "your-key-here"
python -m uvicorn backend.main:app --reload
```

### Backend Won't Start
**Symptom**: `ModuleNotFoundError` or import errors
**Fix**: Install dependencies
```powershell
pip install -r requirements.txt
```

### CORS Errors
**Symptom**: Browser console shows CORS error
**Fix**: Add your frontend URL to allowed origins in `backend/main.py`

## Frontend Issues

### Voice Not Working (Xiaomi)
**Symptom**: Push-to-talk doesn't respond
**Fix**: See `docs/XIAOMI_VOICE_CHECKLIST.md`

### PWA Not Installing
**Symptom**: No "Add to Home Screen" option
**Fix**: Ensure HTTPS (or localhost), manifest.json accessible, service worker registered

### Chat Not Sending
**Symptom**: Messages don't appear or no response
**Fix**: Check backend is running on correct port, check browser console for errors

## Voice Issues

### STT Not Recognizing
**Possible causes**:
- No internet connection (Web Speech API requires internet)
- Microphone permission not granted
- Browser doesn't support Web Speech API

### TTS Not Speaking
**Possible causes**:
- Phone on silent/vibrate mode
- SpeechSynthesis not supported
- Vietnamese voice not available

## Build Issues

### Capacitor Build Fails
**Fix**: Ensure Node.js 18+, Android Studio installed, ANDROID_HOME set
