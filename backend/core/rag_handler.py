import os
import json
import logging
import chromadb
from chromadb.utils import embedding_functions
from whoosh.index import create_in, open_dir
from whoosh.fields import Schema, TEXT, ID
from whoosh.qparser import QueryParser
import numpy as np

logger = logging.getLogger("SANKEYTHIKA.RAG")

class RAGHandler:
    def __init__(self, persist_directory="backend/data/chroma_db", index_path="backend/data/whoosh_index"):
        self.persist_directory = persist_directory
        self.index_path = index_path
        
        # 1. Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(path=self.persist_directory)
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
        self.collection = self.chroma_client.get_or_create_collection(
            name="knowledge_base", 
            embedding_function=self.embedding_fn
        )

        # 2. Initialize Whoosh (Keyword Search)
        self.schema = Schema(id=ID(stored=True, unique=True), content=TEXT(stored=True))
        if not os.path.exists(self.index_path):
            os.makedirs(self.index_path)
            self.whoosh_idx = create_in(self.index_path, self.schema)
        else:
            self.whoosh_idx = open_dir(self.index_path)

    def add_documents(self, documents: list):
        if not documents:
            return
        
        # Add to ChromaDB
        ids = [f"doc_{i}_{os.urandom(4).hex()}" for i in range(len(documents))]
        self.collection.add(documents=documents, ids=ids)

        # Add to Whoosh
        writer = self.whoosh_idx.writer()
        for i, doc in enumerate(documents):
            writer.add_document(id=ids[i], content=doc)
        writer.commit()
        
        logger.info(f"Added {len(documents)} documents to hybrid index.")

    def retrieve(self, query: str, top_k: int = 3):
        results = []
        
        # 1. Vector Search (ChromaDB)
        vector_results = self.collection.query(query_texts=[query], n_results=top_k)
        if vector_results['documents']:
            results.extend(vector_results['documents'][0])

        # 2. Keyword Search (Whoosh)
        try:
            with self.whoosh_idx.searcher() as searcher:
                parser = QueryParser("content", self.whoosh_idx.schema)
                q = parser.parse(query)
                keyword_results = searcher.search(q, limit=top_k)
                for hit in keyword_results:
                    if hit['content'] not in results:
                        results.append(hit['content'])
        except Exception as e:
            logger.error(f"Whoosh search error: {e}")

        return results[:top_k]
