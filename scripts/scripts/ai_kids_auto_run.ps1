param(
  [ValidateSet("list","prepare","collect","status")] [string]$Mode = "prepare",
  [string]$Wave = "001_vyvy_lan_ui",
  [string]$Repo = "C:\AI_KIDS_BUDDY",
  [switch]$LaunchOpenCode
)

$ErrorActionPreference = "Stop"
function Section($t){ Write-Host ""; Write-Host "=== $t ===" -ForegroundColor Cyan }
function EnsureRepo(){ if(!(Test-Path $Repo)){ throw "Repo not found: $Repo" }; Set-Location $Repo }
function TS(){ (Get-Date).ToString("yyyyMMdd_HHmmss") }
function WavePath($w){ Join-Path $Repo "prompts\waves\$w.md" }
function RunRoot(){ Join-Path $Repo "reports\runs" }
function LatestRun($w){
  $root = RunRoot
  if(!(Test-Path $root)){ return $null }
  $runs = Get-ChildItem $root -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*_$w" } | Sort-Object LastWriteTime -Descending
  if($runs.Count -eq 0){ return $null }
  return $runs[0].FullName
}
function RunCmd($cmd,$file){
  "COMMAND: $cmd" | Out-File $file -Encoding UTF8
  "TIME: $(Get-Date -Format s)" | Out-File $file -Append -Encoding UTF8
  "" | Out-File $file -Append -Encoding UTF8
  try { Invoke-Expression $cmd *>&1 | Tee-Object -FilePath $file -Append | Out-Null; return $LASTEXITCODE }
  catch { $_ | Out-File $file -Append -Encoding UTF8; return 1 }
}
function ListWaves(){
  EnsureRepo
  Section "Available Waves"
  $dir = Join-Path $Repo "prompts\waves"
  if(!(Test-Path $dir)){ Write-Host "No prompts/waves folder."; return }
  Get-ChildItem $dir -Filter "*.md" | Sort-Object Name | ForEach-Object { Write-Host ("- " + $_.BaseName) }
}
function Prepare(){
  EnsureRepo
  $promptPath = WavePath $Wave
  if(!(Test-Path $promptPath)){ throw "Wave prompt not found: $promptPath" }
  $runDir = Join-Path (RunRoot) ((TS) + "_" + $Wave)
  New-Item -ItemType Directory -Force $runDir | Out-Null
  $prompt = Get-Content $promptPath -Raw -Encoding UTF8
  $runPrompt = Join-Path $runDir "prompt.md"
  Set-Content $runPrompt $prompt -Encoding UTF8
  $clip = "no"
  try { Set-Clipboard -Value $prompt; $clip = "yes" } catch {}
  @{ wave=$Wave; repo=$Repo; run_dir=$runDir; prompt_path=$promptPath; clipboard=$clip; created_at=(Get-Date -Format s) } | ConvertTo-Json | Set-Content (Join-Path $runDir "run_meta.json") -Encoding UTF8
  Section "Prepared"
  Write-Host "WAVE=$Wave"
  Write-Host "RUN_DIR=$runDir"
  Write-Host "PROMPT=$runPrompt"
  Write-Host "CLIPBOARD=$clip"
  if($LaunchOpenCode){
    if(Get-Command opencode -ErrorAction SilentlyContinue){ opencode }
    else { Write-Host "OpenCode not found. Open it manually and paste." -ForegroundColor Yellow }
  } else { Write-Host "Next: open OpenCode, paste prompt, run. Then collect." -ForegroundColor Yellow }
}
function Collect(){
  EnsureRepo
  $runDir = LatestRun $Wave
  if(!$runDir){ $runDir = Join-Path (RunRoot) ((TS) + "_" + $Wave); New-Item -ItemType Directory -Force $runDir | Out-Null }
  Section "Collect"
  Write-Host "WAVE=$Wave"
  Write-Host "RUN_DIR=$runDir"
  $smoke = Join-Path $runDir "smoke_result.txt"
  if(Test-Path ".\scripts\smoke_check.ps1"){ RunCmd "powershell -ExecutionPolicy Bypass -File .\scripts\smoke_check.ps1" $smoke | Out-Null } else { "scripts/smoke_check.ps1 not found" | Set-Content $smoke -Encoding UTF8 }
  $gitStatus = Join-Path $runDir "git_status.txt"
  RunCmd "git status --short" $gitStatus | Out-Null
  $diffStat = Join-Path $runDir "git_diff_stat.txt"
  RunCmd "git diff --stat" $diffStat | Out-Null
  $commits = Join-Path $runDir "recent_commits.txt"
  RunCmd "git log --oneline -5" $commits | Out-Null
  $compile = Join-Path $runDir "backend_compile.txt"
  if(Test-Path ".\backend"){ RunCmd "python -m py_compile .\backend\main.py .\backend\mimo_client.py .\backend\prompts.py .\backend\safety_alpha.py" $compile | Out-Null } else { "backend folder not found" | Set-Content $compile -Encoding UTF8 }
  $handoff = Join-Path $runDir "FINAL_HANDOFF.txt"
  $text = @"
WAVE=$Wave
REPO=$Repo
RUN_DIR=$runDir

## SMOKE RESULT
$(Get-Content $smoke -Raw -ErrorAction SilentlyContinue)

## GIT STATUS
$(Get-Content $gitStatus -Raw -ErrorAction SilentlyContinue)

## GIT DIFF STAT
$(Get-Content $diffStat -Raw -ErrorAction SilentlyContinue)

## BACKEND COMPILE
$(Get-Content $compile -Raw -ErrorAction SilentlyContinue)

## NEXT
Send this FINAL_HANDOFF.txt to ChatGPT for decision: commit / fix / next wave.
"@
  Set-Content $handoff $text -Encoding UTF8
  $clip = "no"
  try { Set-Clipboard -Value $text; $clip = "yes" } catch {}
  Section "Collected"
  Write-Host "HANDOFF=$handoff"
  Write-Host "COPIED_TO_CLIPBOARD=$clip"
}
function Status(){ EnsureRepo; Section "Git Status"; git status --short; Section "Recent Commits"; git log --oneline -5 }
switch($Mode){ "list" { ListWaves }; "prepare" { Prepare }; "collect" { Collect }; "status" { Status } }
