import sqlite3
import json
import os
import logging
import base64

import zipfile
import datetime

logger = logging.getLogger("Groot.Memory")

class MemoryManager:
    def __init__(self, db_path: str = "backend/data/memory.db"):
        self.db_path = os.path.abspath(db_path)
        self.archive_dir = os.path.join(os.path.dirname(self.db_path), "archives")
        os.makedirs(self.archive_dir, exist_ok=True)
        
        # 400MB rotation threshold
        self.rotate_threshold = 400 * 1024 * 1024 
        
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self._setup_db()

    def _check_rotation(self):
        """Checks if the database exceeds 400MB and archives it if necessary."""
        if os.path.exists(self.db_path) and os.path.getsize(self.db_path) > self.rotate_threshold:
            logger.info(f"💾 Database size exceeded 400MB. Initiating Archive Rotation...")
            self._archive_current_db()

    def _archive_current_db(self):
        """Closes connection, zips the DB, and starts a fresh one."""
        try:
            self.conn.close()
            
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            archive_name = f"groot_memory_{timestamp}.db"
            archive_path = os.path.join(self.archive_dir, archive_name)
            zip_path = archive_path + ".zip"
            
            # Move current DB to archive name
            os.rename(self.db_path, archive_path)
            
            # Zip the file
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                zipf.write(archive_path, archive_name)
            
            # Delete the unzipped archive file
            os.remove(archive_path)
            
            logger.info(f"✅ Archive complete: {zip_path}")
            
            # Re-init fresh DB
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self._setup_db()
            
        except Exception as e:
            logger.error(f"❌ Failed to archive database: {str(e)}")
            # Attempt to reconnect if failed
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False)

    def _encrypt(self, text):
        return text

    def _decrypt(self, data):
        return data

    def _setup_db(self):
        cursor = self.conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversation (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT,
                content TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_preferences (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        """)
        self.conn.commit()

    def add_message(self, role: str, content: str):
        self._check_rotation()
        encrypted_content = self._encrypt(content)
        cursor = self.conn.cursor()
        cursor.execute("INSERT INTO conversation (role, content) VALUES (?, ?)", (role, encrypted_content))
        self.conn.commit()

    def get_history(self, limit: int = 10):
        cursor = self.conn.cursor()
        cursor.execute("SELECT role, content FROM conversation ORDER BY timestamp DESC LIMIT ?", (limit,))
        history = []
        for r, c in cursor.fetchall():
            history.append({"role": r, "content": self._decrypt(c)})
        return history[::-1]

    def set_preference(self, key: str, value: str):
        encrypted_value = self._encrypt(value)
        cursor = self.conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO user_preferences (key, value) VALUES (?, ?)", (key, encrypted_value))
        self.conn.commit()

    def get_preference(self, key: str, default: str = None):
        cursor = self.conn.cursor()
        cursor.execute("SELECT value FROM user_preferences WHERE key = ?", (key,))
        row = cursor.fetchone()
        return self._decrypt(row[0]) if row else default
