#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "[*] Step 1: Installing Python backend dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "[*] Step 2: Collecting static files for WhiteNoise..."
python manage.py collectstatic --no-input

echo "[*] Step 3: Applying database migrations..."
python manage.py migrate --no-input

echo "[*] Step 4: Seeding official administrative hierarchy and master data..."
python seed_data.py

echo "[+] OWEB PB-PMS backend build and initialization complete!"
