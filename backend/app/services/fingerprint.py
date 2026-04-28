import imagehash
from PIL import Image
import numpy as np
import chromadb
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class FingerprintService:
    _chroma_client = None
    _collection = None

    @classmethod
    def initialize(cls):
        cls._chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        cls._collection = cls._chroma_client.get_or_create_collection(
            name="asset_fingerprints",
            metadata={"hnsw:space": "cosine"},
        )
        logger.info("FingerprintService initialized with ChromaDB")

    @classmethod
    def health_check(cls) -> bool:
        try:
            if cls._collection is None:
                return False
            cls._collection.count()
            return True
        except Exception:
            return False

    @staticmethod
    def generate_hashes(image: Image.Image) -> dict:
        return {
            "phash": str(imagehash.phash(image, hash_size=16)),
            "ahash": str(imagehash.average_hash(image, hash_size=16)),
            "dhash": str(imagehash.dhash(image, hash_size=16)),
            "whash": str(imagehash.whash(image, hash_size=16)),
        }

    @staticmethod
    def compare_hashes(hash1: str, hash2: str) -> float:
        """Compare two hex hash strings and return similarity (0.0 to 1.0)."""
        try:
            h1 = imagehash.hex_to_hash(hash1)
            h2 = imagehash.hex_to_hash(hash2)
            max_diff = len(h1.hash.flatten())
            diff = h1 - h2
            return max(0.0, 1.0 - diff / max(max_diff, 1))
        except Exception:
            return 0.0

    @staticmethod
    def generate_thumbnail(image: Image.Image, size: tuple = (300, 300)) -> Image.Image:
        """Create a thumbnail copy of the image."""
        thumb = image.copy()
        thumb.thumbnail(size, Image.Resampling.LANCZOS)
        return thumb

    @staticmethod
    def generate_embedding(image: Image.Image) -> list[float]:
        img = image.resize((224, 224)).convert("RGB")
        arr = np.array(img, dtype=np.float32) / 255.0

        # Color histogram features (32 bins per channel)
        hist_r = np.histogram(arr[:, :, 0], bins=32, range=(0, 1))[0].astype(np.float32)
        hist_g = np.histogram(arr[:, :, 1], bins=32, range=(0, 1))[0].astype(np.float32)
        hist_b = np.histogram(arr[:, :, 2], bins=32, range=(0, 1))[0].astype(np.float32)

        # Normalize histograms
        hist_r = hist_r / (hist_r.sum() + 1e-7)
        hist_g = hist_g / (hist_g.sum() + 1e-7)
        hist_b = hist_b / (hist_b.sum() + 1e-7)

        # Spatial grid features (4x4 grid, mean RGB per cell)
        grid_size = 4
        h, w = arr.shape[:2]
        spatial = []
        for i in range(grid_size):
            for j in range(grid_size):
                y_start, y_end = i * h // grid_size, (i + 1) * h // grid_size
                x_start, x_end = j * w // grid_size, (j + 1) * w // grid_size
                block = arr[y_start:y_end, x_start:x_end]
                spatial.extend([block[:, :, c].mean() for c in range(3)])

        # Edge density features (Sobel-like gradients on grayscale)
        gray = np.mean(arr, axis=2)
        gx = np.abs(np.diff(gray, axis=1)).mean()
        gy = np.abs(np.diff(gray, axis=0)).mean()

        # Texture features (local variance in grid)
        texture = []
        for i in range(grid_size):
            for j in range(grid_size):
                y_start, y_end = i * h // grid_size, (i + 1) * h // grid_size
                x_start, x_end = j * w // grid_size, (j + 1) * w // grid_size
                block_gray = gray[y_start:y_end, x_start:x_end]
                texture.append(block_gray.var())

        # Combine all features into one vector
        features = np.concatenate(
            [
                hist_r,
                hist_g,
                hist_b,
                np.array(spatial, dtype=np.float32),
                np.array([gx, gy], dtype=np.float32),
                np.array(texture, dtype=np.float32),
            ]
        )

        # L2 normalize
        norm = np.linalg.norm(features)
        if norm > 0:
            features = features / norm

        return features.tolist()

    @classmethod
    def store_embedding(cls, asset_id: str, embedding: list[float], metadata: dict = None):
        cls._collection.upsert(
            ids=[asset_id],
            embeddings=[embedding],
            metadatas=[metadata or {}],
        )

    @classmethod
    def delete_embedding(cls, asset_id: str):
        try:
            cls._collection.delete(ids=[asset_id])
        except Exception as e:
            logger.warning(f"Could not delete embedding {asset_id}: {e}")

    @classmethod
    def search_similar(cls, embedding: list[float], n_results: int = 10) -> dict:
        count = cls._collection.count()
        if count == 0:
            return {"ids": [[]], "distances": [[]], "metadatas": [[]]}
        actual_n = min(n_results, count)
        results = cls._collection.query(
            query_embeddings=[embedding],
            n_results=actual_n,
            include=["distances", "metadatas"],
        )
        return results

    @staticmethod
    def compare_hashes(hash1: str, hash2: str) -> float:
        if not hash1 or not hash2:
            return 0.0
        try:
            h1 = imagehash.hex_to_hash(hash1)
            h2 = imagehash.hex_to_hash(hash2)
            max_diff = h1.hash.size
            diff = h1 - h2
            similarity = 1 - (diff / max_diff)
            return max(0.0, similarity)
        except Exception:
            return 0.0

    @staticmethod
    def generate_thumbnail(image: Image.Image, size: tuple = (300, 300)) -> Image.Image:
        thumb = image.copy()
        thumb.thumbnail(size, Image.Resampling.LANCZOS)
        return thumb
