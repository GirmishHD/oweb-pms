#!/usr/bin/env bash
set -e

echo "[*] Applying database migrations..."
python manage.py migrate --no-input

echo "[*] Seeding administrative master data and verifying admin account..."
python seed_data.py

echo "[*] Starting Gunicorn server on port ${PORT:-8000}..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120
