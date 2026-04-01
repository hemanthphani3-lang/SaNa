import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import os
import json
import logging

logger = logging.getLogger("SANKEYTHIKA.RAG")

class RAGHandler:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2", index_path: str = "data/faiss_index.bin"):
        self.model = SentenceTransformer(model_name)
        self.index_path = index_path
        self.dim = self.model.get_sentence_embedding_dimension()
        self.index = faiss.IndexFlatL2(self.dim)
        self.metadata = []
        self._load_index()

    def _load_index(self):
        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
            # Metadata would typically be stored in a JSON file alongside the index
            meta_path = self.index_path.replace(".bin", ".json")
            if os.path.exists(meta_path):
                with open(meta_path, "r") as f:
                    self.metadata = json.load(f)

    def add_documents(self, documents: list):
        """
        Expects a list of strings.
        """
        if not documents:
            return
        
        embeddings = self.model.encode(documents)
        self.index.add(np.array(embeddings).astype("float32"))
        self.metadata.extend(documents)
        self._save_index()

    def _save_index(self):
        faiss.write_index(self.index, self.index_path)
        meta_path = self.index_path.replace(".bin", ".json")
        with open(meta_path, "w") as f:
            json.dump(self.metadata, f)

    def retrieve(self, query: str, top_k: int = 3):
        if self.index.ntotal == 0:
            return []
        
        query_embedding = self.model.encode([query])
        distances, indices = self.index.search(np.array(query_embedding).astype("float32"), top_k)
        
        results = []
        for idx in indices[0]:
            if idx != -1 and idx < len(self.metadata):
                results.append(self.metadata[idx])
        
        return results
