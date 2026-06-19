# AI Kids Buddy

Ứng dụng học tập cho trẻ tiểu học Việt Nam lớp 1–5, bộ sách **Kết nối tri thức** (KNTT).

## Stack

- **Backend**: FastAPI Python 3.11
- **Frontend**: Vanilla JS / HTML5 (no build step)
- **Curriculum**: JSON data + AI-generated lesson content (Grades 1–5, complete)
- **PDF Reader**: PDF.js, per-lesson SGK page crops

## Quick Start (local)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000
```

## Lesson PDFs

Lesson PDFs (`backend/data/lesson_pdfs/`) are **not stored in this repo** — they are large binary files (~12 GB total) managed separately.

**In production (Dokploy):** mounted as a Docker named volume at `/app/backend/data/lesson_pdfs`.

**In local dev:** either:
- Copy PDFs manually into `backend/data/lesson_pdfs/grade_N/`
- Or set the `LESSON_PDFS_DIR` env var to point to an existing PDF directory

```bash
export LESSON_PDFS_DIR=/path/to/lesson_pdfs
```

## Deploy

Deployed via **Dokploy v0.29.4** (Docker Swarm + Traefik) at `host.vnggames.ai`.

See [AGENTS.md](AGENTS.md) for full infra details, deploy flow, and upload workflow.

## Curriculum Data

```
backend/data/curriculum/grade_{1..5}/
  books.json                — sách giáo khoa
  lessons.json              — bài học
  daily_learning_units.json — đơn vị học theo ngày
  lesson_content.json       — AI content "Giải thích"
  lesson_content_sgk.json   — AI content "Hướng dẫn đọc sách"
```
