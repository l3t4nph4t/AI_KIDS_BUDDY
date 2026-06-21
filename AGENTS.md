# AI Kids Buddy — Agent Runbook

Shared context for all agents (Claude, Codex, etc.). Read this at the start of every session.

---

## 1. Project Overview

- **App**: AI Kids Buddy — học tập cho trẻ tiểu học Việt Nam lớp 1–5 (bộ sách Kết nối tri thức)
- **Stack**: FastAPI Python 3.11 backend + Vanilla JS/HTML5 frontend
- **Data root**: `backend/data/` — curriculum JSON + lesson PDFs + source SGK

---

## 2. Infrastructure

```
Dokploy v0.29.4 (Docker Swarm + Traefik)   host.vnggames.ai  (IP: 103.245.249.96)

App URL:     http://kid.103.245.249.96.nip.io   (HTTP, no VPN needed)
Dokploy UI:  https://host.vnggames.ai            (no VPN needed)
GitHub repo: https://github.com/l3t4nph4t/AI_KIDS_BUDDY   (no VPN needed)

Dokploy App IDs:
  applicationId: 9Fjk27N6CJKvHCYCZEiB9
  projectId:     i2xk6sdnkfXDE58kE6Ccw
  envId:         ZYo-abh8kJ6aoafKDa6Oz

Docker named volume: phatlt2-aikidsbuddy-mmjgoa_vyvy-sgk-data
  → container mount: /app/backend/data/source_sgk
```

---

## 3. Deploy Flow

### Normal deploy (no VPN needed)

> **IMPORTANT — Use the clean GitHub working repo only.**
> `C:\AI_KIDS_BUDDY` contains the old GitLab full-history branch (150+ commits, different orphan lineage from GitHub).
> Do NOT run `git push` from `C:\AI_KIDS_BUDDY` master — it will conflict with GitHub's clean orphan lineage.
> Use `C:\AI_KIDS_BUDDY_GITHUB` (cloned from GitHub) for all GitHub/Dokploy deployment work.

```bash
# 1. Push to GitHub — Dokploy Autodeploy triggers automatically on push
# Working folder: C:\AI_KIDS_BUDDY_GITHUB
git push origin master

# 2. Or trigger manually via Dokploy UI:
#    https://host.vnggames.ai → project → application → Deploy button
#
# OR via browser JS console at https://host.vnggames.ai:
fetch('/api/trpc/application.deploy?batch=1', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({"0": {"json": {"applicationId": "9Fjk27N6CJKvHCYCZEiB9"}}})
}).then(r=>r.json()).then(d=>console.log(d))

# 3. Monitor status (browser JS):
fetch('/api/trpc/deployment.all?batch=1&input=' +
  encodeURIComponent(JSON.stringify({"0":{"json":{"applicationId":"9Fjk27N6CJKvHCYCZEiB9","limit":3}}})))
  .then(r=>r.json()).then(d=>console.log(d[0].result.data.json.map(i=>i.status+' | '+i.title)))
```

### Emergency patch (no git push available)

When git push is unavailable, use Dokploy Patches to inject a file directly into the build:

```js
// In browser console at https://host.vnggames.ai
fetch('/api/trpc/patch.create?batch=1', {method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify({"0":{"json":{"applicationId":"9Fjk27N6CJKvHCYCZEiB9","path":"/app/backend/file.py","content":"..."}}})}
).then(r=>r.json()).then(d=>console.log(d))
```

**Always delete the patch after pushing the real commit** — patches are applied on top of git state and will persist across deploys until removed.

### Known gotchas

| Issue | Detail |
|-------|--------|
| Large PDF commits | GitHub accepts up to 100 MB per file; no batching needed for code — only avoid committing PDFs to git at all (use Docker volume instead) |
| Autodeploy webhook | Dokploy GitHub App `Dokploy-2026-06-21-mlwjn7` must remain installed on `l3t4nph4t/AI_KIDS_BUDDY` for auto-trigger to work |

