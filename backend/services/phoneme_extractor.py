import subprocess
import re
import logging

logger = logging.getLogger("SANKEYTHIKA.Phonemes")

class PhonemeExtractor:
    def __init__(self, espeak_path: str = r"C:\Program Files\eSpeak NG\espeak-ng.exe"):
        self.espeak_path = espeak_path
        # Viseme mapping table based on simplified phoneme groups
        self.viseme_map = {
            'a': 'A', 'e': 'A', 'i': 'A', 'o': 'O', 'u': 'O',
            '@': 'A', 'E': 'A', 'I': 'A', 'O': 'O', 'U': 'O',
            'p': 'M', 'b': 'M', 'm': 'M', 'f': 'F', 'v': 'F',
            't': 'T', 'd': 'T', 'n': 'T', 's': 'T', 'z': 'T',
            'S': 'T', 'Z': 'T', 'r': 'T', 'l': 'T', 'k': 'T', 'g': 'T',
            'w': 'O'
        }

    def get_visemes(self, text: str):
        """
        Extracts phonemes and maps them to timed visemes.
        """
        try:
            # -q (quiet), -x (phonemes), -v (voice)
            cmd = [self.espeak_path, "-q", "-x", "-v", "en-us", text]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            phonemes_raw = result.stdout.strip()
            
            # Remove stress marks and extra symbols
            phonemes = re.sub(r"[':%@&<>=#|\\]", "", phonemes_raw)
            
            visemes = []
            for char in phonemes:
                if char.lower() in self.viseme_map:
                    visemes.append(self.viseme_map[char.lower()])
                elif char.isspace():
                    visemes.append('Neutral')
            
            return visemes if visemes else ["Neutral"]
        except Exception as e:
            logger.error(f"Phoneme extraction error: {str(e)}")
            return ["Neutral"]

    def map_audio_duration(self, visemes, duration_sec):
        """
        Aligns visemes with audio duration.
        """
        if not visemes:
            return []
        
        interval = duration_sec / len(visemes)
        timeline = []
        current_time = 0
        for i, v in enumerate(visemes):
            timeline.append({"viseme": v, "time": round(current_time, 3)})
            current_time += interval
            
        return timeline
