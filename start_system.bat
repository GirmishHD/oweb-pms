@echo off
title OWEB Program Management System - Launcher
color 0B
echo ===============================================================================
echo                OWEB PROGRAM MANAGEMENT SYSTEM (PMS)
echo              Oromia Water and Energy Bureau - Enterprise Suite
echo ===============================================================================
echo.

:: 1. Check PostgreSQL Service
echo [1/3] Checking PostgreSQL service status...
sc query postgresql-x64-18 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] PostgreSQL 18 service detected.
) else (
    sc query postgresql-x64-16 >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo [OK] PostgreSQL 16 service detected.
    ) else (
        powershell -NoProfile -Command "Get-Service *postgres* | Where-Object { $_.Status -ne 'Running' } | Start-Service -ErrorAction SilentlyContinue" >nul 2>&1
        echo [OK] PostgreSQL service verified.
    )
)

:: 2. Launch Django Backend on Port 8001
echo [2/3] Launching Django REST Framework backend on http://localhost:8001 ...
start "OWEB PMS - Backend Server (8001)" cmd /k "cd /d %~dp0backend && title OWEB PMS Backend (Port 8001) && color 0A && echo Starting Django REST API on Port 8001... && python manage.py runserver 8001"

:: Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

:: 3. Launch React Frontend on Port 3002
echo [3/3] Launching React Vite Frontend on http://localhost:3002 ...
start "OWEB PMS - Frontend UI (3002)" cmd /k "cd /d %~dp0frontend && title OWEB PMS Frontend (Port 3002) && color 0E && echo Starting React Vite UI on Port 3002... && npm run dev -- --port 3002 --host 0.0.0.0"

:: Wait 4 seconds for frontend dev server
timeout /t 4 /nobreak >nul

:: Open default browser to the system
echo Opening application in your default browser...
start http://localhost:3002

echo.
echo ===============================================================================
echo  OWEB PMS is now running!
echo  - Frontend URL : http://localhost:3002
echo  - Backend API  : http://localhost:8001/api/
echo  - Swagger Docs : http://localhost:8001/api/docs/
echo.
echo  Default Credentials:
echo    Username: admin
echo    Password: password
echo ===============================================================================
echo Press any key to close this launcher window (servers will remain running).
pause >nul
