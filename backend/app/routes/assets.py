from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from PIL import Image
import io
import json

from app.database import get_db
from app.models.database_models import Asset
from app.models.schemas import AssetResponse, AssetListResponse
from app.services.fingerprint import FingerprintService
from app.services.google_ai import GoogleAIService
from app.services.storage import StorageService

router = APIRouter()


@router.post("/register", response_model=AssetResponse)
async def register_asset(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(""),
    organization: str = Form("Default Org"),
    db: Session = Depends(get_db),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")

    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    image = Image.open(io.BytesIO(contents)).convert("RGB")

    # Generate fingerprints
    hashes = FingerprintService.generate_hashes(image)
    embedding = FingerprintService.generate_embedding(image)

    # Save files
    file_path = StorageService.save_original(image, file.filename)
    thumbnail = FingerprintService.generate_thumbnail(image)
    StorageService.save_thumbnail(thumbnail, file.filename)

    # Google AI analysis
    GoogleAIService.initialize()
    ai_analysis = GoogleAIService.analyze_image(image)
    gemini_desc = GoogleAIService.generate_description(image)

    # Create DB record
    asset = Asset(
        name=name,
        description=description,
        file_path=StorageService.get_relative_path(file_path),
        file_type=file.content_type,
        file_size=len(contents),
        phash=hashes["phash"],
        ahash=hashes["ahash"],
        dhash=hashes["dhash"],
        whash=hashes["whash"],
        vision_labels=json.dumps(ai_analysis.get("labels", [])),
        gemini_description=gemini_desc,
        organization=organization,
    )

    db.add(asset)
    db.commit()
    db.refresh(asset)

    # Store embedding in ChromaDB
    FingerprintService.store_embedding(
        str(asset.id),
        embedding,
        metadata={"name": name, "organization": organization},
    )

    asset.embedding_id = str(asset.id)
    db.commit()
    db.refresh(asset)

    return asset


@router.get("/", response_model=AssetListResponse)
async def list_assets(
    skip: int = 0,
    limit: int = 50,
    organization: str = None,
    db: Session = Depends(get_db),
):
    query = db.query(Asset).filter(Asset.is_active == True)
    if organization:
        query = query.filter(Asset.organization == organization)

    total = query.count()
    assets = query.order_by(Asset.uploaded_at.desc()).offset(skip).limit(limit).all()

    return AssetListResponse(total=total, assets=assets)


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.delete("/{asset_id}")
async def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Clean up
    FingerprintService.delete_embedding(str(asset_id))
    asset.is_active = False
    db.commit()

    return {"message": "Asset deactivated", "id": asset_id}


@router.post("/{asset_id}/analyze")
async def analyze_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Load the image from disk
    import os
    file_path = asset.file_path.replace("/uploads", "./uploads").replace("/", os.sep)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Asset file not found on disk")

    image = Image.open(file_path).convert("RGB")

    GoogleAIService.initialize()
    analysis = GoogleAIService.analyze_image(image)
    web_presence = GoogleAIService.detect_web_presence(image)

    # Update asset with fresh analysis
    asset.vision_labels = json.dumps(analysis.get("labels", []))
    asset.gemini_description = analysis.get("description", "")
    db.commit()

    return {
        "asset_id": asset_id,
        "analysis": analysis,
        "web_presence": web_presence,
    }


@router.post("/{asset_id}/analyze")
async def analyze_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Load image from file path
    actual_path = asset.file_path.replace("/uploads", "./uploads")
    try:
        image = Image.open(actual_path).convert("RGB")
    except Exception:
        raise HTTPException(status_code=500, detail="Could not load asset image")

    GoogleAIService.initialize()
    analysis = GoogleAIService.analyze_image(image)
    web_presence = GoogleAIService.detect_web_presence(image)

    return {
        "asset_id": asset_id,
        "analysis": analysis,
        "web_presence": web_presence,
    }
