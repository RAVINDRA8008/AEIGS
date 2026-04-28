from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.database_models import Match, EnforcementAction, Asset
from app.services.revenue_impact import RevenueImpactService

router = APIRouter()


@router.get("/dashboard")
async def revenue_dashboard(db: Session = Depends(get_db)):
    """Full revenue impact dashboard with breakdowns and projections."""
    matches = db.query(Match).all()
    enforcements = db.query(EnforcementAction).all()

    impact = RevenueImpactService.calculate_portfolio_impact(matches, enforcements)

    # Add asset count context
    total_assets = db.query(Asset).filter(Asset.is_active == True).count()
    impact["total_protected_assets"] = total_assets
    impact["avg_loss_per_violation"] = round(
        impact["total_impact"] / max(impact["total_violations"], 1), 2
    )
    impact["avg_loss_per_asset"] = round(
        impact["total_impact"] / max(total_assets, 1), 2
    )

    return impact


@router.get("/violation/{match_id}")
async def violation_revenue_impact(match_id: int, db: Session = Depends(get_db)):
    """Revenue impact for a single violation."""
    from datetime import datetime, timezone
    from fastapi import HTTPException

    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    now = datetime.now(timezone.utc)
    detected = match.detected_at
    if detected.tzinfo is None:
        detected = detected.replace(tzinfo=timezone.utc)
    days_active = max((now - detected).days, 1)

    impact = RevenueImpactService.calculate_single_violation(
        similarity_score=match.similarity_score,
        match_type=match.match_type,
        platform=match.platform or "Unknown",
        days_active=days_active,
    )
    impact["match_id"] = match_id
    impact["asset_id"] = match.asset_id
    impact["asset_name"] = match.asset_name
    return impact


@router.get("/summary")
async def revenue_summary(db: Session = Depends(get_db)):
    """Quick revenue summary for dashboard widgets."""
    matches = db.query(Match).all()
    enforcements = db.query(EnforcementAction).all()

    impact = RevenueImpactService.calculate_portfolio_impact(matches, enforcements)

    return {
        "total_revenue_lost": impact["total_revenue_lost"],
        "total_revenue_protected": impact["total_revenue_protected"],
        "net_loss": impact["net_loss"],
        "total_estimated_views": impact["total_estimated_views"],
        "cost_of_inaction_90d": impact["cost_of_inaction"],
        "total_violations": impact["total_violations"],
        "projections": impact["projections"],
    }
