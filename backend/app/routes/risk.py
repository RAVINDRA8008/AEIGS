from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import logging

from app.database import get_db
from app.models.database_models import Match, PropagationNode
from app.models.schemas import RiskScoreResponse
from app.services.risk_scoring import RiskScoringService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/score/{match_id}", response_model=RiskScoreResponse)
async def get_risk_score(
    match_id: int,
    db: Session = Depends(get_db),
):
    """Calculate the risk score for a specific match/violation."""
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Count propagation spread
    spread_count = (
        db.query(func.count(PropagationNode.id))
        .filter(PropagationNode.asset_id == match.asset_id)
        .scalar()
        or 0
    )

    risk = RiskScoringService.calculate(
        similarity_score=match.similarity_score,
        match_type=match.match_type,
        platform=match.platform,
        source_url=match.source_url,
        spread_count=spread_count,
    )

    # Persist the score on the match record
    match.risk_score = risk["overall_score"]
    match.risk_level = risk["risk_level"]
    db.commit()

    return RiskScoreResponse(
        match_id=match.id,
        overall_score=risk["overall_score"],
        risk_level=risk["risk_level"],
        factors=risk["factors"],
        recommendations=risk["recommendations"],
    )


@router.get("/batch")
async def batch_risk_scores(
    db: Session = Depends(get_db),
):
    """Calculate risk scores for all pending matches."""
    matches = db.query(Match).filter(Match.status == "pending").all()
    results = []

    for match in matches:
        spread_count = (
            db.query(func.count(PropagationNode.id))
            .filter(PropagationNode.asset_id == match.asset_id)
            .scalar()
            or 0
        )

        risk = RiskScoringService.calculate(
            similarity_score=match.similarity_score,
            match_type=match.match_type,
            platform=match.platform,
            source_url=match.source_url,
            spread_count=spread_count,
        )

        match.risk_score = risk["overall_score"]
        match.risk_level = risk["risk_level"]

        results.append(
            {
                "match_id": match.id,
                "asset_name": match.asset_name,
                "overall_score": risk["overall_score"],
                "risk_level": risk["risk_level"],
                "revenue_at_risk": risk["revenue_at_risk"],
            }
        )

    db.commit()

    results.sort(key=lambda x: x["overall_score"], reverse=True)

    return {
        "scored": len(results),
        "results": results,
    }


@router.get("/dashboard")
async def risk_dashboard(db: Session = Depends(get_db)):
    """Risk intelligence dashboard data."""
    total_matches = db.query(func.count(Match.id)).scalar() or 0

    critical = db.query(func.count(Match.id)).filter(Match.risk_level == "critical").scalar() or 0
    high = db.query(func.count(Match.id)).filter(Match.risk_level == "high").scalar() or 0
    medium = db.query(func.count(Match.id)).filter(Match.risk_level == "medium").scalar() or 0
    low = db.query(func.count(Match.id)).filter(Match.risk_level == "low").scalar() or 0

    avg_score = db.query(func.avg(Match.risk_score)).scalar() or 0

    # Top risks
    top_risks = (
        db.query(Match)
        .filter(Match.risk_score > 0)
        .order_by(Match.risk_score.desc())
        .limit(10)
        .all()
    )

    return {
        "total_scored": total_matches,
        "by_level": {
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low,
        },
        "average_score": round(float(avg_score), 1),
        "top_risks": [
            {
                "match_id": m.id,
                "asset_name": m.asset_name,
                "platform": m.platform,
                "risk_score": m.risk_score,
                "risk_level": m.risk_level,
                "similarity_score": m.similarity_score,
            }
            for m in top_risks
        ],
    }
