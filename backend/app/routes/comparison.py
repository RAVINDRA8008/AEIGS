"""Routes for Content Comparison — Side-by-side forensic analysis."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.services.comparison import ComparisonService

router = APIRouter()


class CompareRequest(BaseModel):
    original_name: str
    suspect_name: str
    asset_id: Optional[int] = None


class BatchCompareRequest(BaseModel):
    original_name: str
    suspects: list[str]


@router.post("/analyze")
async def compare_content(req: CompareRequest):
    """Run comprehensive comparison between original and suspect content."""
    return ComparisonService.compare_content(
        original_name=req.original_name,
        suspect_name=req.suspect_name,
        asset_id=req.asset_id,
    )


@router.post("/batch")
async def batch_compare(req: BatchCompareRequest):
    """Compare one original against multiple suspects."""
    return ComparisonService.batch_compare(
        original_name=req.original_name,
        suspects=req.suspects,
    )
