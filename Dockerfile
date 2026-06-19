FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY web/ ./web/

RUN mkdir -p /data

EXPOSE 8080

CMD ["sh", "-c", "python -c 'from backend.main import app; print(\"Import OK\")' && uvicorn backend.main:app --host 0.0.0.0 --port 8080"]
