# Upload grade 2 PDFs to Dokploy volume via SCP
# Run this on your LOCAL Windows machine

param(
    [string]$Server = "your-dokploy-server.com",
    [string]$User = "root",
    [string]$VolumePath = "/var/lib/dokploy/volumes/vyvy-lesson-pdfs"
)

$ErrorActionPreference = "Stop"

Write-Host "=== AI Kids Buddy - PDF Upload Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if PDFs exist locally
$localPath = "C:\AI_KIDS_BUDDY\backend\data\lesson_pdfs\grade_2"
if (-not (Test-Path $localPath)) {
    Write-Host "ERROR: PDFs not found at $localPath" -ForegroundColor Red
    exit 1
}

$pdfCount = (Get-ChildItem $localPath -Filter "*.pdf").Count
$pdfSize = (Get-ChildItem $localPath -Filter "*.pdf" | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "Found $pdfCount PDFs ($([math]::Round($pdfSize, 1)) MB)" -ForegroundColor Green
Write-Host ""

# Create remote directory
Write-Host "Creating remote directory..." -ForegroundColor Yellow
ssh "$User@$Server" "mkdir -p $VolumePath/grade_2"

# Upload PDFs
Write-Host "Uploading PDFs via SCP..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

scp -r "$localPath/*" "${User}@${Server}:${VolumePath}/grade_2/"

Write-Host ""
Write-Host "Upload complete!" -ForegroundColor Green
Write-Host ""

# Verify
Write-Host "Verifying upload..." -ForegroundColor Yellow
ssh "$User@$Server" "ls -la $VolumePath/grade_2/ | head -20"
ssh "$User@$Server" "find $VolumePath/grade_2/ -name '*.pdf' | wc -l"

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
