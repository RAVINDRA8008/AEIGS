from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
import csv
import io
import json

from app.database import get_db
from app.models.database_models import Asset, Match, ScanLog

router = APIRouter()


@router.get("/violations/export")
async def export_violations(
    format: str = "csv",
    status: str = None,
    days: int = 30,
    db: Session = Depends(get_db),
):
    """Export violation records as CSV."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    query = db.query(Match).filter(Match.detected_at >= cutoff)
    if status:
        query = query.filter(Match.status == status)
    matches = query.order_by(Match.detected_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Asset Name", "Match Type", "Similarity Score",
        "Hash Similarity", "Embedding Similarity", "Platform",
        "Status", "Detected At", "Source URL",
    ])
    for m in matches:
        writer.writerow([
            m.id, m.asset_name, m.match_type,
            f"{m.similarity_score:.4f}", f"{m.hash_similarity:.4f}",
            f"{m.embedding_similarity:.4f}", m.platform,
            m.status, m.detected_at.isoformat(), m.source_url,
        ])

    output.seek(0)
    filename = f"aegis_violations_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/assets/export")
async def export_assets(
    db: Session = Depends(get_db),
):
    """Export all active assets as CSV."""
    assets = db.query(Asset).filter(Asset.is_active == True).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Name", "Description", "Organization", "File Type",
        "File Size (bytes)", "pHash", "aHash", "dHash", "wHash",
        "Uploaded At", "AI Description",
    ])
    for a in assets:
        writer.writerow([
            a.id, a.name, a.description, a.organization,
            a.file_type, a.file_size, a.phash, a.ahash, a.dhash, a.whash,
            a.uploaded_at.isoformat(), a.gemini_description[:200] if a.gemini_description else "",
        ])

    output.seek(0)
    filename = f"aegis_assets_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/summary")
async def report_summary(
    days: int = 30,
    db: Session = Depends(get_db),
):
    """Generate a comprehensive report summary."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    total_assets = db.query(Asset).filter(Asset.is_active == True).count()
    total_matches = db.query(Match).filter(Match.detected_at >= cutoff).count()
    total_scans = db.query(ScanLog).filter(ScanLog.scanned_at >= cutoff).count()

    # Status breakdown
    status_counts = dict(
        db.query(Match.status, func.count(Match.id))
        .filter(Match.detected_at >= cutoff)
        .group_by(Match.status).all()
    )

    # Type breakdown
    type_counts = dict(
        db.query(Match.match_type, func.count(Match.id))
        .filter(Match.detected_at >= cutoff)
        .group_by(Match.match_type).all()
    )

    # Top violated assets
    top_assets = (
        db.query(Match.asset_name, func.count(Match.id).label("count"))
        .filter(Match.detected_at >= cutoff)
        .group_by(Match.asset_name)
        .order_by(func.count(Match.id).desc())
        .limit(10)
        .all()
    )

    # Average similarity by type
    avg_similarity = dict(
        db.query(Match.match_type, func.avg(Match.similarity_score))
        .filter(Match.detected_at >= cutoff)
        .group_by(Match.match_type).all()
    )

    # Daily trend
    daily = (
        db.query(
            func.date(Match.detected_at).label("date"),
            func.count(Match.id).label("count"),
        )
        .filter(Match.detected_at >= cutoff)
        .group_by(func.date(Match.detected_at))
        .order_by(func.date(Match.detected_at))
        .all()
    )

    # Platform breakdown
    platform_counts = dict(
        db.query(Match.platform, func.count(Match.id))
        .filter(Match.detected_at >= cutoff)
        .group_by(Match.platform).all()
    )

    return {
        "period_days": days,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_protected_assets": total_assets,
            "total_violations": total_matches,
            "total_scans": total_scans,
            "pending": status_counts.get("pending", 0),
            "confirmed": status_counts.get("confirmed", 0),
            "dismissed": status_counts.get("dismissed", 0),
        },
        "violations_by_type": type_counts,
        "violations_by_platform": platform_counts,
        "top_violated_assets": [
            {"name": name, "count": count} for name, count in top_assets
        ],
        "avg_similarity_by_type": {
            k: round(v, 4) for k, v in avg_similarity.items() if v
        },
        "daily_trend": [
            {"date": str(d.date), "count": d.count} for d in daily
        ],
    }
