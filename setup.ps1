# SANKEYTHIKA Setup Script
# Run this to prepare your environment

Write-Host "--- SANKEYTHIKA (SaNa) Environment Setup ---" -ForegroundColor Cyan

# 1. Check Python
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python is not installed. Please install Python 3.9+ and try again."
    exit
}

# 2. Create Virtual Environment
if (!(Test-Path "backend/venv")) {
    Write-Host "Creating Virtual Environment..." -ForegroundColor Yellow
    python -m venv backend/venv
}

# 3. Install Dependencies
Write-Host "Installing Python Dependencies..." -ForegroundColor Yellow
& "./backend/venv/Scripts/pip" install -r backend/requirements.txt

# 4. Check External Binaries
Write-Host "Checking for External Binaries..." -ForegroundColor Yellow

$espeakPath = "C:\Program Files\eSpeak NG\espeak-ng.exe"
if (!(Test-Path $espeakPath)) {
    Write-Warning "eSpeak-NG NOT FOUND at $espeakPath."
    Write-Host "Phoneme extraction will fail. Please download and install from: https://github.com/espeak-ng/espeak-ng/releases" -ForegroundColor Red
} else {
    Write-Host "eSpeak-NG detected." -ForegroundColor Green
}

# 5. Initialize RAG
Write-Host "Initializing RAG Vector Index..." -ForegroundColor Yellow
& "./backend/venv/Scripts/python" init_rag.py

# 6. Frontend Setup
Write-Host "Checking Frontend Dependencies..." -ForegroundColor Yellow
if (Test-Path "frontend/package.json") {
    cd frontend
    # npm install # Uncomment if you want to automate this, but it takes time
    cd ..
}

Write-Host "`n--- Setup Complete ---" -ForegroundColor Cyan
Write-Host "Next Steps:"
Write-Host "1. Ensure Ollama is running (ollama serve)"
Write-Host "2. Pull the model: ollama pull phi"
Write-Host "3. Start Backend: cd backend; ..\backend\venv\Scripts\python main.py"
Write-Host "4. Start Frontend: cd frontend; npm run dev"
Write-Host "5. Launch the Assistant!" -ForegroundColor Green
