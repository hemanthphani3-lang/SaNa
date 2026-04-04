import sqlite3
import zipfile
import os
import tempfile
import logging

logger = logging.getLogger("Groot.RAG")

class RAGHandler:
    def __init__(self, archives_dir="backend/data/archives", active_db="backend/data/memory.db"):
        self.archives_dir = os.path.abspath(archives_dir)
        self.active_db = os.path.abspath(active_db)
        os.makedirs(self.archives_dir, exist_ok=True)
        logger.info(f"Groot RAG System Online. Scanning: {self.archives_dir}")

    def retrieve(self, query: str, top_k: int = 5):
        """Retrieves context from both active memory and zipped archives."""
        results = []
        
        # 1. Search Active Memory
        results.extend(self._search_db(self.active_db, query))
        
        # 2. Search Archives if needed
        if len(results) < top_k:
            archive_results = self._search_archives(query)
            results.extend(archive_results)
            
        return list(set(results))[:top_k]

    def _search_db(self, db_path, query):
        """Standard SQLite search helper."""
        if not os.path.exists(db_path):
            return []
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            # Simple keyword match for now; can be upgraded to FTS5
            cursor.execute("SELECT content FROM conversation WHERE content LIKE ? LIMIT 5", (f'%{query}%',))
            rows = cursor.fetchall()
            conn.close()
            return [row[0] for row in rows]
        except Exception as e:
            logger.error(f"Search error in {db_path}: {e}")
            return []

    def _search_archives(self, query):
        """Iterates through zipped archives and searches them."""
        results = []
        zip_files = [f for f in os.listdir(self.archives_dir) if f.endswith(".zip")]
        
        # Limit to last 5 archives to prevent performance lag
        for zip_name in sorted(zip_files, reverse=True)[:5]:
            zip_path = os.path.join(self.archives_dir, zip_name)
            try:
                with zipfile.ZipFile(zip_path, 'r') as zipf:
                    # Extract to a temporary directory
                    with tempfile.TemporaryDirectory() as tmpdir:
                        zipf.extractall(tmpdir)
                        # Find the .db file inside
                        for file in os.listdir(tmpdir):
                            if file.endswith(".db"):
                                results.extend(self._search_db(os.path.join(tmpdir, file), query))
            except Exception as e:
                logger.error(f"Archive search error in {zip_name}: {e}")
                
        return results

