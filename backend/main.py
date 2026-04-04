from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from core.ai_engine import AIEngine
from core.memory_manager import MemoryManager
from core.rag_handler import RAGHandler
from core.personality_manager import PersonalityManager
from core.hardware_detector import HardwareDetector
from services.phoneme_extractor import PhonemeExtractor
from services.scheduler_service import SchedulerService
from services.system_service import SystemService
from routes import avatar

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Groot")

app = FastAPI(title="Groot AI Assistant API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(avatar.router, prefix="/api")

@app.get("/")
async def root():
    return {"status": "Groot Backend Online", "version": "1.0.0"}

# Initialize Services
hardware = HardwareDetector()
capability = hardware.detect_capabilities()
logger.info(f"System Capability Level: {capability}")

ai_engine = AIEngine()
memory = MemoryManager()
rag = RAGHandler()
personality = PersonalityManager()
phonemes = PhonemeExtractor()
scheduler = SchedulerService()
system_utils = SystemService()

class ChatRequest(BaseModel):
    message: str
    personality: str = "Friendly"
    language: str = "English"
    temperature: float = 0.9

class ChatResponse(BaseModel):
    response: str
    emotion: str
    lang: str
    viseme_timeline: List[dict]

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        history = memory.get_history()
        
        response_text, emotion, lang = ai_engine.generate(
            request.message, 
            personality=request.personality, 
            language=request.language,
            history=history,
            temperature=request.temperature
        )
        
        memory.add_message("user", request.message)
        memory.add_message("assistant", response_text)
        
        raw_visemes = phonemes.get_visemes(response_text)
        duration = len(response_text) * 0.05 
        timeline = phonemes.map_audio_duration(raw_visemes, duration)
        
        return ChatResponse(
            response=response_text,
            emotion=emotion,
            lang=lang,
            viseme_timeline=timeline
        )
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat_stream")
async def chat_stream(request: ChatRequest):
    try:
        history = memory.get_history()
        
        def event_stream():
            total_reply = ""
            for token in ai_engine.generate_stream(
                request.message, 
                personality=request.personality, 
                language=request.language,
                history=history,
                temperature=request.temperature
            ):
                total_reply += token
                yield token
            
            # Save memory after completion
            memory.add_message("user", request.message)
            memory.add_message("assistant", total_reply)

        return StreamingResponse(event_stream(), media_type="text/plain")
    except Exception as e:
        logger.error(f"Chat stream error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- New Scheduler Routes ---

@app.get("/api/notifications")
async def get_notifications():
    alerts = scheduler.pop_alerts()
    return {"alerts": alerts}

class ReminderRequest(BaseModel):
    title: str
    message: str
    time: str # ISO Format

@app.post("/api/schedule/add")
async def add_reminder(request: ReminderRequest):
    task_id = scheduler.add_reminder(request.title, request.message, request.time)
    return {"status": "success", "id": task_id}

@app.get("/api/schedule/all")
async def get_reminders():
    return scheduler.get_all()

@app.delete("/api/schedule/{task_id}")
async def delete_reminder(task_id: str):
    scheduler.delete_reminder(task_id)
    return {"status": "deleted"}

# --- New System Routes ---

@app.get("/api/system/stats")
async def get_system_stats():
    return system_utils.get_stats()

class SystemCommand(BaseModel):
    action: str
    target: Optional[str] = None

@app.post("/api/system/execute")
async def execute_system_command(cmd: SystemCommand):
    success = system_utils.execute_command(cmd.action, cmd.target)
    if not success:
        raise HTTPException(status_code=400, detail="Command execution failed")
    return {"status": "success"}

@app.get("/api/chat/history")
async def get_chat_history(limit: int = 50):
    """Returns conversation history for the History Archives view."""
    history = memory.get_history(limit=limit)
    return {"history": history, "count": len(history)}

@app.get("/api/system/health")
async def system_health():
    """Comprehensive check of all offline services."""
    import socket
    def port_open(port):
        try:
            s = socket.socket()
            s.settimeout(0.5)
            s.connect(('127.0.0.1', port))
            s.close()
            return True
        except:
            return False

    return {
        "api": "online",
        "ollama": "connected" if port_open(11434) else "offline",
        "rag": "initialized",
        "gpu": hardware.detect_capabilities(),
        "scheduler": "active" if hasattr(scheduler, 'running') and scheduler.running else "inactive"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
