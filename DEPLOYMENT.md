# OWEB Program Management System (PMS) - Production Deployment Guide for Ubuntu Linux Server

This document describes the step-by-step procedure for deploying the **OWEB Program Management System (PMS)** onto an Ubuntu 22.04 / 24.04 LTS server.

---

## Architecture Overview

- **Frontend**: React (JavaScript/ES6+, JSX, HTML5, CSS3), bundled via Vite into optimized static assets served by Nginx.
- **Backend API**: Python 3.12+ and Django 5.2 with Django REST Framework (DRF) running behind Gunicorn WSGI.
- **Database**: PostgreSQL 16+ with ACID transaction enforcement, connection pooling, and strict schema migrations.
- **Reverse Proxy**: Nginx handling HTTPS/SSL termination, static and media file delivery, rate-limiting, and proxying API traffic to Gunicorn on socket `unix:/run/oweb_pms.sock`.

---

## 1. System Requirements & Package Installation

Update your Ubuntu repositories and install system packages:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv postgresql postgresql-contrib nginx curl git
```

Install Node.js 20 LTS (if building frontend on the server):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 2. PostgreSQL Setup & Database Provisioning

Log in as the postgres user and create the database and user:

```bash
sudo -u postgres psql
```

Execute SQL commands:

```sql
CREATE DATABASE oweb_pms;
CREATE USER oweb_admin WITH PASSWORD 'StrongProductionPasswordHere';
ALTER ROLE oweb_admin SET client_encoding TO 'utf8';
ALTER ROLE oweb_admin SET default_transaction_isolation TO 'read committed';
ALTER ROLE oweb_admin SET timezone TO 'Africa/Addis_Ababa';
GRANT ALL PRIVILEGES ON DATABASE oweb_pms TO oweb_admin;
\q
```

---

## 3. Backend Deployment (Django & DRF)

Clone or deploy the application to `/var/www/oweb-pms`:

```bash
sudo mkdir -p /var/www/oweb-pms
sudo chown -R $USER:$USER /var/www/oweb-pms
cd /var/www/oweb-pms
```

Set up virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

Create environment variables file `/var/www/oweb-pms/backend/.env`:

```env
DJANGO_SECRET_KEY=generate-a-strong-random-50-char-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=pms.oweb.gov.et,127.0.0.1,localhost
DB_NAME=oweb_pms
DB_USER=oweb_admin
DB_PASSWORD=StrongProductionPasswordHere
DB_HOST=localhost
DB_PORT=5432
```

Run database migrations, seed data, and collect static assets:

```bash
cd /var/www/oweb-pms/backend
python manage.py migrate
python seed_data.py
python manage.py collectstatic --noinput
```

---

## 4. Gunicorn Systemd Service

Create a systemd unit file `/etc/systemd/system/oweb_pms.service`:

```ini
[Unit]
Description=Gunicorn daemon for OWEB Program Management System
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/oweb-pms/backend
ExecStart=/var/www/oweb-pms/venv/bin/gunicorn \
          --access-logfile /var/log/gunicorn/access.log \
          --error-logfile /var/log/gunicorn/error.log \
          --workers 4 \
          --bind unix:/run/oweb_pms.sock \
          config.wsgi:application

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Create log directory and start service:

```bash
sudo mkdir -p /var/log/gunicorn
sudo chown -R www-data:www-data /var/log/gunicorn
sudo systemctl daemon-reload
sudo systemctl enable oweb_pms
sudo systemctl start oweb_pms
sudo systemctl status oweb_pms
```

---

## 5. Frontend Production Build

Build the React frontend:

```bash
cd /var/www/oweb-pms
npm install
npm run build
```

This creates the distribution files in `/var/www/oweb-pms/dist/`.

---

## 6. Nginx Configuration

Create Nginx server block `/etc/nginx/sites-available/oweb_pms`:

```nginx
server {
    listen 80;
    server_name pms.oweb.gov.et;

    # Frontend Single Page App
    location / {
        root /var/www/oweb-pms/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Django Admin and API
    location ~ ^/(api|admin) {
        include proxy_params;
        proxy_pass http://unix:/run/oweb_pms.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets (Django Admin & DRF Spectacular)
    location /static/ {
        alias /var/www/oweb-pms/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # User uploaded files / media
    location /media/ {
        alias /var/www/oweb-pms/backend/media/;
        expires 30d;
        add_header Cache-Control "private";
    }

    client_max_body_size 50M;
}
```

Enable site and verify:

```bash
sudo ln -s /etc/nginx/sites-available/oweb_pms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 7. SSL / HTTPS Setup via Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d pms.oweb.gov.et
```

---

## 8. Backup & Maintenance

### Automated Daily PostgreSQL Backup Script (`/usr/local/bin/backup_oweb_db.sh`):

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/oweb_pms"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"
pg_dump -U oweb_admin -h localhost oweb_pms | gzip > "$BACKUP_DIR/oweb_pms_$TIMESTAMP.sql.gz"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -exec rm {} \;
```

Set executable and configure in crontab:

```bash
sudo chmod +x /usr/local/bin/backup_oweb_db.sh
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup_oweb_db.sh
```
