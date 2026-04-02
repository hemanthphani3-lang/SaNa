$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = "C:\Users\heman\OneDrive\Desktop"
$ShortcutPath = Join-Path $DesktopPath "Groot AI.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Target: powershell.exe with arguments to run the launcher script
# Use absolute paths for the shortcut to work from the desktop
$ProjectRoot = "y:\hemanth projects 1\SANKEYTHIKA"
$LauncherPath = Join-Path $ProjectRoot "run_assistant.ps1"
$IconPath = Join-Path $ProjectRoot "assets\icon.ico"

$Shortcut.TargetPath = "python.exe"
$Shortcut.Arguments = "`"$ProjectRoot\app_launcher.py`""
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.IconLocation = $IconPath
$Shortcut.Description = "Launch Groot AI Assistant"
$Shortcut.Save()

Write-Host "✅ Groot AI Desktop shortcut created successfully!" -ForegroundColor Green
