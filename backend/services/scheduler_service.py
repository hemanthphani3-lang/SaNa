import schedule
import time
import threading
import json
import os
import uuid
import logging
from datetime import datetime
from plyer import notification
import requests

logger = logging.getLogger("SANKEYTHIKA.Scheduler")

class SchedulerService:
    def __init__(self, storage_path="backend/data/schedules.json"):
        self.storage_path = storage_path
        self.schedules = []
        self.load_schedules()
        self.stop_run_continue = threading.Event()
        self.thread = threading.Thread(target=self._run_scheduler)
        self.thread.daemon = True
        self.thread.start()

    def load_schedules(self):
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, "r") as f:
                    self.schedules = json.load(f)
                    # Re-schedule existing ones
                    for item in self.schedules:
                        self._schedule_item(item)
            except Exception as e:
                logger.error(f"Failed to load schedules: {e}")
                self.schedules = []

    def save_schedules(self):
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        with open(self.storage_path, "w") as f:
            json.dump(self.schedules, f)

    def _schedule_item(self, item):
        # We handle reminders as one-off timers or recurring
        # For simplicity, we'll implement a 'run_at' check in the loop
        pass

    def add_reminder(self, title, message, reminder_time):
        """
        reminder_time: ISO format string
        """
        task_id = str(uuid.uuid4())
        new_item = {
            "id": task_id,
            "title": title,
            "message": message,
            "time": reminder_time,
            "status": "pending"
        }
        self.schedules.append(new_item)
        self.save_schedules()
        logger.info(f"Reminder added: {title} at {reminder_time}")
        return task_id

    def _run_scheduler(self):
        while not self.stop_run_continue.is_set():
            now = datetime.now()
            for item in self.schedules:
                if item["status"] == "pending":
                    try:
                        rem_time = datetime.fromisoformat(item["time"])
                        if now >= rem_time:
                            self._trigger_reminder(item)
                    except Exception as e:
                        logger.error(f"Error checking reminder {item['id']}: {e}")
            
            time.sleep(5) # Check every 5 seconds

    def _trigger_reminder(self, item):
        logger.info(f"🔔 TRIGGERING REMINDER: {item['title']}")
        
        # 1. System Notification
        try:
            notification.notify(
                title=f"Groot: {item['title']}",
                message=item['message'],
                app_name="SANKEYTHIKA",
                timeout=10
            )
        except Exception as e:
            logger.error(f"Notification error: {e}")

        # 2. Update status
        item["status"] = "completed"
        self.save_schedules()

        # 3. Tell Groot to speak (we attempt a local broadcast or wait for frontend to poll)
        # For now, we'll log it. In a full implementation, this would trigger a websocket event.
        # We can also use espeak-ng locally if available for TRUE offline background speech.
        try:
            os.system(f'espeak "{item["message"]}"')
        except:
            pass

    def get_all(self):
        return self.schedules

    def delete_reminder(self, task_id):
        self.schedules = [s for s in self.schedules if s["id"] != task_id]
        self.save_schedules()
        return True
