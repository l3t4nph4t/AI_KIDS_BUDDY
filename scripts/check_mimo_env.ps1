# check_mimo_env.ps1 — Validate MIMO config. Never prints the key.
param([switch]$Quiet)

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$envFile = Join-Path $root ".local\mimo.env"

$pass = 0
$fail = 0

function Check($name, $result) {
    if ($result) {
        if (-not $Quiet) { Write-Host "[PASS] $name" -ForegroundColor Green }
        $script:pass++
    } else {
        Write-Host "[FAIL] $name" -ForegroundColor Red
        $script:fail++
    }
}

Write-Host "=== MIMO Env Check ===" -ForegroundColor Cyan

Check ".local/mimo.env exists" (Test-Path $envFile)

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line -match '^([^=]+)=(.*)$') {
            $k = $Matches[1].Trim()
            $v = $Matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($k, $v, 'Process')
        }
    }
}

$key   = [System.Environment]::GetEnvironmentVariable('MIMO_TOKEN_PLAN_KEY', 'Process')
$model = [System.Environment]::GetEnvironmentVariable('MIMO_MODEL', 'Process')
$base  = [System.Environment]::GetEnvironmentVariable('MIMO_BASE_URL', 'Process')

Check "MIMO_TOKEN_PLAN_KEY present" (-not [string]::IsNullOrEmpty($key))
Check "MIMO_MODEL = MiMo-V2.5-Pro" ($model -eq 'MiMo-V2.5-Pro')
Check "MIMO_BASE_URL set" (-not [string]::IsNullOrEmpty($base))

$keyDisplay = if ($key) { 'yes' } else { 'no' }

Write-Host ""
Write-Host "MIMO_KEY_PRESENT=$keyDisplay"
Write-Host "MIMO_MODEL=$model"
Write-Host "MIMO_BASE_URL=$base"
Write-Host ""

if ($fail -gt 0) {
    Write-Host "[$fail check(s) failed - fix before running orchestrator]" -ForegroundColor Red
    exit 1
} else {
    Write-Host "[All checks passed]" -ForegroundColor Green
    exit 0
}
