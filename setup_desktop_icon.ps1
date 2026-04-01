$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = "C:\Users\heman\OneDrive\Desktop"
$ShortcutPath = Join-Path $DesktopPath "SANKEYTHIKA AI.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Target: powershell.exe with arguments to run the launcher script
# Use absolute paths for the shortcut to work from the desktop
$ProjectRoot = "y:\hemanth projects 1\SANKEYTHIKA"
$LauncherPath = Join-Path $ProjectRoot "run_assistant.ps1"
$IconPath = Join-Path $ProjectRoot "assets\icon.ico"

$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$LauncherPath`""
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.IconLocation = $IconPath
$Shortcut.Description = "Launch SANKEYTHIKA AI Assistant"
$Shortcut.Save()

Write-Host "✅ SANKEYTHIKA AI Desktop shortcut created successfully!" -ForegroundColor Green
