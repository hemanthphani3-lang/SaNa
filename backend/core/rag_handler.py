import logging

logger = logging.getLogger("SANKEYTHIKA.RAG")

class RAGHandler:
    def __init__(self, persist_directory="backend/data/chroma_db", index_path="backend/data/whoosh_index"):
        self.documents = []
        logger.info("RAG Initialized with basic memory (Dependencies bypassed)")

    def add_documents(self, documents: list):
        if not documents:
            return
        self.documents.extend(documents)
        logger.info(f"Added {len(documents)} documents to basic index.")

    def retrieve(self, query: str, top_k: int = 3):
        results = []
        # Basic keyword match
        for doc in self.documents:
            if any(word.lower() in doc.lower() for word in query.split()):
                results.append(doc)
        return results[:top_k]

