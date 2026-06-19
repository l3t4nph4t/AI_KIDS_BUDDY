# Upload Grade 5 source SGK to Dokploy server Docker volume
# Run this script with SSH access to the Dokploy server (103.245.249.96)
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\upload_sgk_grade5.ps1 -SshUser <username>
#
# If SSH key needed:
#   powershell -ExecutionPolicy Bypass -File scripts\upload_sgk_grade5.ps1 -SshUser <username> -SshKey "C:\path\to\key.pem"

param(
    [Parameter(Mandatory=$true)]
    [string]$SshUser,
    [string]$SshKey = "",
    [string]$ServerIP = "103.245.249.96",
    [string]$VolumePath = "/var/lib/docker/volumes/phatlt2-aikidsbuddy-mmjgoa_vyvy-sgk-data/_data"
)

$LocalDir = "C:\AI_KIDS_BUDDY\backend\data\source_sgk\grade_5"
$RemoteDir = "$VolumePath/grade_5"

$SshOpts = if ($SshKey) { "-i `"$SshKey`"" } else { "" }

Write-Host "=== Upload Grade 5 Source SGK to Dokploy Server ==="
Write-Host "Server  : $ServerIP"
Write-Host "Remote  : $RemoteDir"
Write-Host "Local   : $LocalDir"
Write-Host ""

# 1. Create remote directory
Write-Host "Step 1: Create remote directory..."
Invoke-Expression "ssh $SshOpts ${SshUser}@${ServerIP} `"mkdir -p $RemoteDir`""

# 2. Upload files
$files = Get-ChildItem $LocalDir -Filter "*.pdf"
Write-Host "Step 2: Uploading $($files.Count) files (~506 MB)..."
foreach ($f in $files) {
    $sizeMB = [math]::Round($f.Length / 1MB, 0)
    Write-Host "  Uploading $($f.Name) ($sizeMB MB)..."
    Invoke-Expression "scp $SshOpts `"$($f.FullName)`" `"${SshUser}@${ServerIP}:$RemoteDir/`""
}

Write-Host ""
Write-Host "Done! Verify on server:"
Write-Host "  ssh ${SshUser}@${ServerIP} `"ls -lh $RemoteDir`""
