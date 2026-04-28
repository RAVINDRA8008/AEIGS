from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import json
import logging

from app.database import get_db
from app.models.database_models import Asset, RightsZone
from app.models.schemas import RightsZoneCreateRequest, RightsZoneResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/zones", response_model=RightsZoneResponse)
async def create_rights_zone(
    request: RightsZoneCreateRequest,
    db: Session = Depends(get_db),
):
    """Create a regional rights zone for an asset."""
    asset = db.query(Asset).filter(Asset.id == request.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    zone = RightsZone(
        asset_id=request.asset_id,
        region=request.region,
        license_type=request.license_type,
        licensee=request.licensee,
        platforms_allowed=json.dumps(request.platforms_allowed),
        max_uses=request.max_uses,
        notes=request.notes,
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.get("/zones/{asset_id}", response_model=list[RightsZoneResponse])
async def get_asset_rights(
    asset_id: int,
    db: Session = Depends(get_db),
):
    """Get all rights zones for an asset."""
    zones = (
        db.query(RightsZone)
        .filter(RightsZone.asset_id == asset_id, RightsZone.is_active == True)
        .all()
    )
    return zones


@router.delete("/zones/{zone_id}")
async def deactivate_zone(
    zone_id: int,
    db: Session = Depends(get_db),
):
    zone = db.query(RightsZone).filter(RightsZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Rights zone not found")
    zone.is_active = False
    db.commit()
    return {"message": "Rights zone deactivated"}


@router.get("/check")
async def check_rights(
    asset_id: int,
    region: str,
    platform: str = "",
    db: Session = Depends(get_db),
):
    """Check if usage is authorized for a given asset, region, and platform."""
    zones = (
        db.query(RightsZone)
        .filter(
            RightsZone.asset_id == asset_id,
            RightsZone.region == region,
            RightsZone.is_active == True,
        )
        .all()
    )

    if not zones:
        return {
            "authorized": False,
            "reason": "no_rights_zone",
            "message": f"No rights defined for region '{region}'",
        }

    for zone in zones:
        if zone.license_type == "blocked":
            return {
                "authorized": False,
                "reason": "region_blocked",
                "message": f"Content is blocked in region '{region}'",
            }

        if platform:
            allowed = json.loads(zone.platforms_allowed) if zone.platforms_allowed else []
            if allowed and platform.lower() not in [p.lower() for p in allowed]:
                return {
                    "authorized": False,
                    "reason": "platform_not_allowed",
                    "message": f"Platform '{platform}' not authorized for region '{region}'",
                    "allowed_platforms": allowed,
                }

    return {
        "authorized": True,
        "license_type": zones[0].license_type,
        "licensee": zones[0].licensee,
    }


@router.get("/overview")
async def rights_overview(db: Session = Depends(get_db)):
    """Global rights management overview."""
    total_zones = db.query(func.count(RightsZone.id)).filter(RightsZone.is_active == True).scalar() or 0
    assets_with_rights = (
        db.query(func.count(func.distinct(RightsZone.asset_id)))
        .filter(RightsZone.is_active == True)
        .scalar()
        or 0
    )
    regions = (
        db.query(RightsZone.region, func.count(RightsZone.id))
        .filter(RightsZone.is_active == True)
        .group_by(RightsZone.region)
        .all()
    )
    license_types = (
        db.query(RightsZone.license_type, func.count(RightsZone.id))
        .filter(RightsZone.is_active == True)
        .group_by(RightsZone.license_type)
        .all()
    )

    return {
        "total_zones": total_zones,
        "assets_with_rights": assets_with_rights,
        "by_region": {r: c for r, c in regions},
        "by_license_type": {lt: c for lt, c in license_types},
    }
