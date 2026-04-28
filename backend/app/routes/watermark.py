from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from PIL import Image
import io
import logging

from app.database import get_db
from app.models.database_models import Asset, Watermark
from app.models.schemas import WatermarkResponse, WatermarkVerifyResponse
from app.services.watermark import WatermarkService
from app.services.storage import StorageService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/embed/{asset_id}", response_model=WatermarkResponse)
async def embed_watermark(
    asset_id: int,
    recipient: str = Form(""),
    purpose: str = Form(""),
    db: Session = Depends(get_db),
):
    """Embed invisible Digital DNA watermark into an asset and return watermarked copy."""
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.is_active == True).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Load original image
    import os
    img_path = asset.file_path
    if img_path.startswith("/uploads"):
        img_path = img_path.replace("/uploads", "./uploads", 1)
    if not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="Original image file not found")

    image = Image.open(img_path).convert("RGB")

    # Generate watermark
    wm_uid = WatermarkService.generate_uid()
    wm_key = WatermarkService.generate_key(asset_id, recipient)

    watermarked = WatermarkService.embed(image, wm_uid)

    # Save watermarked copy
    wm_path = StorageService.save_original(watermarked, f"wm_{asset.name}")

    # Create DB record
    wm_record = Watermark(
        asset_id=asset_id,
        watermark_uid=wm_uid,
        recipient=recipient,
        purpose=purpose,
        metadata="{}",
    )
    db.add(wm_record)

    # Update asset
    asset.watermark_id = wm_uid
    asset.watermark_key = wm_key

    db.commit()
    db.refresh(wm_record)

    return wm_record


@router.post("/verify", response_model=WatermarkVerifyResponse)
async def verify_watermark(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Check if an image contains an AEGIS Digital DNA watermark."""
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    extracted_uid = WatermarkService.extract(image)

    if not extracted_uid:
        return WatermarkVerifyResponse(watermark_detected=False, confidence=0.0)

    # Look up the watermark in DB
    wm = db.query(Watermark).filter(Watermark.watermark_uid == extracted_uid).first()
    if not wm:
        return WatermarkVerifyResponse(
            watermark_detected=True,
            watermark_uid=extracted_uid,
            confidence=0.8,
        )

    asset = db.query(Asset).filter(Asset.id == wm.asset_id).first()

    return WatermarkVerifyResponse(
        watermark_detected=True,
        watermark_uid=extracted_uid,
        asset_id=wm.asset_id,
        asset_name=asset.name if asset else None,
        recipient=wm.recipient,
        confidence=1.0,
    )


@router.get("/download/{asset_id}")
async def download_watermarked(
    asset_id: int,
    recipient: str = "",
    db: Session = Depends(get_db),
):
    """Generate and download a freshly watermarked copy."""
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.is_active == True).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    import os
    img_path = asset.file_path
    if img_path.startswith("/uploads"):
        img_path = img_path.replace("/uploads", "./uploads", 1)
    if not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="Image file not found")

    image = Image.open(img_path).convert("RGB")
    wm_uid = WatermarkService.generate_uid()
    watermarked = WatermarkService.embed(image, wm_uid)

    # Save record
    wm_record = Watermark(
        asset_id=asset_id,
        watermark_uid=wm_uid,
        recipient=recipient,
        purpose="download",
    )
    db.add(wm_record)
    db.commit()

    buf = io.BytesIO()
    watermarked.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="image/png",
        headers={"Content-Disposition": f"attachment; filename=aegis_protected_{asset.name}.png"},
    )


@router.get("/history/{asset_id}", response_model=list[WatermarkResponse])
async def watermark_history(
    asset_id: int,
    db: Session = Depends(get_db),
):
    """Get all watermark records for an asset."""
    records = (
        db.query(Watermark)
        .filter(Watermark.asset_id == asset_id)
        .order_by(Watermark.embedded_at.desc())
        .all()
    )
    return records
