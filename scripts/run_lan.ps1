# VyVy — LAN Run Script
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\run_lan.ps1
#   powershell -ExecutionPolicy Bypass -File .\scripts\run_lan.ps1 -Mode backend
#   powershell -ExecutionPolicy Bypass -File .\scripts\run_lan.ps1 -Mode web
#   powershell -ExecutionPolicy Bypass -File .\scripts\run_lan.ps1 -Mode all

param(
    [ValidateSet("all", "backend", "web")]
    [string]$Mode = "all"
)

Set-Location "$PSScriptRoot\.."

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  VyVy — ban AI cua con" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Get local IP
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" -and $_.PrefixOrigin -ne "WellKnown"
} | Select-Object -First 1).IPAddress

if (-not $localIP) {
    $localIP = "YOUR_IP"
}

Write-Host "Laptop IP: $localIP" -ForegroundColor Cyan
Write-Host ""

if ($Mode -eq "backend" -or $Mode -eq "all") {
    Write-Host "[BACKEND]" -ForegroundColor Green
    Write-Host "  Command:" -ForegroundColor Yellow
    Write-Host "    python -m uvicorn backend.main:app --host 0.0.0.0 --port 8010" -ForegroundColor White
    Write-Host ""
    Write-Host "  Health check:" -ForegroundColor Yellow
    Write-Host "    http://${localIP}:8010/health" -ForegroundColor White
    Write-Host ""

    if ($Mode -eq "backend") {
        Write-Host "Starting backend..." -ForegroundColor Green
        python -m uvicorn backend.main:app --host 0.0.0.0 --port 8010
    }
}

if ($Mode -eq "web" -or $Mode -eq "all") {
    Write-Host "[WEB]" -ForegroundColor Green
    Write-Host "  Command:" -ForegroundColor Yellow
    Write-Host "    python -m http.server 5173 -d web --bind 0.0.0.0" -ForegroundColor White
    Write-Host ""
    Write-Host "  Open on laptop:" -ForegroundColor Yellow
    Write-Host "    http://127.0.0.1:5173" -ForegroundColor White
    Write-Host ""
    Write-Host "  Open on Xiaomi:" -ForegroundColor Yellow
    Write-Host "    http://${localIP}:5173" -ForegroundColor White
    Write-Host ""

    if ($Mode -eq "web") {
        Write-Host "Starting web server..." -ForegroundColor Green
        python -m http.server 5173 -d web --bind 0.0.0.0
    }
}

if ($Mode -eq "all") {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  OPEN TWO TERMINALS:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Terminal 1 (backend):" -ForegroundColor White
    Write-Host "    python -m uvicorn backend.main:app --host 0.0.0.0 --port 8010" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Terminal 2 (web):" -ForegroundColor White
    Write-Host "    python -m http.server 5173 -d web --bind 0.0.0.0" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Then open on Xiaomi:" -ForegroundColor White
    Write-Host "    http://${localIP}:5173" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
}