---

## 4. Upload Files to Docker Volume (SGK PDFs)

Source SGK PDFs live in the Docker volume (`/app/backend/data/source_sgk`) — they are NOT in git.

### DO NOT use PowerShell for Vietnamese filenames

`System.Net.Http.MultipartFormDataContent` encodes filenames as RFC 2047 (`=?utf-8?B?...?=`), causing files to be saved with garbled names on the server.

### Use Python requests

```python
import requests, os

url = "http://kid.103.245.249.96.nip.io/admin/upload-sgk"
token = "VYVY_SGK_2026"
folder = "C:/path/to/sgk_pdfs"

for fname in sorted(os.listdir(folder)):
    if not fname.endswith(".pdf"):
        continue
    with open(f"{folder}/{fname}", "rb") as f:
        r = requests.post(url, params={"token": token},
                          files={"file": (fname, f, "application/pdf")})
    print(fname, "→", r.json())
```

### Workflow to add new SGK

1. Add temp upload endpoint to `backend/main.py` (see commit `b24a8a1` as reference)
2. Ensure `python-multipart` is in `requirements.txt` (FastAPI UploadFile dependency)
3. Commit + push + deploy
4. Run Python upload script
5. Remove temp endpoint, commit + push + deploy again

---

## 5. Push Large PDF Batches to GitHub

GitHub has no server-side HTTP size limit (unlike the old GitLab). Push normally:

```bash
git add backend/data/lesson_pdfs/grade_5/
git commit -m "feat: add grade 5 PDFs"
git push github master
```

If pushing many large files at once, use `scripts/push_grade5_pdfs.sh` which batches 5–8 files per commit to keep individual pack sizes manageable.

> **Note:** `lesson_pdfs/` PDFs belong in git (they are split lesson files). `source_sgk/` PDFs do NOT go in git — they live in the Docker named volume only.

---

## 6. Curriculum Data Structure

```
backend/data/curriculum/grade_{1..5}/
  books.json                — sách giáo khoa (book_id, subject, title, term)
  lessons.json              — bài học (lesson_id maps to PDF filename suffix)
  daily_learning_units.json — daily learning units (unit_id, grade, subject, lesson_id)
  lesson_content.json       — AI "Giải thích" content (100% complete, Grade 1–5)
  lesson_content_sgk.json   — AI "Hướng dẫn đọc sách" SGK-grounded content (100% complete, G1–5)

backend/data/lesson_pdfs/grade_{1..5}/
  {book_id}_L{NNN}.pdf      — individual lesson PDF (split from source SGK)
  Grade 5: 309 files (complete as of 2026-06-15)

backend/data/source_sgk/grade_5/   ← Docker volume, NOT in git
  10 source SGK PDF files (Grade 5 only)
```

**Anomaly — Grade 4 Tiếng Việt:** 190 units (tiết/period granularity) vs 66 units in other grades (bài/lesson granularity). `ai_task_mode: guided_practice` instead of `reading_writing_practice`. This is intentional.

**Grade 5 subject count:** 7 subjects (290 units). Missing vs Grade 3/4: hoat_dong_trai_nghiem, giao_duc_the_chat, tu_nhien_xa_hoi, mi_thuat, tin_hoc, khoa_hoc. New subjects: cong_nghe, dao_duc.

---

## 7. Environment (.env — NEVER commit)

```
MIMO_TOKEN_PLAN_KEY=...       # Gemini API key for lesson content generation
MIMO_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
MIMO_MODEL=gemini-1.5-flash
```

---

## 8. Local Dev

See `docs/RUNBOOK.md` for local development setup (uvicorn, port, hot-reload, etc.).

---

## 9. Useful Scripts

| Script | Purpose |
|--------|---------|
| `scripts/push_grade5_pdfs.sh` | Batch-push PDF files to GitHub (5–8 per commit) |
| `scripts/build_unit_table.py` | Analyze curriculum: count units/lessons/PDFs per grade×subject |
