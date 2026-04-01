import sqlite3
import json
import os
import logging

logger = logging.getLogger("SANKEYTHIKA.Memory")

class MemoryManager:
    def __init__(self, db_path: str = "data/memory.db"):
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self._setup_db()

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
        cursor = self.conn.cursor()
        cursor.execute("INSERT INTO conversation (role, content) VALUES (?, ?)", (role, content))
        self.conn.commit()

    def get_history(self, limit: int = 10):
        cursor = self.conn.cursor()
        cursor.execute("SELECT role, content FROM conversation ORDER BY timestamp DESC LIMIT ?", (limit,))
        history = [{"role": r, "content": c} for r, c in cursor.fetchall()]
        return history[::-1] # Reverse to chronological

    def set_preference(self, key: str, value: str):
        cursor = self.conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO user_preferences (key, value) VALUES (?, ?)", (key, value))
        self.conn.commit()

    def get_preference(self, key: str, default: str = None):
        cursor = self.conn.cursor()
        cursor.execute("SELECT value FROM user_preferences WHERE key = ?", (key,))
        row = cursor.fetchone()
        return row[0] if row else default
