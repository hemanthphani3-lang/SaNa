import requests
import json
import logging

logger = logging.getLogger("SANKEYTHIKA.AIEngine")

class AIEngine:
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.url = ollama_url
        self.model = "mistral" # Default for PC

    def generate(self, prompt: str, personality: str = "Friendly", language: str = "English", history: list = []):
        """
        Generates a response using Ollama local API.
        """
        system_prompt = f"You are SANKEYTHIKA, an AI assistant with a {personality} personality. " \
                        f"Respond in {language}. Keep the answer brief and human-like."

        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "options": {
                "num_ctx": 4096,
                "temperature": 0.7
            }
        }

        try:
            response = requests.post(f"{self.url}/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("response", ""), "Neutral" # Placeholder for emotion detection
        except Exception as e:
            logger.error(f"Ollama generation error: {str(e)}")
            return f"Model error: {str(e)}", "Error"

    def switch_model(self, model_name: str):
        self.model = model_name
