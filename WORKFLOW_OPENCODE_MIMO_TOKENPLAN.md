# AI Kids Buddy — OpenCode + MIMO Token Plan Workflow

## Roles
### OpenCode
- Local orchestrator/runner only.
- Creates/uses `C:\AI_KIDS_BUDDY`.
- Runs `mimo_output/opencode_only/mimo_autonomous_runner.py`.
- Calls MIMO Token Plan.
- Receives JSON patches.
- Applies dry-run, runs minimal smoke checks, applies real patch if pass.
- Retries failed task up to 2 times.
- Saves report.

### MIMO Token Plan
- Sole executor/implementer.
- Implements Web App, backend, prompts, scripts, docs, optional PWA/Capacitor stub.
- Returns strict JSON patches.

## Runner
Path:
```text
mimo_output/opencode_only/mimo_autonomous_runner.py
```

Defaults:
```text
repo_root=C:\AI_KIDS_BUDDY
mode=alpha24
max_parallel=20
max_retries=2
base_url=https://token-plan-sgp.xiaomimimo.com/v1
model=MiMo-V2.5-Pro
key_env=MIMO_TOKEN_PLAN_KEY or MIMO_API_KEY
```

## MIMO Patch Contract
```json
{
  "task_id": "alpha_backend_chat",
  "summary": "short summary",
  "files": [
    {"path": "backend/main.py", "action": "create_or_replace", "content": "full file content"}
  ],
  "smoke_checks": ["python -m py_compile backend/main.py"],
  "notes": ["..."]
}
```
Only `create_or_replace` is allowed in Alpha24.

## Allowed Paths
- `web/**`
- `backend/**`
- `scripts/**`
- `docs/**`
- `mimo_output/reports/**`
- `mimo_output/patches/**`
- `.env.example`
- `.gitignore`
- `requirements.txt`
- `package.json`
- `capacitor/**`

Blocked:
- `.env`
- `AI_2026`
- `AI_GAME`
- paths outside `C:\AI_KIDS_BUDDY`
- destructive scripts
- frontend API key usage

## Stop Conditions
- Missing MIMO key.
- MIMO unreachable after retries.
- Invalid JSON after 2 retries.
- Patch outside allowlist.
- Dry-run/smoke check failure after 2 retries.
- Patch touches AI_2026/AI_GAME.

## Final Report
```text
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
```
