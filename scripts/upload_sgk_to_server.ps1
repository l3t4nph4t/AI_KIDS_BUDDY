# Upload Grade 5 source SGK PDFs to Dokploy server Docker volume
# Usage: powershell -ExecutionPolicy Bypass -File scripts\upload_sgk_to_server.ps1
#
# Prerequisites:
#   - VPN connected to VNG network
#   - SSH access to 103.245.249.96 (user: root)

param(
    [string]$User = "root",
    [string]$Server = "103.245.249.96",
    [string]$VolumeName = "phatlt2-aikidsbuddy-mmjgoa_vyvy-sgk-data",
    [string]$RemoteBase = "/var/lib/docker/volumes"
)

$LocalDir  = "C:\AI_KIDS_BUDDY\backend\data\source_sgk\grade_5"
$RemoteDir = "$RemoteBase/$VolumeName/_data/grade_5"

Write-Host "=== Upload Grade 5 Source SGK ===" -ForegroundColor Cyan
Write-Host "Server : ${User}@${Server}"
Write-Host "Remote : $RemoteDir"
Write-Host ""

# Test SSH
Write-Host "Testing SSH connection..." -ForegroundColor Yellow
$test = ssh -o ConnectTimeout=5 "${User}@${Server}" "echo ok" 2>&1
if ($test -ne "ok") {
    Write-Host "ERROR: Cannot SSH to ${Server}. Check VPN + credentials." -ForegroundColor Red
    exit 1
}
Write-Host "SSH OK" -ForegroundColor Green

# Create remote dir
ssh "${User}@${Server}" "mkdir -p $RemoteDir"

# Upload files
$files = Get-ChildItem $LocalDir -Filter "*.pdf"
$total = $files.Count
$idx = 0
foreach ($f in $files) {
    $idx++
    $sizeMB = [math]::Round($f.Length/1MB, 0)
    Write-Host "[$idx/$total] $($f.Name) ($sizeMB MB)..." -ForegroundColor Cyan
    scp "$($f.FullName)" "${User}@${Server}:$RemoteDir/"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR uploading $($f.Name)" -ForegroundColor Red
    }
}

# Verify
Write-Host ""
Write-Host "=== Verify ===" -ForegroundColor Yellow
$count = ssh "${User}@${Server}" "ls $RemoteDir/*.pdf 2>/dev/null | wc -l"
Write-Host "Files on server: $count / $total" -ForegroundColor Green

Write-Host ""
Write-Host "Done! Grade 5 source SGK uploaded." -ForegroundColor Green
Write-Host "Backend sẽ tự split on-demand khi user mở lesson Grade 5 MATH/ENGLISH/MUSIC/HISTORY_GEO"
