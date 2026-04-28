from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
import json
import logging

from app.database import get_db
from app.models.database_models import Match, Asset, EnforcementAction
from app.models.schemas import (
    EnforcementCreateRequest,
    EnforcementResponse,
    EnforcementUpdateRequest,
)
from app.services.enforcement import EnforcementService
from app.services.risk_scoring import RiskScoringService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/generate", response_model=EnforcementResponse)
async def generate_enforcement(
    request: EnforcementCreateRequest,
    db: Session = Depends(get_db),
):
    """Generate a DMCA notice or cease-and-desist for a match."""
    match = db.query(Match).filter(Match.id == request.match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    asset = db.query(Asset).filter(Asset.id == match.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Associated asset not found")

    # Get risk score
    risk = RiskScoringService.calculate(
        similarity_score=match.similarity_score,
        match_type=match.match_type,
        platform=match.platform,
        source_url=match.source_url,
    )

    # Generate notice
    if request.action_type == "dmca":
        notice = EnforcementService.generate_dmca(
            asset_name=asset.name,
            description=asset.gemini_description,
            registration_date=asset.uploaded_at.strftime("%Y-%m-%d") if asset.uploaded_at else "",
            rights_holder=asset.organization,
            infringing_url=match.source_url,
            platform=match.platform,
            detection_date=match.detected_at.strftime("%Y-%m-%d") if match.detected_at else "",
            similarity_score=match.similarity_score,
            hash_similarity=match.hash_similarity,
            embedding_similarity=match.embedding_similarity,
            match_type=match.match_type,
            risk_level=risk["risk_level"],
        )
    elif request.action_type == "cease_desist":
        notice = EnforcementService.generate_cease_desist(
            asset_name=asset.name,
            rights_holder=asset.organization,
            infringing_url=match.source_url,
            platform=match.platform,
            similarity_score=match.similarity_score,
        )
    else:
        notice = f"Platform report for match #{match.id} — {match.platform}"

    # Build evidence package
    evidence = EnforcementService.build_evidence_package(
        asset_data={
            "name": asset.name,
            "uploaded_at": asset.uploaded_at.isoformat() if asset.uploaded_at else "",
            "file_type": asset.file_type,
            "phash": asset.phash,
            "ahash": asset.ahash,
            "dhash": asset.dhash,
            "whash": asset.whash,
            "gemini_description": asset.gemini_description,
        },
        match_data={
            "source_url": match.source_url,
            "platform": match.platform,
            "detected_at": match.detected_at.isoformat() if match.detected_at else "",
            "similarity_score": match.similarity_score,
            "hash_similarity": match.hash_similarity,
            "embedding_similarity": match.embedding_similarity,
            "match_type": match.match_type,
        },
        risk_data=risk,
    )

    action = EnforcementAction(
        match_id=match.id,
        asset_id=asset.id,
        action_type=request.action_type,
        platform=match.platform,
        target_url=match.source_url,
        status="draft",
        notice_content=notice,
        evidence_package=json.dumps(evidence),
        priority=request.priority,
    )
    db.add(action)
    db.commit()
    db.refresh(action)

    return action


@router.get("/list", response_model=list[EnforcementResponse])
async def list_enforcements(
    status: str = "",
    db: Session = Depends(get_db),
):
    query = db.query(EnforcementAction).order_by(EnforcementAction.generated_at.desc())
    if status:
        query = query.filter(EnforcementAction.status == status)
    return query.limit(100).all()


@router.get("/{action_id}", response_model=EnforcementResponse)
async def get_enforcement(
    action_id: int,
    db: Session = Depends(get_db),
):
    action = db.query(EnforcementAction).filter(EnforcementAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Enforcement action not found")
    return action


@router.patch("/{action_id}", response_model=EnforcementResponse)
async def update_enforcement(
    action_id: int,
    request: EnforcementUpdateRequest,
    db: Session = Depends(get_db),
):
    action = db.query(EnforcementAction).filter(EnforcementAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Enforcement action not found")

    if request.status:
        action.status = request.status
        if request.status == "sent":
            action.sent_at = datetime.now(timezone.utc)
        elif request.status in ("complied", "escalated"):
            action.resolved_at = datetime.now(timezone.utc)

    if request.response_notes:
        action.response_notes = request.response_notes

    db.commit()
    db.refresh(action)
    return action


@router.get("/stats/summary")
async def enforcement_stats(db: Session = Depends(get_db)):
    """Summary stats for enforcement actions."""
    total = db.query(func.count(EnforcementAction.id)).scalar() or 0
    by_status = dict(
        db.query(EnforcementAction.status, func.count(EnforcementAction.id))
        .group_by(EnforcementAction.status)
        .all()
    )
    by_type = dict(
        db.query(EnforcementAction.action_type, func.count(EnforcementAction.id))
        .group_by(EnforcementAction.action_type)
        .all()
    )
    compliance_rate = 0.0
    resolved = by_status.get("complied", 0)
    sent = by_status.get("sent", 0) + resolved + by_status.get("escalated", 0)
    if sent > 0:
        compliance_rate = round(resolved / sent * 100, 1)

    return {
        "total_actions": total,
        "by_status": by_status,
        "by_type": by_type,
        "compliance_rate": compliance_rate,
    }
