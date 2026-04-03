import requests
import json
import logging
import os
import time

logger = logging.getLogger("SANKEYTHIKA.AIEngine")

class AIEngine:
    def __init__(self, ollama_url: str = None):
        self.url = ollama_url or os.getenv("OLLAMA_URL", "http://localhost:11434")
        # Use Phi-3 Mini as default for better reliability on all hardware
        self.model = os.getenv("DEFAULT_MODEL", "phi3:mini")
        self.fallback_model = "tinyllama"
        logger.info(f"AI Engine initialized with model: {self.model}")

    def generate(self, prompt: str, personality: str = "Friendly", language: str = "English", history: list = [], temperature: float = None):
        """
        Generates a response using Ollama local API.
        Includes a fallback mechanism for Out-Of-Memory errors.
        """
        system_prompt = f"You are SANKEYTHIKA, an AI assistant with a {personality} personality. " \
                        f"Respond in {language}. Keep the answer brief and human-like."

        temp = temperature if temperature is not None else float(os.getenv("TEMPERATURE", 0.7))

        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "options": {
                "num_ctx": 4096,
                "temperature": temp,
                "top_k": 20,
                "top_p": 0.9,
                "num_predict": 256,
            }
        }

        try:
            return self._make_request(payload)
        except Exception as e:
            if "out of memory" in str(e).lower() or "500" in str(e):
                logger.warning(f"Primary model {self.model} failed (OOM/500). Falling back to {self.fallback_model}")
                payload["model"] = self.fallback_model
                try:
                    return self._make_request(payload)
                except Exception as fe:
                    return f"System exhausted: {str(fe)}", "Error"
            
            logger.error(f"Ollama generation error: {str(e)}")
            return f"Model error: {str(e)}", "Error"

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
