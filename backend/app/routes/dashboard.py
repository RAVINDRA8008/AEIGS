from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.models.database_models import Asset, Match, ScanLog
from app.models.schemas import DashboardStats, MatchResponse, MatchUpdateStatus, MatchListResponse

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    total_assets = db.query(Asset).filter(Asset.is_active == True).count()
    total_matches = db.query(Match).count()
    total_scans = db.query(ScanLog).count()
    pending = db.query(Match).filter(Match.status == "pending").count()
    confirmed = db.query(Match).filter(Match.status == "confirmed").count()

    protection_rate = 0.0
    if total_matches > 0:
        protection_rate = round((confirmed + pending) / max(total_assets, 1) * 100, 1)

    # Recent matches
    recent = db.query(Match).order_by(Match.detected_at.desc()).limit(10).all()

    # Matches by day (last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    daily_matches = (
        db.query(
            func.date(Match.detected_at).label("date"),
            func.count(Match.id).label("count"),
        )
        .filter(Match.detected_at >= thirty_days_ago)
        .group_by(func.date(Match.detected_at))
        .all()
    )

    matches_by_day = [{"date": str(d.date), "count": d.count} for d in daily_matches]

    # Matches by type
    type_counts = (
        db.query(Match.match_type, func.count(Match.id).label("count"))
        .group_by(Match.match_type)
        .all()
    )
    matches_by_type = [{"type": t.match_type, "count": t.count} for t in type_counts]

    return DashboardStats(
        total_assets=total_assets,
        total_matches=total_matches,
        total_scans=total_scans,
        pending_violations=pending,
        confirmed_violations=confirmed,
        protection_rate=protection_rate,
        recent_matches=recent,
        matches_by_day=matches_by_day,
        matches_by_type=matches_by_type,
    )


@router.get("/matches", response_model=MatchListResponse)
async def list_matches(
    skip: int = 0,
    limit: int = 50,
    status: str = None,
    match_type: str = None,
    db: Session = Depends(get_db),
):
    query = db.query(Match)
    if status:
        query = query.filter(Match.status == status)
    if match_type:
        query = query.filter(Match.match_type == match_type)

    total = query.count()
    matches = query.order_by(Match.detected_at.desc()).offset(skip).limit(limit).all()

    return MatchListResponse(total=total, matches=matches)


@router.patch("/matches/{match_id}", response_model=MatchResponse)
async def update_match_status(
    match_id: int,
    update: MatchUpdateStatus,
    db: Session = Depends(get_db),
):
    if update.status not in ["pending", "confirmed", "dismissed"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    match.status = update.status
    db.commit()
    db.refresh(match)
    return match


@router.get("/scan-history")
async def get_scan_history(
    limit: int = 20,
    db: Session = Depends(get_db),
):
    scans = (
        db.query(ScanLog)
        .order_by(ScanLog.scanned_at.desc())
        .limit(limit)
        .all()
    )
    return {
        "scans": [
            {
                "id": s.id,
                "scan_type": s.scan_type,
                "target": s.target,
                "results_count": s.results_count,
                "scanned_at": s.scanned_at.isoformat(),
                "status": s.status,
            }
            for s in scans
        ]
    }


@router.patch("/matches/bulk-update")
async def bulk_update_matches(
    match_ids: list[int],
    status: str,
    db: Session = Depends(get_db),
):
    """Update multiple match statuses at once."""
    if status not in ["pending", "confirmed", "dismissed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    if len(match_ids) > 100:
        raise HTTPException(status_code=400, detail="Max 100 matches per bulk update")

    updated = 0
    for mid in match_ids:
        match = db.query(Match).filter(Match.id == mid).first()
        if match:
            match.status = status
            updated += 1
    db.commit()
    return {"updated": updated, "status": status}


@router.get("/activity")
async def get_activity_feed(
    limit: int = 30,
    db: Session = Depends(get_db),
):
    """Get recent activity across all operations."""
    # Recent matches
    recent_matches = (
        db.query(Match)
        .order_by(Match.detected_at.desc())
        .limit(limit)
        .all()
    )

    # Recent scans
    recent_scans = (
        db.query(ScanLog)
        .order_by(ScanLog.scanned_at.desc())
        .limit(limit)
        .all()
    )

    # Recent assets
    recent_assets = (
        db.query(Asset)
        .filter(Asset.is_active == True)
        .order_by(Asset.uploaded_at.desc())
        .limit(limit)
        .all()
    )

    activities = []

    for m in recent_matches:
        activities.append({
            "type": "violation",
            "icon": "alert",
            "title": f"Violation detected: {m.asset_name}",
            "subtitle": f"{m.match_type} — {m.similarity_score:.1%} match",
            "timestamp": m.detected_at.isoformat(),
            "status": m.status,
        })

    for s in recent_scans:
        activities.append({
            "type": "scan",
            "icon": "scan",
            "title": f"Scan completed: {s.target}",
            "subtitle": f"{s.results_count} matches found ({s.scan_type})",
            "timestamp": s.scanned_at.isoformat(),
            "status": s.status,
        })

    for a in recent_assets:
        activities.append({
            "type": "asset",
            "icon": "shield",
            "title": f"Asset registered: {a.name}",
            "subtitle": f"{a.organization}",
            "timestamp": a.uploaded_at.isoformat(),
            "status": "active",
        })

    # Sort by timestamp desc
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"activities": activities[:limit]}
