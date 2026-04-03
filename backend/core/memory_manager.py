import sqlite3
import json
import os
import logging
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Protocol.KDF import PBKDF2

logger = logging.getLogger("SANKEYTHIKA.Memory")

class MemoryManager:
    def __init__(self, db_path: str = "backend/data/memory.db", secret_key: str = "sankeythika-fallback-key"):
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.db_path = db_path
        self.key = self._get_or_create_key(secret_key)
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
        if not text: return text
        cipher = AES.new(self.key, AES.MODE_CBC)
        ct_bytes = cipher.encrypt(pad(text.encode(), AES.block_size))
        return base64.b64encode(cipher.iv + ct_bytes).decode('utf-8')

    def _decrypt(self, data):
        if not data: return data
        try:
            raw = base64.b64decode(data)
            iv = raw[:16]
            ct = raw[16:]
            cipher = AES.new(self.key, AES.MODE_CBC, iv)
            return unpad(cipher.decrypt(ct), AES.block_size).decode('utf-8')
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return "[Encrypted Data]"

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
