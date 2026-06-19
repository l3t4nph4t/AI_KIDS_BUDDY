Patch C:\AI_KIDS_BUDDY only. Token-save mode.

Role:
- OpenCode orchestrates.
- MIMO implements only this small patch if needed.
- Do not run full rebuild.
- Do not touch C:\AI_2026 or C:\AI_GAME.
- Do not read mimo_output/runs.
- Do not print env/key.

Goal:
One small patch for VyVy persona + LAN backend wiring + UI/UX text.

Allowed files only:
web/script.js
web/index.html
web/style.css
backend/prompts.py
scripts/run_lan.ps1
scripts/smoke_check.ps1
docs/XIAOMI_LAN_TEST.md

Max changed files: 7.

Required changes:
1. Rename AI buddy identity to VyVy.
- VyVy is 8 years old.
- VyVy is a friendly peer/friend for the child.
- VyVy is not a strict tutor, not an adult assistant.
- Tone: warm, playful, simple Vietnamese, supportive.
- Replies: 1–4 short child-friendly sentences.
- Learning is light and only when appropriate.

2. UI text:
- Title: “VyVy — bạn AI của con”
- Subtitle: “Nói chuyện, kể chuyện, chơi đố vui và học nhẹ cùng VyVy”
- Placeholder: “Nhắn cho VyVy…”
- Opening: “Chào bạn, mình là VyVy. Hôm nay tụi mình nói chuyện gì vui nhỉ?”
- Backend error: “VyVy chưa kết nối được Buddy server. Bố mở backend port 8010 giúp con nhé.”

3. Quick buttons:
- “Nói chuyện với VyVy”
- “VyVy kể chuyện”
- “Đố vui cùng VyVy”
- “Học tiếng Anh nhẹ”
- “Toán vui cùng VyVy”

4. backend/prompts.py:
Set persona: name VyVy, age 8, friendly child companion, Vietnamese default, short replies, playful/supportive tone, not teacher-like, do not open with “Hôm nay con muốn học bài gì?”

5. LAN API fix in web/script.js:
Use exactly one backend base:
const API_BASE = `http://${window.location.hostname}:8010`;
All backend calls must use `${API_BASE}/health` and `${API_BASE}/chat`.
Remove/replace: fetch('/health'), fetch('/chat'), localhost, 127.0.0.1 backend URL.
Payload field remains: text

6. Add scripts/run_lan.ps1 with clear backend/web commands.
7. Update smoke_check.ps1 for VyVy + API_BASE + py_compile.
8. Add docs/XIAOMI_LAN_TEST.md with short E2E checklist.

After patch run only:
powershell -ExecutionPolicy Bypass -File .\scripts\smoke_check.ps1

Return only:
FILES_CHANGED=
TESTS=
RESULT=
NEXT_MANUAL_TEST=
