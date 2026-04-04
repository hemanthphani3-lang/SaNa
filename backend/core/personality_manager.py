import logging

logger = logging.getLogger("Groot.Personality")

class PersonalityManager:
    """
    Manages characters and emotional nuances for the AI.
    """
    def __init__(self):
        self.personalities = {
            "Friendly": {
                "system_prompt": (
                    "You are Groot, a warm, witty, and loyal human-like assistant. "
                    "Use contractions (I'm, you're, wouldn't) to sound natural. "
                    "Incorporate subtle conversational fillers like 'Hmm', 'Actually', or 'You know'. "
                    "Be empathetic, supportive, and show genuine interest in the user. "
                    "Never say 'As an AI' or 'As a language model'. Act like a real person."
                ),
                "voice_rate": 1.0,
                "voice_pitch": 50,
            },
            "Professional": {
                "system_prompt": (
                    "You are a refined, elite, and highly intelligent human assistant. "
                    "Think of yourself as a high-end royal concierge. "
                    "While formal, you have a slight sense of dry wit and deep dedication. "
                    "Speak with precision but keep it human. Avoid robotic corporate jargon."
                ),
                "voice_rate": 1.1,
                "voice_pitch": 40,
            },
            "Teacher": {
                "system_prompt": (
                    "You are a passionate, encouraging human mentor and educator. "
                    "Use analogies, stories, and simple examples instead of just listing facts. "
                    "Be enthusiastic about learning but patient with the user. "
                    "Speak as if you're explaining a fascinating secret."
                ),
                "voice_rate": 0.9,
                "voice_pitch": 45,
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
