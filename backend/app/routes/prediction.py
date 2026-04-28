"""Routes for Leak Prediction Engine — preventive intelligence."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
import logging

from app.database import get_db
from app.models.database_models import Asset, Match, Watermark, PropagationNode
from app.services.leak_prediction import LeakPredictionService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/asset/{asset_id}")
async def predict_asset_leak_risk(asset_id: int, db: Session = Depends(get_db)):
    """Get leak probability prediction for a specific asset."""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    violations = db.query(func.count(Match.id)).filter(Match.asset_id == asset_id).scalar() or 0
    distribution_count = (
        db.query(func.count(Watermark.id)).filter(Watermark.asset_id == asset_id).scalar() or 0
    )

    platforms = (
        db.query(Match.platform)
        .filter(Match.asset_id == asset_id)
        .distinct()
        .all()
    )
    platform_list = [p[0] for p in platforms if p[0]]

    result = LeakPredictionService.predict_asset_risk(
        asset_id=asset_id,
        asset_name=asset.name,
        distribution_count=distribution_count,
        existing_violations=violations,
        platforms_distributed=platform_list,
    )
    return result


@router.get("/batch")
async def batch_predictions(db: Session = Depends(get_db)):
    """Get leak predictions for all active assets."""
    assets = db.query(Asset).filter(Asset.is_active == True).all()
    predictions = []

    for asset in assets:
        violations = (
            db.query(func.count(Match.id)).filter(Match.asset_id == asset.id).scalar() or 0
        )
        distribution = (
            db.query(func.count(Watermark.id)).filter(Watermark.asset_id == asset.id).scalar() or 0
        )

        pred = LeakPredictionService.predict_asset_risk(
            asset_id=asset.id,
            asset_name=asset.name,
            distribution_count=distribution,
            existing_violations=violations,
        )
        predictions.append(pred)

    predictions.sort(key=lambda x: x["leak_probability"], reverse=True)
    return {"total": len(predictions), "predictions": predictions}


class RecipientRiskRequest(BaseModel):
    recipient: str
    role: str = "unknown"


@router.post("/recipient")
async def predict_recipient_risk(request: RecipientRiskRequest, db: Session = Depends(get_db)):
    """Assess leak risk for a specific content recipient."""
    past_violations = (
        db.query(func.count(Watermark.id))
        .filter(Watermark.recipient == request.recipient)
        .scalar()
        or 0
    )

    result = LeakPredictionService.predict_recipient_risk(
        recipient=request.recipient,
        role=request.role,
        total_assets_shared=past_violations,
    )
    return result


class LeakSourceRequest(BaseModel):
    watermark_uid: str | None = None
    detection_platform: str = "unknown"


@router.post("/identify-source")
async def identify_leak_source(request: LeakSourceRequest, db: Session = Depends(get_db)):
    """Attempt to identify who leaked content based on evidence."""
    propagation_data = []
    if request.watermark_uid:
        wm = db.query(Watermark).filter(Watermark.watermark_uid == request.watermark_uid).first()
        if wm:
            nodes = (
                db.query(PropagationNode)
                .filter(PropagationNode.asset_id == wm.asset_id)
                .all()
            )
            propagation_data = [
                {"platform": n.platform, "url": n.url, "detected_at": str(n.detected_at)}
                for n in nodes
            ]

    result = LeakPredictionService.identify_leak_source(
        watermark_uid=request.watermark_uid,
        detection_platform=request.detection_platform,
        propagation_nodes=propagation_data,
    )
    return result


class SimulationRequest(BaseModel):
    asset_name: str


@router.post("/simulate")
async def simulate_leak(request: SimulationRequest):
    """Generate a realistic leak simulation for demo purposes."""
    return LeakPredictionService.generate_leak_simulation(request.asset_name)


@router.get("/dashboard")
async def leak_prediction_dashboard(db: Session = Depends(get_db)):
    """Dashboard data for leak prediction intelligence."""
    assets = db.query(Asset).filter(Asset.is_active == True).all()

    predictions = []
    critical_count = 0
    high_count = 0

    for asset in assets[:50]:
        violations = (
            db.query(func.count(Match.id)).filter(Match.asset_id == asset.id).scalar() or 0
        )
        pred = LeakPredictionService.predict_asset_risk(
            asset_id=asset.id,
            asset_name=asset.name,
            existing_violations=violations,
        )
        predictions.append(pred)
        if pred["risk_level"] == "critical":
            critical_count += 1
        elif pred["risk_level"] == "high":
            high_count += 1

    predictions.sort(key=lambda x: x["leak_probability"], reverse=True)

    return {
        "total_assets_analyzed": len(predictions),
        "critical_risk_count": critical_count,
        "high_risk_count": high_count,
        "average_leak_probability": round(
            sum(p["leak_probability"] for p in predictions) / max(len(predictions), 1), 1
        ),
        "top_risks": predictions[:10],
    }
