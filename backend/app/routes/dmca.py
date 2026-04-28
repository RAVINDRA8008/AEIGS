"""Routes for DMCA Report Generator — Automated takedown notices."""

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional

from app.services.dmca_report import DMCAReportService

router = APIRouter()


class TakedownRequest(BaseModel):
    platform: str
    asset_name: str
    infringing_url: str
    owner_name: str = "AEGIS Rights Holder"
    owner_email: str = "legal@aegis-protection.com"
    description: str = ""
    similarity_score: float = 0.0


class ViolationItem(BaseModel):
    platform: str
    asset_name: str
    url: str
    similarity: float = 0.0


class BatchTakedownRequest(BaseModel):
    violations: list[ViolationItem]


@router.post("/generate")
async def generate_notice(req: TakedownRequest):
    """Generate a single DMCA takedown notice."""
    return DMCAReportService.generate_takedown_notice(
        platform=req.platform,
        asset_name=req.asset_name,
        infringing_url=req.infringing_url,
        owner_name=req.owner_name,
        owner_email=req.owner_email,
        description=req.description,
        similarity_score=req.similarity_score,
    )


@router.post("/batch")
async def generate_batch_notices(req: BatchTakedownRequest):
    """Generate multiple DMCA notices at once."""
    violations = [v.model_dump() for v in req.violations]
    return DMCAReportService.generate_batch_notices(violations)


@router.get("/report")
async def get_enforcement_report(days: int = Query(30, ge=1, le=365)):
    """Get comprehensive enforcement report with stats."""
    return DMCAReportService.get_enforcement_report(days=days)


@router.get("/platforms")
async def get_platform_directory():
    """Get directory of supported platforms and their DMCA submission info."""
    return DMCAReportService.get_platform_directory()
