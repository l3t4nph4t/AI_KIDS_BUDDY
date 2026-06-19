# Upload lesson PDFs to Dokploy server
# Usage: .\scripts\upload_remaining_pdfs.ps1 -Server "your-server.com" -User "root"
#
# This script uploads Grade 3, 4, 5 lesson PDFs to the Dokploy volume
# because they're too large to push via git (HTTP 413)

param(
    [Parameter(Mandatory=$true)]
    [string]$Server,
    [string]$User = "root",
    [string]$VolumePath = "/var/lib/dokploy/volumes/lesson_pdfs"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Upload Remaining Lesson PDFs to Dokploy ===" -ForegroundColor Cyan
Write-Host ""

$localBase = "C:\AI_KIDS_BUDDY\backend\data\lesson_pdfs"
$grades = @(3, 4, 5)

foreach ($grade in $grades) {
    $gradeDir = "grade_$grade"
    $localPath = "$localBase\$gradeDir"
    
    if (-not (Test-Path $localPath)) {
        Write-Host "[SKIP] $gradeDir not found at $localPath" -ForegroundColor Yellow
        continue
    }
    
    $pdfFiles = Get-ChildItem $localPath -Filter "*.pdf" -ErrorAction SilentlyContinue
    $pdfCount = $pdfFiles.Count
    $pdfSize = ($pdfFiles | Measure-Object -Property Length -Sum).Sum / 1MB
    
    Write-Host "[$gradeDir] $pdfCount PDFs, $([math]::Round($pdfSize, 1)) MB" -ForegroundColor Green
    
    # Create remote directory
    Write-Host "  Creating remote directory..." -ForegroundColor Gray
    ssh "$User@$Server" "mkdir -p $VolumePath/$gradeDir" 2>&1 | Out-Null
    
    # Upload via SCP
    Write-Host "  Uploading via SCP (this may take a while)..." -ForegroundColor Gray
    scp -r "$localPath\*.pdf" "${User}@${Server}:${VolumePath}/${gradeDir}/" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] $gradeDir uploaded successfully" -ForegroundColor Green
    } else {
        Write-Host "  [ERR] Failed to upload $gradeDir" -ForegroundColor Red
    }
    Write-Host ""
}

# Verification
Write-Host "=== Verification ===" -ForegroundColor Cyan
foreach ($grade in $grades) {
    $gradeDir = "grade_$grade"
    $count = ssh "$User@$Server" "find $VolumePath/$gradeDir -name '*.pdf' 2>/dev/null | wc -l"
    Write-Host "$gradeDir`: $count PDFs on server" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Upload Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify PDFs are in the correct volume path" -ForegroundColor White
Write-Host "2. Restart the Dokploy service if needed" -ForegroundColor White
Write-Host "3. Test the /curriculum/lesson-pdf/{lesson_id} endpoint" -ForegroundColor White
