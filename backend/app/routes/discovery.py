from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import io

from app.database import get_db
from app.models.database_models import Asset, Match
from app.services.content_discovery import ContentDiscoveryService
from app.services.detection import DetectionService

router = APIRouter()


class WebSearchRequest(BaseModel):
    query: str
    asset_name: str = ""
    num_results: int = 10


class YouTubeSearchRequest(BaseModel):
    query: str
    asset_name: str = ""
    max_results: int = 10


class SweepRequest(BaseModel):
    asset_id: Optional[int] = None
    asset_name: str = ""
    keywords: list[str] = []


@router.post("/web-search")
async def search_web(request: WebSearchRequest):
    """Search the web for potentially infringing content."""
    ContentDiscoveryService.initialize()
    results = ContentDiscoveryService.search_web_for_content(
        query=request.query,
        asset_name=request.asset_name,
        num_results=request.num_results,
    )
    return {
        "query": request.query,
        "total_results": len(results),
        "results": results,
    }


@router.post("/youtube-search")
async def search_youtube(request: YouTubeSearchRequest):
    """Search YouTube for potentially infringing videos."""
    ContentDiscoveryService.initialize()
    results = ContentDiscoveryService.search_youtube(
        query=request.query,
        asset_name=request.asset_name,
        max_results=request.max_results,
    )

    # Calculate total estimated views
    total_views = sum(r.get("view_count", 0) for r in results)
    critical = sum(1 for r in results if r.get("risk_level") == "critical")

    return {
        "query": request.query,
        "total_results": len(results),
        "total_views": total_views,
        "critical_findings": critical,
        "results": results,
    }


@router.post("/vision-detect")
async def vision_web_detect(file: UploadFile = File(...)):
    """Use Cloud Vision API to find where an image appears online."""
    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    ContentDiscoveryService.initialize()
    results = ContentDiscoveryService.detect_web_entities(contents)
    labels = ContentDiscoveryService.detect_labels_and_logos(contents)

    return {
        "web_detection": results,
        "labels_and_logos": labels,
    }


@router.post("/sweep")
async def full_sweep(request: SweepRequest, db: Session = Depends(get_db)):
    """Run a full discovery sweep for an asset across all channels."""
    ContentDiscoveryService.initialize()

    image_bytes = None
    asset_name = request.asset_name

    # If asset_id is provided, load the image for Vision API
    if request.asset_id:
        asset = db.query(Asset).filter(Asset.id == request.asset_id).first()
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        asset_name = asset.name

        # Try loading the asset image
        try:
            import os
            file_path = asset.file_path
            if not os.path.isabs(file_path):
                file_path = os.path.join(".", file_path)
            with open(file_path, "rb") as f:
                image_bytes = f.read()
        except Exception:
            pass  # Continue without image

    if not asset_name:
        raise HTTPException(status_code=400, detail="Provide asset_id or asset_name")

    results = ContentDiscoveryService.full_discovery_sweep(
        asset_name=asset_name,
        keywords=request.keywords,
        image_bytes=image_bytes,
    )

    return results


@router.post("/sweep/{asset_id}")
async def sweep_asset(asset_id: int, db: Session = Depends(get_db)):
    """Quick sweep for a specific asset by ID."""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    ContentDiscoveryService.initialize()

    image_bytes = None
    try:
        import os
        file_path = asset.file_path
        if not os.path.isabs(file_path):
            file_path = os.path.join(".", file_path)
        with open(file_path, "rb") as f:
            image_bytes = f.read()
    except Exception:
        pass

    # Build search keywords from asset metadata
    keywords = []
    if asset.description:
        keywords.extend(asset.description.split()[:5])
    if asset.organization:
        keywords.append(asset.organization)

    results = ContentDiscoveryService.full_discovery_sweep(
        asset_name=asset.name,
        keywords=keywords,
        image_bytes=image_bytes,
    )

    return results


@router.get("/overview")
async def discovery_overview(db: Session = Depends(get_db)):
    """Get overview of discovery capabilities and past sweeps."""
    from app.config import settings

    total_assets = db.query(Asset).filter(Asset.is_active == True).count()
    total_matches = db.query(Match).count()

    return {
        "capabilities": {
            "google_search": bool(settings.GOOGLE_API_KEY and settings.GOOGLE_CSE_ID),
            "youtube_data_api": bool(settings.GOOGLE_API_KEY),
            "cloud_vision": bool(settings.GOOGLE_API_KEY),
            "active_sweep": True,
        },
        "stats": {
            "total_assets_to_protect": total_assets,
            "total_violations_found": total_matches,
        },
        "supported_channels": [
            {"name": "Google Web Search", "icon": "search", "enabled": bool(settings.GOOGLE_API_KEY)},
            {"name": "YouTube", "icon": "youtube", "enabled": bool(settings.GOOGLE_API_KEY)},
            {"name": "Cloud Vision Web Detection", "icon": "eye", "enabled": bool(settings.GOOGLE_API_KEY)},
            {"name": "Image Reverse Search", "icon": "image", "enabled": True},
        ],
    }
