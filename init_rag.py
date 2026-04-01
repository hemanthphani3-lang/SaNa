import os
import sys

# Add current directory to path so we can import core
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.core.rag_handler import RAGHandler

def main():
    print("Initializing SANKEYTHIKA RAG Data...")
    
    # Initialize RAG handler
    rag = RAGHandler(index_path="backend/data/faiss_index.bin")
    
    # Initial documents to prime the assistant
    initial_docs = [
        "SANKEYTHIKA is an advanced AI assistant designed for multimodal interaction including voice, emotion, and 3D visualization.",
        "The assistant uses Ollama for local LLM inference, switching between Mistral, Phi, and TinyLlama based on hardware capabilities.",
        "RAG (Retrieval-Augmented Generation) is used to provide context-aware responses by indexing project documentation and user knowledge.",
        "Voice synthesis is powered by eSpeak-NG and phoneme extraction for realistic lip-synchronization.",
        "The system architecture consists of a FastAPI backend, a React/Vite frontend, and a React Native (Expo) mobile app."
    ]
    
    print(f"Adding {len(initial_docs)} initial context documents to index...")
    rag.add_documents(initial_docs)
    print("RAG Index Initialized successfully at backend/data/faiss_index.bin")

if __name__ == "__main__":
    main()
