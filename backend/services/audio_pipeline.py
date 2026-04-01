import whisper
import os
import logging
from typing import Optional

logger = logging.getLogger("SANKEYTHIKA.Audio")

class AudioPipeline:
    def __init__(self, model_size: str = "base"):
        self.model_size = model_size
        self._stt_model = None
        # In a real production app, we would load the model lazily or on startup
        # self._stt_model = whisper.load_model(model_size)

    def speech_to_text(self, audio_path: str) -> str:
        """
        Converts local audio file to text using OpenAI Whisper.
        """
        try:
            if self._stt_model is None:
                self._stt_model = whisper.load_model(self.model_size)
            
            result = self._stt_model.transcribe(audio_path)
            return result.get("text", "").strip()
        except Exception as e:
            logger.error(f"STT Error: {str(e)}")
            return ""

    def text_to_speech(self, text: str, output_path: str, voice: str = "en_US-lessac-medium.onnx"):
        """
        Converts text to speech using Piper TTS.
        Note: This assumes piper-tts is installed or available in PATH.
        """
        try:
            # Command: piper --model <model> --output_file <out>
            # For this demo, we'll use a subprocess call to piper
            import subprocess
            cmd = [
                "piper", 
                "--model", voice, 
                "--output_file", output_path
            ]
            process = subprocess.Popen(cmd, stdin=subprocess.PIPE)
            process.communicate(input=text.encode('utf-8'))
            return output_path
        except Exception as e:
            logger.error(f"TTS Error: {str(e)}")
            return None
