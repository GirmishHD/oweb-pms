# OWEB Program Management System - PowerShell Launcher
$Host.UI.RawUI.WindowTitle = "OWEB PMS Launcher"
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "                OWEB PROGRAM MANAGEMENT SYSTEM (PMS)" -ForegroundColor White
Write-Host "              Oromia Water and Energy Bureau - Enterprise Suite" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = $PSScriptRoot

# 1. Check PostgreSQL
Write-Host "[1/3] Checking PostgreSQL service..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -ne 'Running') {
    Write-Host "Starting PostgreSQL service..." -ForegroundColor Gray
    Start-Process -FilePath "net" -ArgumentList "start $($pgService.Name)" -Verb RunAs -Wait
}
Write-Host "[OK] PostgreSQL ready." -ForegroundColor Green

# 2. Launch Backend
Write-Host "[2/3] Launching Django REST backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootPath\backend'; `$Host.UI.RawUI.WindowTitle = 'OWEB PMS Backend Server'; Write-Host 'Running Django REST Framework on Port 8000...' -ForegroundColor Green; python manage.py runserver 8000"

Start-Sleep -Seconds 3

# 3. Launch Frontend
Write-Host "[3/3] Launching React Vite Frontend on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootPath\frontend'; `$Host.UI.RawUI.WindowTitle = 'OWEB PMS Frontend Server'; Write-Host 'Running React Vite UI on Port 5173...' -ForegroundColor Yellow; npm run dev"

Start-Sleep -Seconds 4

# Open Browser
Write-Host "Opening browser to http://localhost:5173..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host " System running successfully!" -ForegroundColor Green
Write-Host " - Frontend UI: http://localhost:5173" -ForegroundColor White
Write-Host " - Backend API: http://localhost:8000/api/" -ForegroundColor White
Write-Host " - Swagger UI : http://localhost:8000/api/docs/" -ForegroundColor White
Write-Host ""
Write-Host " Credentials:" -ForegroundColor White
Write-Host "   Username: admin" -ForegroundColor Gray
Write-Host "   Password: password" -ForegroundColor Gray
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "Press Enter to exit this launcher window..." -ForegroundColor Gray
Read-Host
