from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import json
import logging

from app.database import get_db
from app.models.database_models import Asset, Match, PropagationNode
from app.models.schemas import PropagationNodeResponse, PropagationTreeResponse
from app.services.risk_scoring import RiskScoringService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/tree/{asset_id}", response_model=PropagationTreeResponse)
async def get_propagation_tree(
    asset_id: int,
    db: Session = Depends(get_db),
):
    """Get the full content propagation tree for an asset."""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    nodes = (
        db.query(PropagationNode)
        .filter(PropagationNode.asset_id == asset_id)
        .order_by(PropagationNode.detected_at)
        .all()
    )

    platforms = list(set(n.platform for n in nodes))
    total_reach = sum(n.reach_estimate for n in nodes)

    return PropagationTreeResponse(
        asset_id=asset_id,
        asset_name=asset.name,
        total_nodes=len(nodes),
        platforms_affected=platforms,
        total_reach=total_reach,
        nodes=[PropagationNodeResponse.model_validate(n) for n in nodes],
    )


@router.post("/track/{match_id}")
async def track_propagation(
    match_id: int,
    db: Session = Depends(get_db),
):
    """Create a propagation node from a detected match."""
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Check for existing node
    existing = (
        db.query(PropagationNode)
        .filter(
            PropagationNode.match_id == match_id,
            PropagationNode.asset_id == match.asset_id,
        )
        .first()
    )
    if existing:
        return {"message": "Already tracked", "node_id": existing.id}

    # Find a parent node (earliest detection on same platform or any)
    parent = (
        db.query(PropagationNode)
        .filter(PropagationNode.asset_id == match.asset_id)
        .order_by(PropagationNode.detected_at)
        .first()
    )

    # Calculate spread velocity
    sibling_count = (
        db.query(func.count(PropagationNode.id))
        .filter(PropagationNode.asset_id == match.asset_id)
        .scalar()
        or 0
    )

    node = PropagationNode(
        asset_id=match.asset_id,
        match_id=match.id,
        platform=match.platform,
        url=match.source_url,
        detected_at=match.detected_at,
        spread_velocity=round(sibling_count * 0.15 + match.similarity_score * 0.5, 2),
        reach_estimate=max(100, sibling_count * 500),
        parent_node_id=parent.id if parent else None,
        status="active",
    )
    db.add(node)
    db.commit()
    db.refresh(node)

    return {"message": "Propagation tracked", "node_id": node.id}


@router.get("/overview")
async def propagation_overview(db: Session = Depends(get_db)):
    """Global propagation statistics."""
    total_nodes = db.query(func.count(PropagationNode.id)).scalar() or 0
    total_reach = db.query(func.sum(PropagationNode.reach_estimate)).scalar() or 0
    platforms = (
        db.query(PropagationNode.platform, func.count(PropagationNode.id))
        .group_by(PropagationNode.platform)
        .all()
    )
    assets_affected = (
        db.query(func.count(func.distinct(PropagationNode.asset_id))).scalar() or 0
    )

    # Top spreading assets
    top_assets = (
        db.query(
            PropagationNode.asset_id,
            func.count(PropagationNode.id).label("node_count"),
            func.sum(PropagationNode.reach_estimate).label("total_reach"),
        )
        .group_by(PropagationNode.asset_id)
        .order_by(func.count(PropagationNode.id).desc())
        .limit(10)
        .all()
    )

    top_list = []
    for row in top_assets:
        asset = db.query(Asset).filter(Asset.id == row.asset_id).first()
        top_list.append(
            {
                "asset_id": row.asset_id,
                "asset_name": asset.name if asset else "Unknown",
                "nodes": row.node_count,
                "reach": row.total_reach or 0,
            }
        )

    return {
        "total_nodes": total_nodes,
        "total_reach": total_reach,
        "assets_affected": assets_affected,
        "platforms": {p: c for p, c in platforms},
        "top_spreading_assets": top_list,
    }
