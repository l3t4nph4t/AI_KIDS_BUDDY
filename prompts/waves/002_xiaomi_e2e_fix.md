Patch C:\AI_KIDS_BUDDY only. Token-save mode.

Goal: fix Xiaomi E2E blockers only after Wave 001.
Allowed files only: web/script.js, web/index.html, web/style.css, scripts/smoke_check.ps1, docs/XIAOMI_LAN_TEST.md.
Do not touch backend unless bug proves backend-side. Do not full rebuild. Do not touch C:\AI_2026 or C:\AI_GAME. Do not print env/key.

Fix only: API_BASE wrong, http/https confusion, unclear backend error, mobile parent settings issue, quick buttons not sending, text/voice fallback issue.
Run smoke_check only.
Return only: FILES_CHANGED= TESTS= RESULT= NEXT_MANUAL_TEST=
