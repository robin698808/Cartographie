FROM python:3.12-slim

WORKDIR /app

# libpq pour psycopg2 (PostgreSQL)
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Un seul worker : l'état WebSocket (présence, broadcast) est en mémoire process.
# Plusieurs workers casseraient la collaboration temps réel.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
