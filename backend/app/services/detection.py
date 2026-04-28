from PIL import Image
from sqlalchemy.orm import Session
import json
import logging

from app.models.database_models import Asset, Match
from app.services.fingerprint import FingerprintService
from app.services.google_ai import GoogleAIService
from app.config import settings

logger = logging.getLogger(__name__)


class DetectionService:

    @staticmethod
    def scan_image_against_assets(
        image: Image.Image, db: Session, scanned_file_path: str = ""
    ) -> list[dict]:
        # Generate fingerprints for the scanned image
        hashes = FingerprintService.generate_hashes(image)
        embedding = FingerprintService.generate_embedding(image)

        results = []

        # 1. Vector similarity search (embedding-based)
        similar = FingerprintService.search_similar(embedding, n_results=20)

        if similar["ids"] and similar["ids"][0]:
            for idx, asset_id_str in enumerate(similar["ids"][0]):
                distance = similar["distances"][0][idx] if similar["distances"][0] else 1.0
                embedding_similarity = max(0.0, 1.0 - distance)

                # Get the asset from DB
                try:
                    asset_id = int(asset_id_str)
                except (ValueError, TypeError):
                    continue

                asset = db.query(Asset).filter(Asset.id == asset_id).first()
                if not asset:
                    continue

                # 2. Perceptual hash comparison
                hash_scores = []
                for hash_type in ["phash", "ahash", "dhash", "whash"]:
                    asset_hash = getattr(asset, hash_type, None)
                    scan_hash = hashes.get(hash_type)
                    if asset_hash and scan_hash:
                        score = FingerprintService.compare_hashes(asset_hash, scan_hash)
                        hash_scores.append(score)

                avg_hash_similarity = sum(hash_scores) / len(hash_scores) if hash_scores else 0.0

                # 3. Combined score (weighted)
                combined_score = (avg_hash_similarity * 0.6) + (embedding_similarity * 0.4)

                # Determine match type
                if combined_score >= 0.95:
                    match_type = "exact"
                elif combined_score >= 0.85:
                    match_type = "near-duplicate"
                elif combined_score >= 0.70:
                    match_type = "derivative"
                elif combined_score >= settings.SIMILARITY_THRESHOLD:
                    match_type = "modified"
                else:
                    match_type = "low-similarity"

                if combined_score >= settings.SIMILARITY_THRESHOLD * 0.7:
                    results.append(
                        {
                            "asset_id": asset.id,
                            "asset_name": asset.name,
                            "similarity_score": round(combined_score, 4),
                            "hash_similarity": round(avg_hash_similarity, 4),
                            "embedding_similarity": round(embedding_similarity, 4),
                            "match_type": match_type,
                            "matched": combined_score >= settings.SIMILARITY_THRESHOLD,
                            "details": {
                                "phash_score": hash_scores[0] if len(hash_scores) > 0 else 0,
                                "ahash_score": hash_scores[1] if len(hash_scores) > 1 else 0,
                                "dhash_score": hash_scores[2] if len(hash_scores) > 2 else 0,
                                "whash_score": hash_scores[3] if len(hash_scores) > 3 else 0,
                                "embedding_distance": distance,
                            },
                        }
                    )

        # Sort by similarity score descending
        results.sort(key=lambda x: x["similarity_score"], reverse=True)

        return results

    @staticmethod
    def create_match_record(
        db: Session,
        asset_id: int,
        asset_name: str,
        similarity_score: float,
        hash_similarity: float,
        embedding_similarity: float,
        match_type: str,
        source_url: str = "",
        matched_file_path: str = "",
        platform: str = "Upload Scan",
        details: dict = None,
        thumbnail_path: str = "",
    ) -> Match:
        match = Match(
            asset_id=asset_id,
            asset_name=asset_name,
            similarity_score=similarity_score,
            hash_similarity=hash_similarity,
            embedding_similarity=embedding_similarity,
            match_type=match_type,
            source_url=source_url,
            matched_file_path=matched_file_path,
            platform=platform,
            details=json.dumps(details or {}),
            thumbnail_path=thumbnail_path,
            status="pending",
        )
        db.add(match)
        db.commit()
        db.refresh(match)
        return match

    @staticmethod
    def ai_compare(
        image1: Image.Image, image2: Image.Image
    ) -> dict:
        return GoogleAIService.compare_images(image1, image2)
