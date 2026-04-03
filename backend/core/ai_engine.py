import requests
import json
import logging
import os
import time

logger = logging.getLogger("SANKEYTHIKA.AIEngine")

class AIEngine:
    def __init__(self, ollama_url: str = None):
        self.url = ollama_url or os.getenv("OLLAMA_URL", "http://localhost:11434")
        
        # Dual-Brain Architecture
        self.fast_model = "tinyllama"
        self.expert_model = "phi3:mini"
        self.model = self.fast_model # For legacy code fallback
        self.fallback_model = self.expert_model
        
        logger.info(f"AI Router System Online. Fast: {self.fast_model} | Expert: {self.expert_model}")

    def _route_request(self, prompt: str) -> str:
        """Determines whether a prompt requires the Expert brain or the Fast brain."""
        prompt_lower = prompt.lower()
        complex_triggers = ["code", "script", "python", "javascript", "react", "html", "css", 
                            "solve", "calculate", "math", "equation", "theorem", 
                            "explain how", "why did", "analyze", "debug"]
        
        # If the question is long, or uses complex keywords, route to the Professor (Phi-3)
        if len(prompt) > 150 or any(trigger in prompt_lower for trigger in complex_triggers):
            return self.expert_model
        return self.fast_model

    def generate(self, prompt: str, personality: str = "Friendly", language: str = "English", history: list = [], temperature: float = None):
        """Legacy JSON return. Use generate_stream for fast text output."""
        target_model = self._route_request(prompt)
        system_prompt = f"You are SANKEYTHIKA, an AI assistant. Respond in {language}."
        temp = temperature if temperature is not None else float(os.getenv("TEMPERATURE", 0.7))

        payload = {
            "model": target_model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "options": {"num_ctx": 1024, "num_predict": 100}
        }
        try:
            return self._make_request(payload)
        except Exception as e:
            return f"Model error: {str(e)}", "Error"

    def generate_stream(self, prompt: str, personality: str = "Friendly", language: str = "English", history: list = [], temperature: float = None):
        """Yields words instantly, using Dual-Brain Routing."""
        target_model = self._route_request(prompt)
        
        logger.info(f"🔥 ROUTING PROMPT TO: {target_model.upper()}")

        if target_model == self.fast_model:
            system_prompt = f"You are SANKEYTHIKA, an AI assistant with a {personality} personality. " \
                            f"Respond in {language}. Keep the answer EXTREMELY brief. 1 or 2 sentences ONLY."
            ctx = 1024
            predict = 100
        else:
            system_prompt = f"You are SANKEYTHIKA, a highly intelligent expert AI. " \
                            f"Respond deeply and accurately to the user's complex request in {language}."
            ctx = 4096
            predict = 512

        temp = temperature if temperature is not None else float(os.getenv("TEMPERATURE", 0.7))

        payload = {
            "model": target_model,
            "prompt": prompt,
            "system": system_prompt,
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
                    yield data.get("response", "")
        except Exception as e:
            yield f"[Network/Model Error: {str(e)}]"

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
