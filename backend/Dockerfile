FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Matches the docker-compose.yml bind mount (./backend:/app) at the repo root.
WORKDIR /app

# build-essential/libpq-dev are a safety net for any dependency that lacks a
# prebuilt wheel for the target platform (psycopg is installed via its
# [binary] extra, so this is normally not required, but keeps the build
# resilient across platforms).
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

COPY . .

# Ensure the upload directory exists even before docker-compose's named
# volume (uploads:/app/uploads) is mounted over it.
RUN mkdir -p /app/uploads

EXPOSE 8000

# docker-compose.yml overrides this with its own `command:` (alembic upgrade
# head && uvicorn --reload) for local development. This CMD is what runs when
# the image is used standalone (e.g. `docker run`, or in a production compose
# file without the dev bind mount / --reload flag).
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
