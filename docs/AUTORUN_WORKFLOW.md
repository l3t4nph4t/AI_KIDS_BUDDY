# Auto-Run Operating Workflow

Loop:
1. ChatGPT chooses next wave.
2. User runs auto-run prepare.
3. Script copies prompt to clipboard and opens OpenCode if requested.
4. User pastes prompt into OpenCode.
5. OpenCode/MIMO executes.
6. User runs auto-run collect.
7. User sends FINAL_HANDOFF.txt to ChatGPT.
8. ChatGPT decides: commit / fix / next wave / test.

Token policy:
- Use MIMO for larger waves: UI polish, persona, curriculum, APK, content.
- Do not use MIMO for small deterministic bugs: selector, port, encoding, one-line JS.
