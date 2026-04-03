import webview
import subprocess
import time
import os
import sys
import threading
import socket
import signal
import atexit

# Configuration
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")
VENV_PYTHON = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")

# Process Registry for cleanup
processes = []

def cleanup():
    """Ensure all sub-processes are terminated on exit."""
    print("\n🧹 Neural Link Disconnecting... Cleaning up processes.")
    for p in processes:
        try:
            if sys.platform == "win32":
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                p.terminate()
        except:
            pass
    print("✅ System offline.")

atexit.register(cleanup)

def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

def ensure_ollama():
    print("🧠 Checking AI Engine (Ollama)...")
    if is_port_open(11434):
        print("✅ AI Engine already active.")
        return True
    
    print("🚀 Starting AI Engine (Ollama)...")
    try:
        p = subprocess.Popen(["ollama", "serve"], creationflags=subprocess.CREATE_NO_WINDOW)
        processes.append(p)
        
        # Wait for Ollama
        for _ in range(15):
            if is_port_open(11434):
                print("✅ AI Engine synchronized.")
                return True
            time.sleep(1)
        
        return False
    except:
        return False

def start_backend():
    print("🚀 Starting AI Neural Core...")
    if is_port_open(8000):
        print("⚠️ Backend already running on port 8000.")
        return
    p = subprocess.Popen([VENV_PYTHON, "main.py"], cwd=BACKEND_DIR, creationflags=subprocess.CREATE_NO_WINDOW)
    processes.append(p)

def start_frontend():
    print("🚀 Starting Interface Server...")
    if is_port_open(5173):
        print("⚠️ Frontend already running on port 5173.")
        return
    p = subprocess.Popen("npm run dev -- --force --port 5173 --host 127.0.0.1", cwd=FRONTEND_DIR, shell=True, creationflags=subprocess.CREATE_NO_WINDOW)
    processes.append(p)

def launch_hud():
    # 1. Ensure AI Engine
    ensure_ollama()

    # 2. Start Services
    start_backend()
    start_frontend()

    # 3. Wait for Frontend
    print("⏳ Synchronizing Neural Link (Waiting for Port 5173)...")
    for _ in range(30):
        if is_port_open(5173):
            break
        time.sleep(1)
    
    if not is_port_open(5173):
        print("❌ Error: Frontend failed to start. Check frontend/logs.")
        sys.exit(1)

    print("✨ Neural Link Established. Launching HUD.")
    
    window = webview.create_window(
        'Groot AI Assistant', 
        'http://127.0.0.1:5173',
        width=1280,
        height=800,
        background_color='#0f172a'
    )
    
    # On window close, python will exit, triggering atexit cleanup
    webview.start()

if __name__ == '__main__':
    launch_hud()
