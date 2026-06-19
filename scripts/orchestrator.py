"""
Claude Orchestrator — calls MIMO Token Plan to implement waves A-Z.
Supports parallel MIMO calls (Phase 1) + sequential apply (Phase 2).

Usage:
  python scripts/orchestrator.py [wave_id] [--dry-run-only]
"""

import json
import os
import re
import shutil
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

try:
    import requests
except ImportError:
    print("[ERROR] requests not installed. Run: pip install requests")
    sys.exit(1)

ROOT = Path(__file__).parent.parent
MIMO_ENV_FILE = ROOT / ".local" / "mimo.env"
ORCHESTRATION_DIR = ROOT / "orchestration"
DRYRUN_DIR = ORCHESTRATION_DIR / "patches" / "dryrun"
APPLIED_DIR = ORCHESTRATION_DIR / "patches" / "applied"
REPORTS_DIR = ORCHESTRATION_DIR / "reports" / "runs"
TASKPACKS_DIR = ORCHESTRATION_DIR / "taskpacks" / "generated"

FORBIDDEN_PATTERNS = [
    "MIMO_TOKEN_PLAN_KEY=",
    "MIMO_API_KEY=",
    "Bearer sk-",
    "C:\\AI_2026",
    "C:\\AI_GAME",
    "C:/AI_2026",
    "C:/AI_GAME",
]


# ── Env ───────────────────────────────────────────────────────────────────────

def load_mimo_env() -> dict:
    if not MIMO_ENV_FILE.exists():
        raise FileNotFoundError(
            f"Missing {MIMO_ENV_FILE}\n"
            "Create it from .local/mimo.env.example and set your MIMO key."
        )
    env = {}
    with MIMO_ENV_FILE.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env


def print_safe_config(env: dict):
    key_present = "yes" if env.get("MIMO_TOKEN_PLAN_KEY") else "no"
    print(f"MIMO_KEY_PRESENT={key_present}")
    print(f"MIMO_MODEL={env.get('MIMO_MODEL', '???')}")
    print(f"MIMO_BASE_URL={env.get('MIMO_BASE_URL', '???')}")


# ── MIMO API ──────────────────────────────────────────────────────────────────

