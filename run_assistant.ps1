# SANKEYTHIKA AI Launcher - Robust Version
# This script handles the startup of both backend and frontend securely.

$ProjectRoot = "y:\hemanth projects 1\SANKEYTHIKA"
$BackendPath = Join-Path $ProjectRoot "backend"
$FrontendPath = Join-Path $ProjectRoot "frontend"
$LogPath = Join-Path $ProjectRoot "launch_log.txt"

Function Log-Message($msg) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$timestamp] $msg" | Out-File -FilePath $LogPath -Append
    Write-Host $msg -ForegroundColor Cyan
}

Log-Message "🚀 Starting SANKEYTHIKA AI Systems..."

# 1. Kill any existing processes on ports 8000 (backend) and 5173 (frontend)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue

# 2. Start Backend
Log-Message "  -> Launching AI Neural Core (Backend)..."
$BackendCmd = ".\venv\Scripts\activate; python main.py"
Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"cd '$BackendPath'; $BackendCmd`"" -WindowStyle Minimized

# 3. Start Frontend
Log-Message "  -> Launching Interface (Frontend)..."
# Using cmd /c for npm as it's more reliable for .cmd files in PowerShell Start-Process
$FrontendCmd = "cmd /c npm run dev -- --port 5173 --host 127.0.0.1"
Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"cd '$FrontendPath'; $FrontendCmd; Read-Host 'Press Enter if this fails...'`"" -WindowStyle Minimized

# 4. Wait for Frontend to be ready (Polling)
Log-Message "  -> Waiting for Neural Link (Port 5173)..."
$retries = 30
$connected = $false
while ($retries -gt 0 -and -not $connected) {
    # Check if the port is listening
    if (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) {
        $connected = $true
    } else {
        $retries--
        Start-Sleep -Seconds 1
    }
}

if ($connected) {
    Log-Message "✨ Link Established. Opening SANKEYTHIKA Interface..."
    $AppUrl = "http://localhost:5173"
    
    # Try Edge App Mode first
    $EdgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    $ChromePath = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"

    if (Test-Path $EdgePath) {
        Start-Process $EdgePath -ArgumentList "--app=$AppUrl"
    } elseif (Test-Path $ChromePath) {
        Start-Process $ChromePath -ArgumentList "--app=$AppUrl"
    } else {
        Start-Process $AppUrl # Default browser
    }
} else {
    Log-Message "❌ Error: Could not connect to the frontend. Check launch_log.txt."
    Read-Host "Press enter to exit..."
}
