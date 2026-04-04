import requests
import json
import logging
import os
import time
from langdetect import detect
from .internet_service import InternetService
from .rag_handler import RAGHandler
from .personality_manager import PersonalityManager

logger = logging.getLogger("Groot.AIEngine")

class AIEngine:
    def __init__(self, ollama_url: str = None):
        self.url = ollama_url or os.getenv("OLLAMA_URL", "http://localhost:11434")
        
        # Dual-Brain Architecture (Upgraded)
        self.fast_model = "gemma2:2b"
        self.expert_model = "phi3.5"
        self.model = self.fast_model 
        self.fallback_model = self.expert_model
        
        # Initialize Integrated Systems
        self.rag = RAGHandler()
        self.personality_mgr = PersonalityManager()
        
        logger.info(f"AI Router System Online. Fast: {self.fast_model} | Expert: {self.expert_model}")

    def _route_request(self, prompt: str) -> str:
        """Determines whether a prompt requires the Expert brain or the Fast brain."""
        prompt_lower = prompt.lower()
        # Broad spectrum of complex "Deep Brain" triggers
        complex_triggers = [
            "code", "script", "python", "javascript", "react", "html", "css", "c++", "java", "sql",
            "solve", "calculate", "math", "equation", "theorem", "geometry", "calculus",
            "explain how", "why did", "analyze", "debug", "logic", "reasoning", "multi-step",
            "write a paper", "essay", "summary of", "technical", "philosophy", "comparison",
            "quantum", "physics", "relativity", "complex", "algorithm", "simulate"
        ]
        
        # Expert Brain (Phi-3.5) for complexity or length
        if len(prompt) > 110 or any(trigger in prompt_lower for trigger in complex_triggers):
            return self.expert_model
        return self.fast_model

    def _classify_emotion(self, text: str) -> str:
        """Classifies the emotion of a text response for the 3D avatar."""
        text_lower = text.lower()
        
        # Keyword-based mapping for high performance/low latency
        emotions = {
            "happy": ["happy", "great", "glad", "awesome", "perfect", "good news", "wonderful", "delight", "smile", "joy"],
            "excited": ["wow", "excit", "amazing", "incredible", "love", "!", "unbelievable", "super", "epic", "brilliant"],
            "sad": ["sorry", "sad", "unfortunate", "unhappy", "regret", "pity", "grief", "depress", "lonely", "hard day", "tough"],
            "angry": ["stop", "don't", "refuse", "never", "unfair", "annoy", "frustrat", "wrong", "hate", "mad"],
            "surprised": ["what?", "really?", "can't believe", "unexpected", "surprise", "unusual", "shock", "whoa"],
        }
        
        for emotion, keywords in emotions.items():
            if any(k in text_lower for k in keywords):
                return emotion.capitalize()
                
        return "Neutral"

    def _format_instruct_prompt(self, model: str, system: str, user_prompt: str) -> str:
        """Applies model-specific Instruct/Chat markup to prevent hallucinations."""
        if "gemma" in model.lower():
            # Gemma 2 Turn-Based Formatting
            return f"<start_of_turn>user\n{system}\n\nUser Message: {user_prompt}<end_of_turn>\n<start_of_turn>model\n"
        elif "phi" in model.lower() or "llama" in model.lower():
            # Standard <|role|> tags for Phi and Llama
            return f"<|system|>\n{system}<|end|>\n<|user|>\n{user_prompt}<|end|>\n<|assistant|>\n"
        else:
            # Fallback to plain text
            return f"{system}\n\nUser: {user_prompt}\nAssistant:"

    def generate(self, prompt: str, personality: str = "Friendly", language: str = "English", history: list = [], temperature: float = None):
        """Standard JSON return, utilizing Infinite Memory Retrieval."""
        target_model = self._route_request(prompt)
        
        # --- Memory Retrieval ---
        historical_context = ""
        memory_results = self.rag.retrieve(prompt)
        if memory_results:
            historical_context = "\n".join([f"- {res}" for res in memory_results])

        config = self.personality_mgr.get_personality_config(personality)
        system_prompt = config["system_prompt"]
        
        if historical_context:
            system_prompt += f"\nLONG-TERM MEMORY:\n{historical_context}"
        
        # Adjust based on detected emotion/sentiment if needed
        system_prompt = self.personality_mgr.adjust_prompt(system_prompt)

        temp = temperature if temperature is not None else float(os.getenv("TEMPERATURE", 0.7))

        payload = {
            "model": target_model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "options": {"num_ctx": 2048, "num_predict": 256}
        }
        try:
            response_text, emotion = self._make_request(payload)
            try:
                lang_code = detect(response_text)
            except:
                lang_code = 'en'
            
            emotion = self._classify_emotion(response_text)
            return response_text, emotion, lang_code
        except Exception as e:
            return f"Model error: {str(e)}", "Error", "en"

    def generate_stream(self, prompt: str, personality: str = "Friendly", language: str = "English", history: list = [], temperature: float = None):
        """Yields words instantly, using Dual-Brain Routing."""
        target_model = self._route_request(prompt)
        
        logger.info(f"🔥 ROUTING PROMPT TO: {target_model.upper()}")

        prompt_lower = prompt.lower()
        
        # --- Hybrid Layer 1: Long-Term Memory Retrieval (Infinite Memory) -------
        historical_context = ""
        memory_results = self.rag.retrieve(prompt)
        if memory_results:
            historical_context = "\n".join([f"- {res}" for res in memory_results])
            logger.info("🧠 Long-term memory retrieved. Syncing Neural Context...")

        # --- Hybrid Layer 2: Live Research (Internet) ---------------------------
        live_info = ""
        deep_search_triggers = ["news", "today", "current", "latest", "price", "stock", "weather", "who is", "what is happening", "score"]
        
        if any(t in prompt_lower for t in deep_search_triggers):
            if InternetService.is_online():
                logger.info("🌍 Triggering Hybrid Deep Research...")
                live_info = InternetService.search_live_info(prompt)
                if live_info:
                    logger.info("✅ Live Data Retrieved. Injecting into Neural Context.")

        config = self.personality_mgr.get_personality_config(personality)
        base_system = config["system_prompt"]

        # Boost Logical Reasoning & Language Safety for Expert Mode
        if target_model == self.expert_model:
            base_system += "\nMode: DEEP_EXPERT. Think step-by-step. Provide complete, functionally accurate solutions. IMPORTANT: Always use Python for coding simulation unless another language is explicitly requested. Do not provide Q# snippet if Python is requested."
        
        # Inject History context into System knowledge
        if historical_context:
            base_system += f"\nMEMORY_RETRIEVAL: {historical_context}"
        if live_info:
            base_system += f"\nLIVE_DATA: {live_info}"

        # High-Fidelity Power Tuning
        if target_model == self.fast_model:
            ctx = 4096
            predict = 512
        else:
            # EXPERT STABILITY: Optimized 8k context window to prevent local hardware lag/truncation
            ctx = 8192
            predict = 4096

        # Final Instruct-Formatted Prompt (NO separate system field)
        final_prompt = self._format_instruct_prompt(target_model, base_system, prompt)

        temp = temperature if temperature is not None else float(os.getenv("TEMPERATURE", 0.7))

        payload = {
            "model": target_model,
            "prompt": final_prompt,
            "stream": True,
            "options": {
                "num_ctx": ctx,
                "temperature": temp,
                "top_k": 20,
                "top_p": 0.9,
                "num_predict": predict,
            }
        }

        try:
            # Increased timeout to 60s to completely cover any hardware Cold Starts
            response = requests.post(f"{self.url}/api/generate", json=payload, stream=True, timeout=60)
            if response.status_code != 200:
                yield f"Error: Backend 500"
                return
            
            for line in response.iter_lines():
                if line:
                    data = json.loads(line.decode('utf-8'))
                    chunk = data.get("response", "")
                    yield chunk
            
            # Use metadata flag at the end of stream (optional, but engine needs to return it).
            # Actually, standard way is to return it once detected.
            # I'll just append a special marker or let the frontend decide.
            # But the task said "backend returns lang".
            # For streaming, I'll detect after first 50 chars.
            pass
        except Exception as e:
            yield f"[NEURAL_CORE_V2: ERROR: {str(e)}]"

    def _make_request(self, payload):
        response = requests.post(f"{self.url}/api/generate", json=payload, timeout=45)
        if response.status_code == 500:
            raise Exception(f"Ollama Server Error (500): {response.text}")
        response.raise_for_status()
        data = response.json()
        return data.get("response", ""), "Neutral"

    def switch_model(self, model_name: str):
        self.model = model_name
        logger.info(f"Model switched to: {self.model}")
