import subprocess
import os
import platform
import logging

logger = logging.getLogger("SANKEYTHIKA.Hardware")

class HardwareDetector:
    @staticmethod
    def get_ram_gb():
        try:
            if platform.system() == "Windows":
                cmd = ["wmic", "ComputerSystem", "get", "TotalPhysicalMemory"]
                result = subprocess.run(cmd, capture_output=True, text=True)
                # Parse output like: TotalPhysicalMemory \n 17179869184
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:
                    mem_bytes = int(lines[1].strip())
                    return mem_bytes / (1024**3)
            return 8 # Default
        except Exception:
            return 8

    @staticmethod
    def get_gpu_vram_gb():
        try:
            # Check for NVIDIA GPU
            cmd = ["nvidia-smi", "--query-gpu=memory.total", "--format=csv,noheader,nounits"]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                vram_mb = int(result.stdout.strip())
                return vram_mb / 1024
            return 0
        except Exception:
            return 0

    def detect_capabilities(self):
        ram = self.get_ram_gb()
        vram = self.get_gpu_vram_gb()
        
        logger.info(f"Detected RAM: {ram:.2f} GB, VRAM: {vram:.2f} GB")
        
        if vram >= 6:
            return "HIGH" # Mistral 7B (NVIDIA GPU)
        elif ram >= 16:
            return "MEDIUM" # Mistral 7B (CPU/Low GPU)
        elif ram >= 4:
            return "LOW" # Phi-2 / TinyLlama
        else:
            return "MINIMAL" # Offline fallback/Simple responses
