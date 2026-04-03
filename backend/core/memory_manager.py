import sqlite3
import json
import os
import logging
import base64

logger = logging.getLogger("SANKEYTHIKA.Memory")

class MemoryManager:
    def __init__(self, db_path: str = "backend/data/memory.db", secret_key: str = "sankeythika-fallback-key"):
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.db_path = db_path
        # Key bypassed
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self._setup_db()

    def _get_or_create_key(self, fallback):
        key_path = "backend/data/.secret.key"
        if os.path.exists(key_path):
            with open(key_path, "rb") as f:
                return f.read()
        else:
            # Derive a 32-byte key
            salt = b'sankey_salt_123'
            key = PBKDF2(fallback, salt, dkLen=32, count=1000)
            with open(key_path, "wb") as f:
                f.write(key)
            return key

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
