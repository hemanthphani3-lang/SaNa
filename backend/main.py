from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import logging
import os

from core.ai_engine import AIEngine
from core.memory_manager import MemoryManager
from core.rag_handler import RAGHandler
from core.personality_manager import PersonalityManager
from core.hardware_detector import HardwareDetector
from services.phoneme_extractor import PhonemeExtractor
from routes import avatar

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SANKEYTHIKA")

app = FastAPI(title="SANKEYTHIKA AI Assistant API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(avatar.router, prefix="/api")

# Initialize Services
hardware = HardwareDetector()
capability = hardware.detect_capabilities()
logger.info(f"System Capability Level: {capability}")

ai_engine = AIEngine()
# Scale model based on capability
if capability == "LOW":
    ai_engine.switch_model("phi")
elif capability == "MINIMAL":
    ai_engine.switch_model("tinyllama")

memory = MemoryManager(db_path="backend/data/memory.db")
rag = RAGHandler(index_path="backend/data/faiss_index.bin")
personality = PersonalityManager()
phonemes = PhonemeExtractor()

class ChatRequest(BaseModel):
    message: str
    personality: str = "Friendly"
    language: str = "English"
    temperature: float = 0.9

class ChatResponse(BaseModel):
    response: str
    emotion: str
    viseme_timeline: List[dict]

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # 1. Retrieve Context (RAG)
        context = rag.retrieve(request.message)
        context_str = "\n".join(context)
        
        # 2. Get History
        history = memory.get_history()
        
        # 3. Get Personality
        pers_config = personality.get_personality_config(request.personality)
        
        # 4. Generate AI Response
        full_prompt = f"Context: {context_str}\nUser: {request.message}"
        response_text, emotion = ai_engine.generate(
            full_prompt, 
            personality=request.personality, 
            language=request.language,
            history=history,
            temperature=request.temperature
        )
        
        # 5. Save to Memory
        memory.add_message("user", request.message)
        memory.add_message("assistant", response_text)
        
        # 6. Generate Lip Sync Data
        raw_visemes = phonemes.get_visemes(response_text)
        # Mocking duration for now (approx 0.1s per char)
        duration = len(response_text) * 0.05 
        timeline = phonemes.map_audio_duration(raw_visemes, duration)
        
        return ChatResponse(
            response=response_text,
            emotion=emotion,
            viseme_timeline=timeline
        )
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
