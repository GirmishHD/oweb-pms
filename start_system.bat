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
sc query postgresql-x64-16 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] PostgreSQL service detected.
) else (
    echo [INFO] Ensuring PostgreSQL is running...
    net start postgresql-x64-16 >nul 2>&1
)

:: 2. Launch Django Backend
echo [2/3] Launching Django REST Framework backend on http://localhost:8000 ...
start "OWEB PMS - Backend Server" cmd /k "cd /d %~dp0backend && title OWEB PMS Backend (Port 8000) && color 0A && echo Starting Django REST API... && python manage.py runserver 8000"

:: Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

:: 3. Launch React Frontend
echo [3/3] Launching React Vite Frontend on http://localhost:5173 ...
start "OWEB PMS - Frontend UI" cmd /k "cd /d %~dp0frontend && title OWEB PMS Frontend (Port 5173) && color 0E && echo Starting React Vite UI... && npm run dev"

:: Wait 4 seconds for frontend dev server
timeout /t 4 /nobreak >nul

:: Open default browser to the system
echo Opening application in your default browser...
start http://localhost:5173

echo.
echo ===============================================================================
echo  OWEB PMS is now running!
echo  - Frontend URL : http://localhost:5173
echo  - Backend API  : http://localhost:8000/api/
echo  - Swagger Docs : http://localhost:8000/api/docs/
echo.
echo  Default Credentials:
echo    Username: admin
echo    Password: password
echo ===============================================================================
echo Press any key to close this launcher window (servers will remain running).
pause >nul