def call_mimo(env: dict, system_prompt: str, user_prompt: str) -> str:
    key = env.get("MIMO_TOKEN_PLAN_KEY", "")
    if not key:
        raise ValueError("MIMO_TOKEN_PLAN_KEY not set")
    base_url = env.get("MIMO_BASE_URL", "https://token-plan-sgp.xiaomimimo.com/v1")
    model = env.get("MIMO_MODEL", "MiMo-V2.5-Pro")
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "max_tokens": 8192,
        "temperature": 0.1,
    }
    resp = requests.post(
        f"{base_url}/chat/completions",
        headers=headers, json=payload, timeout=180
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


# ── Prompt builder ────────────────────────────────────────────────────────────

def build_user_prompt(task: dict, root: Path, use_current_files: bool = True) -> str:
    parts = []
    if use_current_files:
        for cf in task.get("context_files", []):
            cf_path = root / cf
            if cf_path.exists():
                content = cf_path.read_text(encoding="utf-8", errors="replace")
                parts.append(
                    f"--- CURRENT CONTENT OF {cf} (read from repo) ---\n"
                    f"{content}\n"
                    f"--- END OF {cf} ---"
                )
    parts.append(task["prompt"])
    return "\n\n".join(parts)


def build_system_prompt(wave_spec: dict, allowed_paths: set) -> str:
    paths_list = "\n".join(f"  - {p}" for p in sorted(allowed_paths))
    return f"""You are MIMO Token Plan — expert code implementer for AI Kids Buddy.

Project:
- Vietnamese web app for children (7-9 years old)
- AI buddy persona: VyVy, age 8, friendly child companion (NOT tutor, NOT adult AI)
- Stack: FastAPI backend (Python), vanilla JS/HTML/CSS frontend, uvicorn

Rules:
- ONLY modify files from this allowlist:
{paths_list}
- Max {wave_spec.get('max_files_changed', 9)} files per patch
- Do NOT include API keys, secrets, or credentials in any file
- Return ONLY valid JSON — no explanation text, no markdown fences

Output format:
{{
  "task_id": "task-id-here",
  "summary": "one-line description",
  "files": [
    {{
      "path": "relative/path/to/file",
      "action": "create_or_replace",
      "content": "COMPLETE file content — not a diff, not a snippet"
    }}
  ],
  "tests": [],
  "notes": []
}}"""


# ── Patch helpers ─────────────────────────────────────────────────────────────

def extract_json_patch(raw: str) -> dict | None:
    text = raw.strip()
    # Strip markdown fences anywhere in text
    text = re.sub(r'```(?:json)?\s*', '', text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass
    return None


def validate_patch(patch: dict, allowed_paths: set) -> list:
    errors = []
    for fe in patch.get("files", []):
        path = fe.get("path", "")
        content = fe.get("content", "")
        if path not in allowed_paths:
            errors.append(f"Path not allowed: {path}")
            continue
        for pattern in FORBIDDEN_PATTERNS:
            if pattern in content:
                errors.append(f"Forbidden pattern in {path}: {pattern}")
    return errors


def apply_patch_to_dir(patch: dict, target_dir: Path):
    for fe in patch.get("files", []):
        path = fe["path"]
        content = fe.get("content", "")
        action = fe.get("action", "create_or_replace")
        dest = target_dir / Path(path)
        dest.parent.mkdir(parents=True, exist_ok=True)
        if action == "delete":
            if dest.exists():
                dest.unlink()
        else:
            dest.write_text(content, encoding="utf-8")


def create_dryrun_copy(task_id: str) -> Path:
    DRYRUN_DIR.mkdir(parents=True, exist_ok=True)
    copy_dir = DRYRUN_DIR / task_id
    if copy_dir.exists():
        shutil.rmtree(copy_dir)
    copy_dir.mkdir(parents=True)
    for subdir in ["web", "backend", "scripts", "docs", "reports"]:
        src = ROOT / subdir
        if src.exists():
            shutil.copytree(str(src), str(copy_dir / subdir))
    for fname in ["requirements.txt"]:
        src = ROOT / fname
        if src.exists():
            shutil.copy2(str(src), str(copy_dir / fname))
    return copy_dir


def save_applied_patch(patch: dict, task_id: str):
    APPLIED_DIR.mkdir(parents=True, exist_ok=True)
    ts = time.strftime("%Y%m%d_%H%M%S")
    out = APPLIED_DIR / f"{task_id}_{ts}.json"
    with out.open("w", encoding="utf-8") as f:
        json.dump(patch, f, indent=2, ensure_ascii=False)


def save_raw_output(task_id: str, raw: str):
    TASKPACKS_DIR.mkdir(parents=True, exist_ok=True)
    ts = time.strftime("%Y%m%d_%H%M%S")
    out = TASKPACKS_DIR / f"{task_id}_{ts}_raw.txt"
    out.write_text(raw, encoding="utf-8")


# ── Smoke test ────────────────────────────────────────────────────────────────

def run_smoke_check(cwd: Path, mimo_key: str) -> tuple:
    env = os.environ.copy()
    env["MIMO_TOKEN_PLAN_KEY"] = mimo_key
    result = subprocess.run(
        ["powershell", "-ExecutionPolicy", "Bypass", "-File", "scripts/smoke_check.ps1"],
        cwd=str(cwd), capture_output=True, text=True, timeout=90, env=env,
    )
    return result.returncode == 0, result.stdout + result.stderr


# ── Phase 1: Parallel MIMO fetch ──────────────────────────────────────────────

def fetch_patch_for_task(task: dict, env: dict, system_prompt: str, root: Path) -> dict:
    task_id = task["id"]
    user_prompt = build_user_prompt(task, root, use_current_files=True)
    try:
        raw = call_mimo(env, system_prompt, user_prompt)
        save_raw_output(task_id, raw)
        patch = extract_json_patch(raw)
        return {
            "task_id": task_id,
            "patch": patch,
            "user_prompt": user_prompt,
            "error": None if patch else "JSON parse failed",
        }
    except Exception as e:
        return {"task_id": task_id, "patch": None, "user_prompt": user_prompt, "error": str(e)}


def fetch_all_patches_parallel(tasks: list, env: dict, system_prompt: str, root: Path) -> dict:
    max_workers = min(int(env.get("MIMO_MAX_PARALLEL", 10)), len(tasks))
    print(f"[Phase 1] Firing {len(tasks)} MIMO calls with {max_workers} parallel workers...")
    results = {}
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(fetch_patch_for_task, t, env, system_prompt, root): t
            for t in tasks
        }
        done = 0
        for future in as_completed(futures):
            result = future.result()
            results[result["task_id"]] = result
            done += 1
            status = "OK" if result["patch"] else "FAIL"
            print(f"  [{done}/{len(tasks)}] {result['task_id']} → {status}")
    return results


# ── Phase 2: Sequential apply ─────────────────────────────────────────────────

def process_task(
    task: dict,
    patch_result: dict,
    env: dict,
    system_prompt: str,
    allowed_paths: set,
    max_retries: int,
    dry_run_only: bool,
) -> dict:
    task_id = task["id"]
    patch = patch_result.get("patch")
    user_prompt = patch_result.get("user_prompt", task["prompt"])
    last_error = patch_result.get("error", "")

    for attempt in range(1, max_retries + 2):
        if attempt > 1:
            print(f"  [Retry {attempt-1}/{max_retries}] Calling MIMO again...")
            retry_prompt = (
                f"Previous attempt failed:\n{last_error}\n\n"
                f"Fix the issues and return the corrected JSON patch.\n\n"
                + build_user_prompt(task, ROOT, use_current_files=True)
            )
            try:
                raw = call_mimo(env, system_prompt, retry_prompt)
                save_raw_output(f"{task_id}_retry{attempt-1}", raw)
                patch = extract_json_patch(raw)
                if not patch:
                    last_error = "JSON parse failed on retry"
                    continue
            except Exception as e:
                last_error = str(e)
                print(f"  [ERROR] Retry MIMO call failed: {e}")
                if attempt > max_retries:
                    break
                continue

        if not patch:
            if attempt > max_retries:
                break
            continue

        errors = validate_patch(patch, allowed_paths)
        if errors:
            last_error = f"Validation: {errors}"
            print(f"  [WARN] {last_error}")
            if attempt <= max_retries:
                continue
            break

        dryrun_dir = create_dryrun_copy(task_id)
        apply_patch_to_dir(patch, dryrun_dir)

        if dry_run_only:
            files_changed = [fe["path"] for fe in patch.get("files", [])]
            print(f"  [DRY-RUN] Patch valid for: {files_changed}")
            return {"task_id": task_id, "success": True, "error": "", "files": files_changed}

        print(f"  [Smoke check on dry-run copy]")
        passed, output = run_smoke_check(dryrun_dir, env.get("MIMO_TOKEN_PLAN_KEY", ""))

        if passed:
            apply_patch_to_dir(patch, ROOT)
            save_applied_patch(patch, task_id)
            files_changed = [fe["path"] for fe in patch.get("files", [])]
            print(f"  [PASS] Applied: {files_changed}")
            return {"task_id": task_id, "success": True, "error": "", "files": files_changed}
        else:
            tail = output[-500:] if len(output) > 500 else output
            last_error = f"Smoke check failed:\n{tail}"
            print(f"  [FAIL] Smoke check")
            print(f"  Tail:\n{tail}")
            if attempt <= max_retries:
                continue
            break

    return {"task_id": task_id, "success": False, "error": last_error[:400], "files": []}


# ── Report ────────────────────────────────────────────────────────────────────

def write_report(wave_id: str, results: list, env: dict, dry_run_only: bool):
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    ts = time.strftime("%Y%m%d_%H%M%S")

    passed = sum(1 for r in results if r["success"])
    failed = len(results) - passed
    all_files = []
    for r in results:
        all_files.extend(r.get("files", []))

    status = (
        "DRY_RUN_ONLY" if dry_run_only
        else "PASS" if failed == 0
        else "PARTIAL" if passed > 0
        else "FAIL"
    )

    lines = [
        f"WAVE={wave_id}",
        f"STATUS={status}",
        f"MIMO_USED={env.get('MIMO_MODEL', '???')}",
        f"TASKS_TOTAL={len(results)}",
        f"TASKS_PASSED={passed}",
        f"TASKS_FAILED={failed}",
        f"FILES_CHANGED={', '.join(all_files) if all_files else 'none'}",
        "",
        "TASK_RESULTS:",
    ]
    for r in results:
        icon = "OK  " if r["success"] else "FAIL"
        lines.append(f"  [{icon}] {r['task_id']}")
        if not r["success"] and r.get("error"):
            snippet = r["error"][:200].replace("\n", " ")
            lines.append(f"         error: {snippet}")

    lines += [
        "",
        f"COMMIT_RECOMMENDATION={'yes' if status == 'PASS' else 'no'}",
        f"NEXT_ACTION={'git add specific files + commit, then test on Xiaomi' if status == 'PASS' else 'review failures, re-run failed tasks'}",
        f"RUN_TIME={ts}",
    ]

    report = "\n".join(lines)
    print(f"\n{'='*60}")
    print(report)
    print(f"{'='*60}")

    out = REPORTS_DIR / f"{wave_id}_{ts}.txt"
    out.write_text(report, encoding="utf-8")
    print(f"\nReport saved: {out}\n")


# ── Main ──────────────────────────────────────────────────────────────────────

def run_wave(wave_id: str, dry_run_only: bool = False):
    print(f"\n{'='*60}")
    print(f"  Claude Orchestrator — Wave {wave_id}")
    if dry_run_only:
        print(f"  Mode: DRY-RUN ONLY")
    print(f"{'='*60}\n")

    env = load_mimo_env()
    print_safe_config(env)
    print()

    if not env.get("MIMO_TOKEN_PLAN_KEY"):
        print("[STOP] MIMO_TOKEN_PLAN_KEY missing")
        sys.exit(1)

    wave_json = ORCHESTRATION_DIR / "waves" / f"{wave_id}.json"
    if not wave_json.exists():
        print(f"[STOP] Wave spec not found: {wave_json}")
        sys.exit(1)

    with wave_json.open(encoding="utf-8") as f:
        wave_spec = json.load(f)

    allowed_paths = set(wave_spec.get("allowed_files", []))
    tasks = wave_spec.get("tasks", [])
    max_retries = int(wave_spec.get("max_retries", env.get("MIMO_MAX_RETRIES", 2)))

    print(f"Tasks: {len(tasks)}  |  Allowed files: {len(allowed_paths)}  |  Max retries: {max_retries}")
    print()

    system_prompt = build_system_prompt(wave_spec, allowed_paths)

    # Phase 1: parallel MIMO fetch
    initial_patches = fetch_all_patches_parallel(tasks, env, system_prompt, ROOT)
    print()

    # Phase 2: sequential apply
    print("[Phase 2] Validating and applying patches in order...")
    results = []
    for task in tasks:
        task_id = task["id"]
        patch_result = initial_patches.get(task_id, {"patch": None, "error": "not fetched", "user_prompt": ""})
        print(f"\n{'─'*55}")
        print(f"Task: {task_id}  —  {task.get('description', '')}")

        result = process_task(
            task, patch_result, env, system_prompt,
            allowed_paths, max_retries, dry_run_only
        )
        results.append(result)
        print(f"  STATUS={'OK' if result['success'] else 'FAIL'}")

    write_report(wave_id, results, env, dry_run_only)
    failed = sum(1 for r in results if not r["success"])
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    wave_id = "001_vyvy_lan_ui"
    dry_run_only = False
    for arg in sys.argv[1:]:
        if arg == "--dry-run-only":
            dry_run_only = True
        elif not arg.startswith("-"):
            wave_id = arg
    run_wave(wave_id, dry_run_only)
