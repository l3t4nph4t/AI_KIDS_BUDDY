# VyVy Smoke Check Script
# Validates all core requirements for tomorrow-use
$ErrorActionPreference = "Continue"
Set-Location "$PSScriptRoot\.."
$pass = 0
$fail = 0

function Check($name, $result) {
    if ($result) {
        Write-Host "[PASS] $name" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "[FAIL] $name" -ForegroundColor Red
        $script:fail++
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Magenta
Write-Host "  VyVy Smoke Check" -ForegroundColor Magenta
Write-Host "======================================" -ForegroundColor Magenta
Write-Host ""

# Gate 1: File existence
Write-Host "--- File Existence ---" -ForegroundColor Cyan
$requiredFiles = @(
    "web/index.html",
    "web/script.js",
    "web/style.css",
    "web/content.js",
    "web/manifest.json",
    "web/sw.js",
    "web/icons/icon-192.svg",
    "web/icons/icon-512.svg",
    "backend/main.py",
    "backend/mimo_client.py",
    "backend/prompts.py",
    "backend/safety_alpha.py",
    "scripts/run_lan.ps1",
    "docs/TOMORROW_USE_CHECKLIST.md",
    "docs/EXPERIENCE_60_HOURS.md"
)
foreach ($file in $requiredFiles) {
    Check "$file exists" (Test-Path $file)
}

# Gate 2: UTF-8 charset in HTML
Write-Host ""
Write-Host "--- Encoding Checks ---" -ForegroundColor Cyan
if (Test-Path "web/index.html") {
    $html = Get-Content "web/index.html" -Raw -Encoding UTF8
    Check "HTML has UTF-8 charset" ($html -match 'charset="UTF-8"' -or $html -match "charset=UTF-8")
    Check "HTML has Vietnamese title VyVy" ($html -match "VyVy")
    Check "HTML has meta theme-color" ($html -match "theme-color")
} else {
    Check "HTML exists for encoding check" $false
}

# Gate 3: Mojibake detection using file byte scan
Write-Host ""
Write-Host "--- Mojibake Detection ---" -ForegroundColor Cyan
$scanFiles = @("web/index.html", "web/script.js", "web/style.css", "web/content.js", "backend/main.py", "backend/prompts.py", "backend/safety_alpha.py", "backend/mimo_client.py")
$mojibakeFound = $false
foreach ($file in $scanFiles) {
    if (Test-Path $file) {
        $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $file))
        $content = [System.Text.Encoding]::UTF8.GetString($bytes)
        # Check for replacement character U+FFFD
        if ($content -match '\uFFFD') {
            Write-Host "  MOJIBAKE (replacement char) in $file" -ForegroundColor Red
            $mojibakeFound = $true
        }
        # Check for common broken UTF-8 sequences (0xC3 followed by non-continuation byte)
        for ($i = 0; $i -lt $bytes.Length - 1; $i++) {
            if ($bytes[$i] -eq 0xC3 -and $bytes[$i+1] -ge 0x80) {
                # This is actually valid Latin-1 supplement, but check for double-encoding
                # by looking for sequences like C3 83 C2 XX (double-encoded UTF-8)
                if ($i + 3 -lt $bytes.Length -and $bytes[$i] -eq 0xC3 -and $bytes[$i+1] -eq 0x83 -and $bytes[$i+2] -eq 0xC2) {
                    Write-Host "  MOJIBAKE (double-encoded) in $file at byte $i" -ForegroundColor Red
                    $mojibakeFound = $true
                    break
                }
            }
        }
    }
}
Check "No mojibake in project files" (-not $mojibakeFound)

# Vietnamese sample string test
if (Test-Path "web/content.js") {
    $contentJs = Get-Content "web/content.js" -Raw -Encoding UTF8
    Check "Vietnamese sample in content.js (con meo)" ($contentJs -match "Con m" -or $contentJs -match "m.o")
}

# Gate 4: Frontend LAN-safe API calls
Write-Host ""
Write-Host "--- Frontend API Safety ---" -ForegroundColor Cyan
if (Test-Path "web/script.js") {
    $js = Get-Content "web/script.js" -Raw -Encoding UTF8
    Check "script.js contains VyVy" ($js -match "VyVy")
    Check "script.js uses window.location.hostname" ($js -match "window\.location\.hostname")
    Check "script.js contains port 8010" ($js -match "8010")
    Check "script.js has NO fetch('/health')" (-not ($js -match "fetch\('/health"))
    Check "script.js has NO fetch('/chat')" (-not ($js -match "fetch\('/chat"))
    Check "script.js has NO localhost backend" (-not ($js -match "localhost:8010"))
    Check "script.js has NO 127.0.0.1 backend" (-not ($js -match "127\.0\.0\.1:8010"))
    Check "script.js uses payload field text" ($js -match "text:\s*text\.trim\(\)")
    Check "script.js uses textContent" ($js -match "textContent")
    Check "script.js has no innerHTML" (-not ($js -match "innerHTML"))
    Check "script.js contains liveCallActive" ($js -match "liveCallActive")
    Check "script.js contains SpeechRecognition" ($js -match "SpeechRecognition")
    Check "script.js contains speechSynthesis" ($js -match "speechSynthesis")
    Check "script.js contains selectVyVyVoice" ($js -match "selectVyVyVoice")
    Check "script.js contains Gọi VyVy text" ($js -match "G.i.*VyVy")
    Check "script.js contains Ket thuc text" ($js -match "K.t.*th.*c")
    Check "script.js has session_mode" ($js -match "session_mode")
    Check "script.js has profile_memory" ($js -match "profile_memory")
} else {
    Check "script.js exists for API check" $false
}

