FROM python:3.11-slim

# ffmpeg for audio extraction, curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Persist videos and database outside the container image.
VOLUME ["/app/videos", "/app/data"]

EXPOSE 8765

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -sf http://localhost:8765/api/health || exit 1

CMD ["python", "-m", "src.main", "config.yaml"]
