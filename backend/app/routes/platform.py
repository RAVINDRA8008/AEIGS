"""Routes for Platform Integration — simulated takedowns and Content ID."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

from app.services.platform_integration import PlatformIntegrationService

logger = logging.getLogger(__name__)
router = APIRouter()


class TakedownRequest(BaseModel):
    platform: str
    content_url: str
    asset_name: str
    asset_id: int
    action_type: str = "remove"
    evidence_hash: str | None = None


class ContentIdRequest(BaseModel):
    asset_name: str
    video_url: str


@router.post("/takedown")
async def submit_takedown(request: TakedownRequest):
    """Submit a 1-click takedown request to a platform."""
    result = PlatformIntegrationService.submit_takedown(
        platform=request.platform,
        content_url=request.content_url,
        asset_name=request.asset_name,
        asset_id=request.asset_id,
        action_type=request.action_type,
        evidence_hash=request.evidence_hash,
    )
    return result


@router.get("/takedown-status/{request_id}")
async def check_status(request_id: str, platform: str = "youtube"):
    """Check the status of a takedown request."""
    return PlatformIntegrationService.check_takedown_status(request_id, platform)


@router.get("/platforms")
async def list_platforms():
    """Get overview of all supported platform integrations."""
    return PlatformIntegrationService.get_platform_overview()


@router.post("/content-id")
async def youtube_content_id(request: ContentIdRequest):
    """Simulate YouTube Content ID matching."""
    return PlatformIntegrationService.youtube_content_id_match(
        asset_name=request.asset_name,
        video_url=request.video_url,
    )
