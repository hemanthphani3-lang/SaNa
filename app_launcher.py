import webview
import subprocess
import time
import os
import sys
import threading
import socket

# Configuration
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")
VENV_PYTHON = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")

def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def start_backend():
    print("🚀 Starting AI Neural Core...")
    subprocess.Popen([VENV_PYTHON, "main.py"], cwd=BACKEND_DIR, creationflags=subprocess.CREATE_NO_WINDOW)

def start_frontend():
    print("🚀 Starting Interface Server...")
    # Using shell=True to handle npm on Windows
    subprocess.Popen("npm run dev -- --force --port 5173 --host 127.0.0.1", cwd=FRONTEND_DIR, shell=True, creationflags=subprocess.CREATE_NO_WINDOW)

def launch_hud():
    # 1. Start Services
    start_backend()
    start_frontend()

    # 2. Wait for Frontend (Port 5173)
    print("⏳ Synchronizing Neural Link (Waiting for Port 5173)...")
    retries = 30
    while retries > 0 and not is_port_open(5173):
        time.sleep(1)
        retries -= 1
    
    if not is_port_open(5173):
        print("❌ Error: Frontend failed to start.")
        sys.exit(1)

    print("✨ Neural Link Established. Launching HUD.")
    
    # 3. Create Webview Window
    # simple_drag=True/False depends on implementation, but -webkit-app-region: drag handles it in CSS
    window = webview.create_window(
        'Groot AI', 
        'http://127.0.0.1:5173',
        width=1280,
        height=800,
        frameless=False,   # Standard window with title bar
        easy_drag=False,   # Handled by standard title bar
        background_color='#0f172a',
        resizable=True     # Allow user to resize
    )
    
    webview.start()

if __name__ == '__main__':
    launch_hud()
