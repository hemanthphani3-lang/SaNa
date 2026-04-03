@echo off
TITLE Groot AI Assistant
color 0A
echo.
echo  ================================================================
echo    GROOT AI ASSISTANT  --  Offline-First Desktop HUD
echo  ================================================================
echo.

cd /d "%~dp0"

:: ── 1. Check venv ─────────────────────────────────────────────────
SET PYTHON_EXE=backend\venv\Scripts\python.exe

if not exist "%PYTHON_EXE%" (
    echo [ERROR] Virtual environment not found at %PYTHON_EXE%
    echo         Run setup.ps1 first to create the backend environment.
    pause
    exit /b 1
)

:: ── 2. Check Ollama is installed ──────────────────────────────────
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARN]  Ollama not found in PATH.
    echo         Install from https://ollama.ai and run: ollama pull phi3:mini
    echo         The app will still launch but AI chat will be unavailable.
    echo.
)

:: ── 3. Start Ollama in background (if not already running) ────────
echo [1/3] Checking AI Engine (Ollama)...
curl -s http://localhost:11434 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [1/3] Starting Ollama...
    start /min "" ollama serve
    timeout /t 4 /nobreak >nul
) else (
    echo [1/3] Ollama already active. Good.
)

:: ── 4. Launch the main Python app (backend + frontend + webview) ──
echo [2/3] Starting Neural Core (Backend)...
echo [3/3] Starting Interface (Frontend)...
echo.
echo  All systems nominal. Launching HUD...
echo.

"%PYTHON_EXE%" app_launcher.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Launcher exited with error code %ERRORLEVEL%
    echo         Check that 'pip install -r backend\requirements.txt' has been run.
    pause
)