# Gate 5: No API keys in web files
Write-Host ""
Write-Host "--- Secret Safety ---" -ForegroundColor Cyan
$webFiles = Get-ChildItem -Path "web" -Recurse -File
$secretsFound = $false
foreach ($f in $webFiles) {
    $content = Get-Content $f.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    if ($content) {
        if ($content -match "MIMO_TOKEN_PLAN_KEY" -or $content -match "MIMO_API_KEY") {
            Write-Host "  SECRET found in $($f.Name)" -ForegroundColor Red
            $secretsFound = $true
        }
    }
}
Check "No API keys in web files" (-not $secretsFound)

# Gate 6: Backend Python compile
Write-Host ""
Write-Host "--- Backend Compile ---" -ForegroundColor Cyan
$pyFiles = @("backend/main.py", "backend/mimo_client.py", "backend/prompts.py", "backend/safety_alpha.py")
foreach ($file in $pyFiles) {
    $exists = Test-Path $file
    Check "$file exists" $exists
    if ($exists) {
        $compileResult = python -m py_compile $file 2>&1
        Check "$file compiles" ($LASTEXITCODE -eq 0)
    }
}

# Gate 7: Backend content checks
Write-Host ""
Write-Host "--- Backend Content ---" -ForegroundColor Cyan
if (Test-Path "backend/prompts.py") {
    $prompts = Get-Content "backend/prompts.py" -Raw -Encoding UTF8
    Check "prompts.py contains VyVy" ($prompts -match "VyVy")
    Check "prompts.py has session_mode" ($prompts -match "session_mode")
    Check "prompts.py has profile_memory" ($prompts -match "profile_memory")
    Check "prompts.py has free_chat mode" ($prompts -match "free_chat")
    Check "prompts.py has story mode" ($prompts -match "story")
    Check "prompts.py has english mode" ($prompts -match "english")
    Check "prompts.py has math mode" ($prompts -match "math")
    Check "prompts.py has imagination mode" ($prompts -match "imagination")
    Check "prompts.py has feelings mode" ($prompts -match "feelings")
    Check "prompts.py has bedtime mode" ($prompts -match "bedtime")
    Check "prompts.py has live_call mode" ($prompts -match "live_call")
}

if (Test-Path "backend/main.py") {
    $main = Get-Content "backend/main.py" -Raw -Encoding UTF8
    Check "main.py has /health endpoint" ($main -match '"/health"')
    Check "main.py has /chat endpoint" ($main -match '"/chat"')
    Check "main.py has ChatRequest with text" ($main -match "text:\s*str")
    Check "main.py has session_mode" ($main -match "session_mode")
    Check "main.py has profile_memory" ($main -match "profile_memory")
    Check "main.py has CORS allow_origins *" ($main -match 'allow_origins=\["\*"\]')
}

if (Test-Path "backend/mimo_client.py") {
    $mimo = Get-Content "backend/mimo_client.py" -Raw -Encoding UTF8
    Check "mimo_client.py has MIMO_TOKEN_PLAN_KEY" ($mimo -match "MIMO_TOKEN_PLAN_KEY")
    Check "mimo_client.py has MIMO_BASE_URL" ($mimo -match "MIMO_BASE_URL")
}

# Gate 8: Content pack
Write-Host ""
Write-Host "--- Content Pack ---" -ForegroundColor Cyan
if (Test-Path "web/content.js") {
    $content = Get-Content "web/content.js" -Raw -Encoding UTF8
    Check "content.js has free_talk" ($content -match "free_talk")
    Check "content.js has stories" ($content -match "stories")
    Check "content.js has english" ($content -match "english")
    Check "content.js has math" ($content -match "math")
    Check "content.js has feelings" ($content -match "feelings")
    Check "content.js has imagination" ($content -match "imagination")
    Check "content.js has daily_quests" ($content -match "daily_quests")
    Check "content.js has bedtime" ($content -match "bedtime")
    Check "content.js has vyvyGetStarter" ($content -match "vyvyGetStarter")
} else {
    Check "content.js exists" $false
}

# Gate 9: PWA manifest
Write-Host ""
Write-Host "--- PWA ---" -ForegroundColor Cyan
if (Test-Path "web/manifest.json") {
    $manifest = Get-Content "web/manifest.json" -Raw -Encoding UTF8
    Check "manifest.json has VyVy name" ($manifest -match "VyVy")
    Check "manifest.json has standalone" ($manifest -match "standalone")
    Check "manifest.json has icons" ($manifest -match "icons")
} else {
    Check "manifest.json exists" $false
}

# Gate 10: Documentation
Write-Host ""
Write-Host "--- Documentation ---" -ForegroundColor Cyan
Check "TOMORROW_USE_CHECKLIST.md exists" (Test-Path "docs/TOMORROW_USE_CHECKLIST.md")
Check "EXPERIENCE_60_HOURS.md exists" (Test-Path "docs/EXPERIENCE_60_HOURS.md")
Check "ANDROID_BUILD_GUIDE.md exists" (Test-Path "docs/ANDROID_BUILD_GUIDE.md")
Check "run_lan.ps1 exists" (Test-Path "scripts/run_lan.ps1")

# Results
Write-Host ""
Write-Host "======================================" -ForegroundColor Magenta
Write-Host "  Results: $pass passed, $fail failed" -ForegroundColor Magenta
Write-Host "======================================" -ForegroundColor Magenta
Write-Host ""

if ($fail -gt 0) {
    Write-Host "SMOKE CHECK: FAIL ($fail failures)" -ForegroundColor Red
    exit 1
} else {
    Write-Host "SMOKE CHECK: ALL PASS" -ForegroundColor Green
    exit 0
}
