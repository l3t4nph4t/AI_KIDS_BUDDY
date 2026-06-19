# AI Kids Buddy - Backend Startup Script (PowerShell)
# Usage: .\scripts\run_alpha.ps1

param(
    [int]$Port = 8000,
    [string]$Host = "0.0.0.0",
    [switch]$Reload,
    [switch]$Help
)

if ($Help) {
    Write-Host "AI Kids Buddy - Backend Server"
    Write-Host "Usage: .\scripts\run_alpha.ps1 [-Port <int>] [-Host <string>] [-Reload] [-Help]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Port      Server port (default: 8000)"
    Write-Host "  -Host      Server host (default: 0.0.0.0)"
    Write-Host "  -Reload    Enable auto-reload for development"
    Write-Host "  -Help      Show this help message"
    exit 0
}

$ErrorActionPreference = "Stop"

# Navigate to project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI Kids Buddy - full_speed_alpha_plus" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "[OK] Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python not found. Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

# Check/Install dependencies
Write-Host "[INFO] Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "requirements.txt") {
    pip install -r requirements.txt --quiet 2>$null
    Write-Host "[OK] Dependencies installed" -ForegroundColor Green
}

# Check .env file
if (-not (Test-Path ".env")) {
    Write-Host "[WARN] No .env file found. Using defaults." -ForegroundColor Yellow
} else {
    Write-Host "[OK] .env file found" -ForegroundColor Green
}

# Build uvicorn command
$uvicornArgs = @(
    "uvicorn",
    "backend.main:app",
    "--host", $Host,
    "--port", $Port
)

if ($Reload) {
    $uvicornArgs += "--reload"
    Write-Host "[INFO] Auto-reload enabled (development mode)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting server on http://${Host}:${Port}" -ForegroundColor Green
Write-Host "Health check: http://localhost:${Port}/health" -ForegroundColor Green
Write-Host "API docs: http://localhost:${Port}/docs" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Start uvicorn
& $uvicornArgs[0] $uvicornArgs[1..($uvicornArgs.Length-1)]