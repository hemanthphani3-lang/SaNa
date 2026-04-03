import psutil
import pyautogui
import logging
import os
import subprocess

try:
    import pynvml
    PNVML_AVAILABLE = True
except ImportError:
    PNVML_AVAILABLE = False

logger = logging.getLogger("SANKEYTHIKA.SystemService")

class SystemService:
    def __init__(self):
        pyautogui.FAILSAFE = True
        self.nvml_initialized = False
        if PNVML_AVAILABLE:
            try:
                pynvml.nvmlInit()
                self.nvml_initialized = True
                logger.info("NVIDIA Management Library (NVML) initialized.")
            except Exception as e:
                logger.warning(f"Failed to initialize NVML: {e}")

    def get_stats(self):
        """Returns CPU, RAM, Battery, and GPU (if on PC) status."""
        stats = {
            "cpu": psutil.cpu_percent(interval=None),
            "ram": psutil.virtual_memory().percent,
        }
        
        # Battery fallback for mobile/laptop
        try:
            battery = psutil.sensors_battery()
            stats["battery"] = battery.percent if battery else "N/A"
            stats["charging"] = battery.power_plugged if battery else "N/A"
        except:
            stats["battery"] = "N/A"

        # GPU Stats for PC (NVIDIA)
        if self.nvml_initialized:
            try:
                handle = pynvml.nvmlDeviceGetHandleByIndex(0)
                util = pynvml.nvmlDeviceGetUtilizationRates(handle)
                mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
                temp = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
                
                stats["gpu"] = {
                    "name": pynvml.nvmlDeviceGetName(handle).decode('utf-8') if isinstance(pynvml.nvmlDeviceGetName(handle), bytes) else pynvml.nvmlDeviceGetName(handle),
                    "load": util.gpu,
                    "memory": int(mem.used / mem.total * 100),
                    "temp": temp
                }
            except Exception as e:
                logger.error(f"Error getting GPU stats: {e}")
        
        return stats

    def execute_command(self, action, target=None):
        """Executes automation commands via pyautogui or OS."""
        logger.info(f"Executing system action: {action} on {target}")
        
        try:
            if action == "open":
                if os.name == 'nt':
                    os.startfile(target)
                else:
                    subprocess.Popen(['xdg-open', target])
                return True
            elif action == "type":
                pyautogui.write(target, interval=0.1)
                return True
            elif action == "press":
                pyautogui.press(target)
                return True
            elif action == "hotkey":
                if isinstance(target, list):
                    pyautogui.hotkey(*target)
                return True
            return False
        except Exception as e:
            logger.error(f"Automation error: {e}")
            return False

    def __del__(self):
        if hasattr(self, 'nvml_initialized') and self.nvml_initialized:
            try:
                pynvml.nvmlShutdown()
            except:
                pass
