from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from PIL import Image
import io
import logging
import httpx
from urllib.parse import urlparse

from app.database import get_db
from app.models.database_models import ScanLog
from app.models.schemas import ScanResponse, ScanResult, ScanURLRequest
from app.services.detection import DetectionService
from app.services.fingerprint import FingerprintService
from app.services.storage import StorageService
from app.services.google_ai import GoogleAIService
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload", response_model=ScanResponse)
async def scan_upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")

    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    image = Image.open(io.BytesIO(contents)).convert("RGB")

    # Save scan file
    scan_path = StorageService.save_scan(image, file.filename)
    relative_scan_path = StorageService.get_relative_path(scan_path)

    # Run detection
    detection_results = DetectionService.scan_image_against_assets(
        image, db, scanned_file_path=relative_scan_path
    )

    # Build response and create match records for significant matches
    results = []
    for r in detection_results:
        result = ScanResult(
            matched=r["matched"],
            asset_id=r["asset_id"],
            asset_name=r["asset_name"],
            similarity_score=r["similarity_score"],
            hash_similarity=r["hash_similarity"],
            embedding_similarity=r["embedding_similarity"],
            match_type=r["match_type"],
            details=r["details"],
        )
        results.append(result)

        # Create match record for flagged matches
        if r["matched"]:
            DetectionService.create_match_record(
                db=db,
                asset_id=r["asset_id"],
                asset_name=r["asset_name"],
                similarity_score=r["similarity_score"],
                hash_similarity=r["hash_similarity"],
                embedding_similarity=r["embedding_similarity"],
                match_type=r["match_type"],
                matched_file_path=relative_scan_path,
                details=r["details"],
            )

    # Log the scan
    scan_log = ScanLog(
        scan_type="upload",
        target=file.filename,
        results_count=len([r for r in results if r.matched]),
        status="completed",
    )
    db.add(scan_log)
    db.commit()
    db.refresh(scan_log)

    return ScanResponse(
        scan_id=scan_log.id,
        results=results,
        total_matches=len([r for r in results if r.matched]),
    )


@router.post("/compare")
async def compare_images(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
):
    contents1 = await file1.read()
    contents2 = await file2.read()

    image1 = Image.open(io.BytesIO(contents1)).convert("RGB")
    image2 = Image.open(io.BytesIO(contents2)).convert("RGB")

    # Hash comparison
    hashes1 = FingerprintService.generate_hashes(image1)
    hashes2 = FingerprintService.generate_hashes(image2)

    hash_scores = {}
    for hash_type in ["phash", "ahash", "dhash", "whash"]:
        hash_scores[hash_type] = FingerprintService.compare_hashes(
            hashes1[hash_type], hashes2[hash_type]
        )

    avg_hash = sum(hash_scores.values()) / len(hash_scores)

    # Embedding comparison
    emb1 = FingerprintService.generate_embedding(image1)
    emb2 = FingerprintService.generate_embedding(image2)

    import numpy as np

    cos_sim = float(
        np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2) + 1e-7)
    )

    # Combined score
    combined = (avg_hash * 0.6) + (cos_sim * 0.4)

    # AI comparison (if available)
    GoogleAIService.initialize()
    ai_comparison = DetectionService.ai_compare(image1, image2)

    return {
        "hash_scores": hash_scores,
        "avg_hash_similarity": round(avg_hash, 4),
        "embedding_similarity": round(cos_sim, 4),
        "combined_score": round(combined, 4),
        "ai_comparison": ai_comparison,
        "verdict": "match" if combined >= settings.SIMILARITY_THRESHOLD else "no match",
    }


