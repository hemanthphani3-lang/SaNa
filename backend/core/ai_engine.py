import requests
import json
import logging
import os

logger = logging.getLogger("SANKEYTHIKA.AIEngine")

class AIEngine:
    def __init__(self, ollama_url: str = None):
        self.url = ollama_url or os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.model = os.getenv("DEFAULT_MODEL", "llama3:latest")
        logger.info(f"AI Engine initialized with model: {self.model}")

    def generate(self, prompt: str, personality: str = "Friendly", language: str = "English", history: list = [], temperature: float = None):
        """
        Generates a response using Ollama local API.
        Optimized for speed.
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
                "num_predict": 256, # Limit length for speed
            }
        }

        try:
            response = requests.post(f"{self.url}/api/generate", json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data.get("response", ""), "Neutral"
        except Exception as e:
            logger.error(f"Ollama generation error: {str(e)}")
            return f"Model error: {str(e)}", "Error"

    def switch_model(self, model_name: str):
        self.model = model_name
        logger.info(f"Model switched to: {self.model}")
