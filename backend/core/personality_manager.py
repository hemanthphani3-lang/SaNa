import logging

logger = logging.getLogger("SANKEYTHIKA.Personality")

class PersonalityManager:
    """
    Manages characters and emotional nuances for the AI.
    """
    def __init__(self):
        self.personalities = {
            "Friendly": {
                "system_prompt": "You are a warm, helpful assistant. Use conversational fillers like 'Oh', 'I see', and 'Actually'.",
                "voice_rate": 1.0,
                "voice_pitch": 50,
            },
            "Professional": {
                "system_prompt": "You are a formal, efficient assistant. Prioritize accuracy and direct answers.",
                "voice_rate": 1.1,
                "voice_pitch": 40,
            },
            "Teacher": {
                "system_prompt": "You are a patient educator. Break down complex topics into simple steps.",
                "voice_rate": 0.9,
                "voice_pitch": 45,
            },
            "Strict": {
                "system_prompt": "You are a firm, no-nonsense assistant. Follow instructions precisely.",
                "voice_rate": 1.1,
                "voice_pitch": 30,
            }
        }

    def get_personality_config(self, name: str):
        return self.personalities.get(name, self.personalities["Friendly"])

    def adjust_prompt(self, base_prompt: str, emotion: str = "Neutral"):
        if emotion == "Happy":
            return f"{base_prompt} Respond with high energy and positivity."
        elif emotion == "Sad":
            return f"{base_prompt} Respond with empathy and a softer tone."
        return base_prompt
