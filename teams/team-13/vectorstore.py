import os
import faiss
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

INDEX_PATH = "faiss_index/index.faiss"
CHUNKS_PATH = "faiss_index/chunks.pkl"


def build_vectorstore(chunks):
    os.makedirs("faiss_index", exist_ok=True)
    embeddings = model.encode(chunks, show_progress_bar=True)
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(np.array(embeddings))
    faiss.write_index(index, INDEX_PATH)
    with open(CHUNKS_PATH, "wb") as f:
        pickle.dump(chunks, f)
    return index, chunks


def load_vectorstore():
    index = faiss.read_index(INDEX_PATH)
    with open(CHUNKS_PATH, "rb") as f:
        chunks = pickle.load(f)
    return index, chunks


def search_regulations(query, index, chunks, k=5):
    query_embedding = model.encode([query])
    distances, indices = index.search(np.array(query_embedding), k)
    results = [chunks[i] for i in indices[0] if i < len(chunks)]
    return results


def vectorstore_exists():
    return os.path.exists(INDEX_PATH) and os.path.exists(CHUNKS_PATH)
