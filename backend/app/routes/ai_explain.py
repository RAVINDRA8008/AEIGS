"""Routes for AI Narration & Intelligence Layer."""

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional

from app.services.ai_narration import AINarrationService

router = APIRouter()


class ExplainRequest(BaseModel):
    violation_type: Optional[str] = None
    context: Optional[dict] = None


@router.post("/explain")
async def explain_violation(req: ExplainRequest):
    """AI-generated explanation for a specific violation."""
    return AINarrationService.explain_violation(
        violation_type=req.violation_type,
        context=req.context or {},
    )


@router.get("/asset/{asset_id}")
async def get_asset_intelligence(asset_id: str):
    """AI intelligence briefing for an asset."""
    return AINarrationService.get_asset_intelligence(asset_id=asset_id)


@router.get("/briefing")
async def get_strategic_briefing():
    """AI strategic briefing with actionable insights."""
    return AINarrationService.get_strategic_briefing()
