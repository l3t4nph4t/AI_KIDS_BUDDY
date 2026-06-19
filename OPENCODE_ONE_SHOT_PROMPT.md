You are OpenCode CLI. Run this as a new personal-use alpha project.

Important:
- There is NO CommandCode.
- OpenCode is only the local orchestrator/runner.
- MIMO Token Plan is the executor and implementer.
- Use MIMO for implementation patches.
- Do not touch AI_2026 or AI_GAME.
- Target repo: `C:\AI_KIDS_BUDDY`.

Goal:
Build AI Kids Buddy Alpha24: a fastest-possible Web App where my child can talk 1:1 with an AI buddy by text and push-to-talk voice on Xiaomi/Chrome. Parent can set age 7/8/9, nickname, learning goal, and learning/play mode. This is personal supervised use, not public production.

Use:
- Web App first.
- FastAPI backend.
- Backend only needs `/health` and `/chat` for alpha.
- Parent settings and short memory can be localStorage.
- Voice uses browser Web Speech API / SpeechSynthesis where available.
- Text fallback is required.
- Optional PWA/Capacitor stub only after core works.

Do NOT build:
- Android Kotlin native.
- Full database.
- Complex parent backend.
- Full production safety classifier.
- Large test suite.
- SMS/email alert.
- Live call streaming.
- Heavy robot animation first.

Runner:
- Create/use `mimo_output/opencode_only/mimo_autonomous_runner.py`.
- max_parallel=20.
- max_retries=2.
- Runner calls MIMO Token Plan and receives patch JSON.
- Runner applies patch in dry-run temp workspace.
- Runner runs minimal smoke checks.
- Runner retries failed task up to 2 times.
- Runner applies real patch only if dry-run passes.
- Runner writes final report in `mimo_output/runs/`.

MIMO config:
- API key env: `MIMO_TOKEN_PLAN_KEY`, fallback `MIMO_API_KEY`.
- Base URL env: `MIMO_BASE_URL`, default `https://token-plan-sgp.xiaomimimo.com/v1`.
- Model env: `MIMO_MODEL`, default `MiMo-V2.5-Pro`.

MIMO patch JSON contract:
{
  "task_id": "...",
  "summary": "...",
  "files": [
    {"path": "relative/path", "action": "create_or_replace", "content": "full file content"}
  ],
  "smoke_checks": ["command"],
  "notes": ["..."]
}

Allowed paths:
- web/**
- backend/**
- scripts/**
- docs/**
- mimo_output/reports/**
- mimo_output/patches/**
- .env.example
- .gitignore
- requirements.txt
- package.json
- capacitor/**

Blocked:
- .env
- AI_2026
- AI_GAME
- paths outside C:\AI_KIDS_BUDDY
- destructive scripts
- placing API keys in frontend

Alpha tasks to dispatch to MIMO in parallel waves:

Phase A — Skeleton:
1. root scaffold
2. backend health/chat skeleton
3. web index.html
4. web style.css
5. web script.js localStorage skeleton
6. run scripts
7. docs alpha plan
8. manual test checklist

Phase B — Chat:
1. MIMO client
2. `/chat` request/response
3. mock fallback
4. alpha prompt assembly
5. basic unsafe/private-info redirect
6. CORS config

Phase C — Voice/UI:
1. chat bubbles
2. push-to-talk button
3. Web Speech API STT
4. SpeechSynthesis TTS
5. listening/thinking/speaking state
6. text fallback

Phase D — Parent:
1. parent PIN
2. age selector 7/8/9
3. learning/play selector Light/Balanced/Focused
4. learning goal input
5. reset memory
6. daily summary

Phase E — Optional PWA/Capacitor:
1. manifest
2. icon/splash placeholder
3. offline/error fallback
4. Capacitor stub
5. Xiaomi test checklist

Product behavior:
- Bot speaks Vietnamese by default.
- Bot replies in 1–4 short sentences.
- Age 7 = very simple and playful.
- Age 8 = short with light explanation.
- Age 9 = slightly more logical explanation.
- Learning mode Light = mostly chat.
- Balanced = chat plus small learning.
- Focused = more learning, but still friendly.
- If child shares address/phone/school/private info, redirect kindly.
- If MIMO fails, mock fallback should answer safely.
- Do not store raw audio.

After run, print final report:

PROJECT=AI_KIDS_BUDDY
MODE=alpha24
RUNNER=OpenCode
EXECUTOR=MIMO_TOKEN_PLAN
REPO=C:\AI_KIDS_BUDDY
MAX_PARALLEL=20
TASKS_TOTAL=
TASKS_PASSED=
TASKS_FAILED=
PATCHES_APPLIED=
WEB_READY=
BACKEND_READY=
VOICE_READY=
PARENT_READY=
MIMO_USED=
BLOCKERS=
NEXT_ACTION=