@router.post("/quick-check")
async def quick_check(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Quick hash-only check (faster, no embedding search)."""
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    hashes = FingerprintService.generate_hashes(image)

    from app.models.database_models import Asset

    assets = db.query(Asset).filter(Asset.is_active == True).all()

    matches = []
    for asset in assets:
        scores = []
        for ht in ["phash", "ahash", "dhash", "whash"]:
            asset_hash = getattr(asset, ht, None)
            scan_hash = hashes.get(ht)
            if asset_hash and scan_hash:
                scores.append(FingerprintService.compare_hashes(asset_hash, scan_hash))

        avg = sum(scores) / len(scores) if scores else 0
        if avg >= 0.6:
            matches.append(
                {
                    "asset_id": asset.id,
                    "asset_name": asset.name,
                    "hash_similarity": round(avg, 4),
                    "matched": avg >= settings.SIMILARITY_THRESHOLD,
                }
            )

    matches.sort(key=lambda x: x["hash_similarity"], reverse=True)
    return {"matches": matches[:10], "total_checked": len(assets)}


ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/bmp"}


@router.post("/url")
async def scan_url(
    request: ScanURLRequest,
    db: Session = Depends(get_db),
):
    """Fetch an image from a URL and scan it against registered assets."""
    url = request.url.strip()

    # Validate URL
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="Only HTTP/HTTPS URLs are supported")

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url, headers={
                "User-Agent": "AEGIS-DigitalAssetProtection/2.0"
            })
            response.raise_for_status()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=400, detail=f"URL returned status {e.response.status_code}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")

    content_type = response.headers.get("content-type", "").split(";")[0].strip()
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"URL does not point to a supported image (got {content_type})")

    contents = response.content
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 20MB)")

    image = Image.open(io.BytesIO(contents)).convert("RGB")

    scan_path = StorageService.save_scan(image, f"url_scan_{parsed.netloc}.png")
    relative_scan_path = StorageService.get_relative_path(scan_path)

    detection_results = DetectionService.scan_image_against_assets(
        image, db, scanned_file_path=relative_scan_path
    )

    results = []
    for r in detection_results:
        result = ScanResult(
            matched=r["matched"],
            asset_id=r["asset_id"],
            asset_name=r["asset_name"],
            similarity_score=r["similarity_score"],
            hash_similarity=r["hash_similarity"],
            embedding_similarity=r["embedding_similarity"],
            match_type=r["match_type"],
            details=r["details"],
        )
        results.append(result)

        if r["matched"]:
            DetectionService.create_match_record(
                db=db,
                asset_id=r["asset_id"],
                asset_name=r["asset_name"],
                similarity_score=r["similarity_score"],
                hash_similarity=r["hash_similarity"],
                embedding_similarity=r["embedding_similarity"],
                match_type=r["match_type"],
                source_url=url,
                matched_file_path=relative_scan_path,
                platform=parsed.netloc,
                details=r["details"],
            )

    scan_log = ScanLog(
        scan_type="url",
        target=url,
        results_count=len([r for r in results if r.matched]),
        status="completed",
    )
    db.add(scan_log)
    db.commit()

    return ScanResponse(
        scan_id=scan_log.id,
        results=results,
        total_matches=len([r for r in results if r.matched]),
    )


@router.post("/batch")
async def batch_scan(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    """Scan multiple images at once against registered assets."""
    if len(files) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 files per batch")

    batch_results = []

    for file in files:
        if not file.content_type or not file.content_type.startswith("image/"):
            batch_results.append({
                "filename": file.filename,
                "error": "Not an image file",
                "results": [],
                "total_matches": 0,
            })
            continue

        try:
            contents = await file.read()
            if len(contents) > 20 * 1024 * 1024:
                batch_results.append({
                    "filename": file.filename,
                    "error": "File too large",
                    "results": [],
                    "total_matches": 0,
                })
                continue

            image = Image.open(io.BytesIO(contents)).convert("RGB")
            scan_path = StorageService.save_scan(image, file.filename)
            relative_path = StorageService.get_relative_path(scan_path)

            detection_results = DetectionService.scan_image_against_assets(
                image, db, scanned_file_path=relative_path
            )

            file_results = []
            for r in detection_results:
                file_results.append({
                    "matched": r["matched"],
                    "asset_id": r["asset_id"],
                    "asset_name": r["asset_name"],
                    "similarity_score": r["similarity_score"],
                    "match_type": r["match_type"],
                })
                if r["matched"]:
                    DetectionService.create_match_record(
                        db=db,
                        asset_id=r["asset_id"],
                        asset_name=r["asset_name"],
                        similarity_score=r["similarity_score"],
                        hash_similarity=r["hash_similarity"],
                        embedding_similarity=r["embedding_similarity"],
                        match_type=r["match_type"],
                        matched_file_path=relative_path,
                        platform="Batch Scan",
                        details=r.get("details"),
                    )

            batch_results.append({
                "filename": file.filename,
                "results": file_results,
                "total_matches": len([r for r in file_results if r["matched"]]),
            })
        except Exception as e:
            logger.error(f"Error scanning {file.filename}: {e}")
            batch_results.append({
                "filename": file.filename,
                "error": str(e),
                "results": [],
                "total_matches": 0,
            })

    scan_log = ScanLog(
        scan_type="batch",
        target=f"{len(files)} files",
        results_count=sum(r["total_matches"] for r in batch_results),
        status="completed",
    )
    db.add(scan_log)
    db.commit()

    return {
        "scan_id": scan_log.id,
        "files_scanned": len(files),
        "total_violations": sum(r["total_matches"] for r in batch_results),
        "results": batch_results,
    }
