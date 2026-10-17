@echo off
title OWEB Program Management System - Stop Servers
color 0C
echo ===============================================================================
echo             Stopping OWEB Program Management System Servers
echo ===============================================================================
echo.

echo Terminating running Python/Django processes on port 8001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001 ^| findstr LISTENING') do (
    echo Killing PID %%a on port 8001...
    taskkill /F /PID %%a >nul 2>&1
)

echo Terminating running Node/Vite processes on port 3002...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002 ^| findstr LISTENING') do (
    echo Killing PID %%a on port 3002...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [OK] All OWEB PMS servers have been stopped.
echo ===============================================================================
timeout /t 3 >nul
