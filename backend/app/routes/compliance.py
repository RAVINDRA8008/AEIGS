"""Routes for Compliance & Forensic Audit."""

from fastapi import APIRouter, Query
from typing import Optional

from app.services.compliance import ComplianceService

router = APIRouter()


@router.get("/audit-log")
async def get_audit_log(
    limit: int = Query(50, ge=1, le=200),
    category: Optional[str] = Query(None),
):
    """Get forensic-grade audit log with tamper-proof hashing."""
    return ComplianceService.get_audit_log(limit=limit, category=category)


@router.get("/status")
async def get_compliance_status():
    """Get compliance status across all regulatory frameworks."""
    return ComplianceService.get_compliance_status()


@router.get("/data-governance")
async def get_data_governance():
    """Get data governance and privacy controls."""
    return ComplianceService.get_data_governance()


@router.get("/verify")
async def verify_audit_integrity():
    """Verify the integrity of the entire audit chain."""
    return ComplianceService.verify_audit_integrity()
