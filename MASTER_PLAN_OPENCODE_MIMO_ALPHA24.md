# AI Kids Buddy — OpenCode + MIMO Token Plan Alpha24 Master Plan

## Decision
- No CommandCode.
- OpenCode = local orchestrator/runner.
- MIMO Token Plan = executor/implementer.
- Target repo: `C:\AI_KIDS_BUDDY`.
- `max_parallel=20`, `max_retries=2`.
- Goal: fastest personal-use supervised alpha, not public production.

## Product Goal
Build a Web App where a child age 7/8/9 can talk 1:1 with an AI buddy by text and push-to-talk voice on Xiaomi/Chrome. Parent can set nickname, age, learning goal, and learning/play mode.

## Alpha24 Scope
### Must Have
Frontend:
- `web/index.html`, `web/style.css`, `web/script.js`.
- Mobile-first child chat screen.
- Text chat.
- Push-to-talk voice using browser Web Speech API when available.
- Browser SpeechSynthesis TTS.
- Text fallback.
- Parent PIN/settings screen.
- localStorage for nickname, age, learning goal, mode, short history, daily summary.

Backend:
- FastAPI.
- `GET /health`.
- `POST /chat`.
- MIMO Token Plan backend call only.
- Mock fallback if MIMO fails.
- Basic child-friendly Vietnamese prompt.
- Basic private-info/unsafe redirect.
- CORS for local Web App.

Dev/run:
- `.env.example`.
- `requirements.txt`.
- Windows run scripts.
- Parent guide and manual checklist.

### Removed for Alpha
- Android Kotlin native.
- Full DB.
- Complex parent backend.
- Full safety classifier/red-team.
- SMS/email alert.
- Live call streaming.
- Complex no-secret scanner/test framework.
- Heavy robot animation.

## Alpha Safety Minimum
Because this is personal supervised use, keep safety lightweight:
- API key must stay in backend/env, never frontend.
- No raw audio storage.
- If child shares phone/address/school detail, redirect kindly.
- Bot should suggest telling parent for sadness/fear/bullying.
- Bot answers short Vietnamese suitable for selected age.
- MIMO failure returns safe mock response.

## Architecture
```text
C:\AI_KIDS_BUDDY
  web/
    index.html
    style.css
    script.js
    manifest.json
  backend/
    main.py
    mimo_client.py
    prompts.py
    safety_alpha.py
  scripts/
    run_alpha.ps1
    run_alpha.bat
  docs/
    ALPHA24_PLAN.md
    PARENT_GUIDE.md
    MANUAL_TEST_CHECKLIST.md
  mimo_output/
    opencode_only/mimo_autonomous_runner.py
    runs/
    patches/
    reports/
```

## Runtime Flow
```text
Child text/voice
→ Web App sends /chat payload: message, age, nickname, learning_goal, mode, short_history
→ Backend alpha safety
→ Backend calls MIMO Token Plan
→ Safe fallback if error
→ Web App displays + speaks answer
→ localStorage updates short history/summary
```

## Phases
### Phase A — Skeleton
1. root scaffold
2. backend health/chat skeleton
3. web index
4. web css
5. web js localStorage skeleton
6. run scripts
7. docs/checklist

### Phase B — Chat/MIMO
1. MIMO client
2. `/chat` request/response
3. mock fallback
4. prompt assembly
5. basic private-info redirect
6. CORS

### Phase C — Child UI/Voice
1. chat bubbles
2. push-to-talk
3. Web Speech API STT
4. SpeechSynthesis TTS
5. listening/thinking/speaking state
6. text fallback

### Phase D — Parent Controls
1. PIN
2. age selector 7/8/9
3. learning/play selector Light/Balanced/Focused
4. learning goal
5. reset memory
6. daily summary

### Phase E — Optional PWA/Capacitor
1. manifest
2. icon/splash placeholder
3. offline/error fallback
4. Capacitor stub
5. Xiaomi checklist

## Exit Criteria
- Web opens locally.
- Backend `/health` works.
- Text chat works.
- Push-to-talk works or fallback text works.
- TTS works.
- Parent can set age/goal/mode.
- MIMO call works or fallback works.
- API key is not in frontend.
- Bot replies short and child-friendly.
