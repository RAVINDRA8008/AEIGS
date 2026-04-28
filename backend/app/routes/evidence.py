"""Routes for Evidence Chain — tamper-proof logging and court-ready evidence."""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import logging

from app.services.evidence_chain import EvidenceChainService

logger = logging.getLogger(__name__)
router = APIRouter()


class RecordEvidenceRequest(BaseModel):
    event_type: str
    data: dict = {}
    asset_id: int | None = None
    match_id: int | None = None
    actor: str = "system"


@router.post("/record")
async def record_evidence(request: RecordEvidenceRequest):
    """Record a new evidence entry in the tamper-proof hash chain."""
    result = EvidenceChainService.record_evidence(
        event_type=request.event_type,
        data=request.data,
        asset_id=request.asset_id,
        match_id=request.match_id,
        actor=request.actor,
    )
    return result


@router.get("/chain")
async def get_evidence_chain(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """Retrieve the evidence chain records."""
    return EvidenceChainService.get_chain(limit=limit, offset=offset)


@router.get("/verify")
async def verify_chain():
    """Verify the integrity of the entire evidence chain."""
    return EvidenceChainService.verify_chain()


@router.get("/asset/{asset_id}")
async def get_asset_evidence(asset_id: int):
    """Get all evidence records for a specific asset."""
    records = EvidenceChainService.get_evidence_for_asset(asset_id)
    return {"asset_id": asset_id, "total_records": len(records), "records": records}


@router.get("/court-package/{asset_id}")
async def generate_court_package(asset_id: int):
    """Generate a court-ready evidence package for an asset."""
    return EvidenceChainService.generate_court_package(asset_id)


@router.get("/stats")
async def evidence_stats():
    """Get evidence chain statistics."""
    return EvidenceChainService.get_chain_stats()
