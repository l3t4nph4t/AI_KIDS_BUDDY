# Upload Grade 5 source SGK to deployed app via HTTP endpoint
# Usage: powershell -ExecutionPolicy Bypass -File scripts\upload_sgk_via_http.ps1

param(
    [string]$BaseUrl  = "http://kid.103.245.249.96.nip.io",
    [string]$Token    = "VYVY_SGK_2026",
    [string]$LocalDir = "C:\AI_KIDS_BUDDY\backend\data\source_sgk\grade_5"
)

Add-Type -AssemblyName System.Net.Http

$ErrorActionPreference = "Stop"

Write-Host "=== Upload Grade 5 Source SGK via HTTP ===" -ForegroundColor Cyan
Write-Host "Server : $BaseUrl"
Write-Host "Local  : $LocalDir"
Write-Host ""

# 1. Check what's already on server
Write-Host "Checking existing files on server..." -ForegroundColor Yellow
try {
    $existing = Invoke-RestMethod "$BaseUrl/admin/list-sgk?token=$Token"
    Write-Host "Already on server: $($existing.count) files" -ForegroundColor Green
    $existing.files | ForEach-Object { Write-Host "  - $($_.name) ($($_.size_mb) MB)" -ForegroundColor Gray }
} catch {
    Write-Host "  (could not list - first upload): $_" -ForegroundColor Gray
    $existing = [PSCustomObject]@{ files = @() }
}

Write-Host ""

# 2. Upload each PDF
$existingNames = $existing.files | ForEach-Object { $_.name }
$files = Get-ChildItem $LocalDir -Filter "*.pdf" | Sort-Object Name
$total = $files.Count
$idx   = 0
$skipped = 0
$failed  = 0

foreach ($f in $files) {
    $idx++
    $sizeMB = [math]::Round($f.Length / 1MB, 1)

    if ($existingNames -contains $f.Name) {
        Write-Host "[$idx/$total] SKIP $($f.Name) (already uploaded)" -ForegroundColor Gray
        $skipped++
        continue
    }

    Write-Host "[$idx/$total] Uploading $($f.Name) ($sizeMB MB)..." -ForegroundColor Cyan
    try {
        $form = [System.Net.Http.MultipartFormDataContent]::new()
        $fileBytes = [System.IO.File]::ReadAllBytes($f.FullName)
        $fileContent = [System.Net.Http.ByteArrayContent]::new($fileBytes)
        $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("application/pdf")
        $form.Add($fileContent, "file", $f.Name)

        $client = [System.Net.Http.HttpClient]::new()
        $client.Timeout = [TimeSpan]::FromMinutes(10)
        $resp = $client.PostAsync("$BaseUrl/admin/upload-sgk?token=$Token", $form).Result
        $body = $resp.Content.ReadAsStringAsync().Result

        if ($resp.IsSuccessStatusCode) {
            Write-Host "  OK" -ForegroundColor Green
        } else {
            Write-Host "  FAIL HTTP $($resp.StatusCode): $body" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  ERROR: $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "Total: $total | Skipped: $skipped | Failed: $failed"

# 3. Final verify
Write-Host ""
Write-Host "=== Server file list ===" -ForegroundColor Yellow
try {
    $final = Invoke-RestMethod "$BaseUrl/admin/list-sgk?token=$Token"
    $final.files | ForEach-Object { Write-Host "  $($_.name) ($($_.size_mb) MB)" -ForegroundColor Gray }
    Write-Host "Total on server: $($final.count) PDFs"
} catch {
    Write-Host "  Could not fetch final list: $_" -ForegroundColor Red
}
