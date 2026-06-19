# AI Kids Buddy - Runbook

## Quick Start

### 1. Setup
```powershell
cd C:\AI_KIDS_BUDDY
pip install -r requirements.txt
```

### 2. Set MIMO Keys
```powershell
# Primary key (required)
$env:MIMO_TOKEN_PLAN_KEY = "your-primary-key"

# Fallback key (optional)
$env:MIMO_API_KEY = "your-fallback-key"
```

### 3. Start Backend
```powershell
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Open Frontend
- Local: Open `web/index.html` in browser
- Mobile: Navigate to `http://<your-ip>:8000/`

### 5. Run Smoke Tests
```powershell
powershell -ExecutionPolicy Bypass -File scripts/smoke_check.ps1
```

## Architecture
```
web/index.html    → Frontend (HTML/CSS/JS)
web/script.js     → Chat, voice, parent controls
backend/main.py   → FastAPI server
backend/prompts.py → AI prompt builder
backend/safety_alpha.py → Safety filters
backend/mimo_client.py → MIMO API proxy
```

## Environment Variables
All environment variables are backend-only. Do not set them in frontend code or expose API keys to users.

| Variable | Required | Description |
|----------|----------|-------------|
| MIMO_TOKEN_PLAN_KEY | Yes | Primary MIMO API key (backend only) |
| MIMO_API_KEY | No | Fallback MIMO API key (backend only) |
| MIMO_BASE_URL | No | MIMO API base URL (default: https://api.mimo.ai/v1) |
| MIMO_ENDPOINT | No | MIMO API full endpoint (overrides base URL) |
| MIMO_MODEL | No | Model name (default: mimo-default) |

## Default Parent PIN
`0000` (change in parent settings)

## Key Features
- Text chat with AI
- Push-to-talk voice (Web Speech API)
- Parent controls (PIN, age, mode, goal)
- Safety filters (private info, unsafe topics)
- SEL detection (emotions, bullying)
- PWA support
- Capacitor APK stub