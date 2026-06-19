# Deploy AI Kids Buddy to Dokploy
# Usage: .\scripts\deploy_to_dokploy.ps1 -Server "your-server.com" -User "root"

param(
    [Parameter(Mandatory=$true)]
    [string]$Server,
    [string]$User = "root",
    [string]$VolumeBase = "/var/lib/dokploy/volumes"
)

$ErrorActionPreference = "Stop"

Write-Host "=== AI Kids Buddy - Dokploy Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Volume names in docker-compose
$volumes = @{
    "lesson_pdfs" = "lesson_pdfs"
    "source_sgk" = "source_sgk"
    "lesson_pdf_cache" = "lesson_pdf_cache"
}

# Local paths
$localBase = "C:\AI_KIDS_BUDDY\backend\data"

# Grades to deploy (Grade 2 already done)
$grades = @(1, 3, 4, 5)

Write-Host "Grades to deploy: $($grades -join ', ')" -ForegroundColor Yellow
Write-Host ""

# Step 1: Create volume directories on server
Write-Host "[1/4] Creating volume directories on server..." -ForegroundColor Yellow
foreach ($vol in $volumes.Values) {
    $volPath = "$VolumeBase/$vol"
    ssh "$User@$Server" "mkdir -p $volPath"
    Write-Host "  Created: $volPath" -ForegroundColor Gray
}
Write-Host ""

# Step 2: Upload lesson_pdfs (Grade 1,3,4,5)
Write-Host "[2/4] Uploading lesson_pdfs..." -ForegroundColor Yellow
$lessonPdfsLocal = "$localBase\lesson_pdfs"
$lessonPdfsRemote = "$VolumeBase/lesson_pdfs"

foreach ($grade in $grades) {
    $gradeDir = "grade_$grade"
    $localPath = "$lessonPdfsLocal\$gradeDir"
    
    if (-not (Test-Path $localPath)) {
        Write-Host "  [SKIP] $gradeDir not found locally" -ForegroundColor Gray
        continue
    }
    
    $pdfCount = (Get-ChildItem $localPath -Filter "*.pdf" -ErrorAction SilentlyContinue).Count
    $pdfSize = (Get-ChildItem $localPath -Filter "*.pdf" -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    
    Write-Host "  Uploading $gradeDir ($pdfCount PDFs, $([math]::Round($pdfSize, 1)) MB)..." -ForegroundColor Cyan
    
    # Create remote directory
    ssh "$User@$Server" "mkdir -p $lessonPdfsRemote/$gradeDir"
    
    # Upload via SCP
    scp -r "$localPath\*" "${User}@${Server}:${lessonPdfsRemote}/${gradeDir}/"
    
    Write-Host "  [OK] $gradeDir uploaded" -ForegroundColor Green
}
Write-Host ""

# Step 3: Upload source_sgk
Write-Host "[3/4] Uploading source_sgk..." -ForegroundColor Yellow
$sourceSgkLocal = "$localBase\source_sgk"
$sourceSgkRemote = "$VolumeBase/source_sgk"

foreach ($grade in $grades) {
    $gradeDir = "grade_$grade"
    $localPath = "$sourceSgkLocal\$gradeDir"
    
    if (-not (Test-Path $localPath)) {
        Write-Host "  [SKIP] $gradeDir not found locally" -ForegroundColor Gray
        continue
    }
    
    $pdfCount = (Get-ChildItem $localPath -Filter "*.pdf" -ErrorAction SilentlyContinue).Count
    $pdfSize = (Get-ChildItem $localPath -Filter "*.pdf" -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    
    Write-Host "  Uploading $gradeDir ($pdfCount PDFs, $([math]::Round($pdfSize, 1)) MB)..." -ForegroundColor Cyan
    
    # Create remote directory
    ssh "$User@$Server" "mkdir -p $sourceSgkRemote/$gradeDir"
    
    # Upload via SCP
    scp -r "$localPath\*" "${User}@${Server}:${sourceSgkRemote}/${gradeDir}/"
    
    Write-Host "  [OK] $gradeDir uploaded" -ForegroundColor Green
}
Write-Host ""

# Step 4: Create lesson_pdf_cache directory
Write-Host "[4/4] Creating lesson_pdf_cache directory..." -ForegroundColor Yellow
ssh "$User@$Server" "mkdir -p $VolumeBase/lesson_pdf_cache"
Write-Host "  [OK] lesson_pdf_cache created" -ForegroundColor Green
Write-Host ""

# Verification
Write-Host "=== Verification ===" -ForegroundColor Cyan
Write-Host "Checking uploaded files on server..." -ForegroundColor Yellow

foreach ($vol in @("lesson_pdfs", "source_sgk")) {
    $volPath = "$VolumeBase/$vol"
    Write-Host "`n$vol:" -ForegroundColor Cyan
    ssh "$User@$Server" "ls -la $volPath/"
    
    foreach ($grade in $grades) {
        $gradeDir = "grade_$grade"
        $count = ssh "$User@$Server" "find $volPath/$gradeDir -name '*.pdf' 2>/dev/null | wc -l"
        Write-Host "  $gradeDir`: $count PDFs" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Push code to git repository" -ForegroundColor White
Write-Host "2. In Dokploy UI, update service to use docker-compose.yml" -ForegroundColor White
Write-Host "3. Redeploy the service" -ForegroundColor White
Write-Host ""
Write-Host "Volume mounts in container:" -ForegroundColor Yellow
Write-Host "  /app/backend/data/lesson_pdfs    -> $VolumeBase/lesson_pdfs" -ForegroundColor White
Write-Host "  /app/backend/data/source_sgk     -> $VolumeBase/source_sgk" -ForegroundColor White
Write-Host "  /app/backend/data/lesson_pdf_cache -> $VolumeBase/lesson_pdf_cache" -ForegroundColor White
