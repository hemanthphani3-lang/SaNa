import subprocess
import os
import platform
import logging

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

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
        
        # Check Torch Device support
        device = "cpu"
        if TORCH_AVAILABLE:
            if torch.cuda.is_available():
                device = "cuda"
            elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                device = "mps"
        
        logger.info(f"Detected RAM: {ram:.2f} GB, VRAM: {vram:.2f} GB, AI Device: {device}")
        
        if vram >= 6 or device == "cuda":
            return "HIGH" # Optimized for Llama3/Mistral with GPU acceleration
        elif ram >= 16:
            return "MEDIUM" # Large models possible on CPU
        elif ram >= 4:
            return "LOW" # Small models (Phi-2)
        else:
            return "MINIMAL" # Fallback mode
