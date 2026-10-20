#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "[*] Step 1: Installing Python backend dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "[*] Step 2: Collecting static files for WhiteNoise..."
python manage.py collectstatic --no-input

echo "[*] Step 3: Preparing database migrations (if database is available during build)..."
python manage.py migrate --no-input || echo "[!] Notice: Database not available during build step; migrations will run on service startup."

echo "[+] Backend build phase complete!"
