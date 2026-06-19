# claude_orchestrator.ps1 — Thin PS1 entrypoint for Claude orchestrator.
# Usage: .\scripts\claude_orchestrator.ps1 [-Wave 001_vyvy_lan_ui] [-DryRunOnly]
param(
    [string]$Wave = "001_vyvy_lan_ui",
    [switch]$DryRunOnly,
    [switch]$CheckEnvOnly
)

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

Write-Host ""
Write-Host "=== Claude Orchestrator ===" -ForegroundColor Cyan
Write-Host "Root: $root"
Write-Host "Wave: $Wave"
Write-Host ""

# Step 1: Preflight env check
Write-Host "--- Preflight ---" -ForegroundColor Yellow
& "$PSScriptRoot\check_mimo_env.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[STOP] Env check failed." -ForegroundColor Red
    exit 1
}

if ($CheckEnvOnly) { exit 0 }

# Step 2: Check Python
$pyVer = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[STOP] Python not found. Install Python 3.10+." -ForegroundColor Red
    exit 1
}
Write-Host "Python: $pyVer"

# Step 3: Check requests library
$reqCheck = python -c "import requests" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing requests..." -ForegroundColor Yellow
    python -m pip install requests --quiet
}

# Step 4: Check wave spec exists
$waveJson = Join-Path $root "orchestration\waves\$Wave.json"
if (-not (Test-Path $waveJson)) {
    Write-Host "[STOP] Wave spec not found: $waveJson" -ForegroundColor Red
    exit 1
}
Write-Host "Wave spec: $waveJson"
Write-Host ""

# Step 5: Run Python orchestrator
$args = @($Wave)
if ($DryRunOnly) { $args += "--dry-run-only" }

Write-Host "--- Running orchestrator.py ---" -ForegroundColor Yellow
python "$PSScriptRoot\orchestrator.py" @args
$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "=== Orchestrator completed ===" -ForegroundColor Green
} else {
    Write-Host "=== Orchestrator exited with code $exitCode ===" -ForegroundColor Red
}
exit $exitCode
