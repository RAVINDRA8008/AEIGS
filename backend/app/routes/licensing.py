"""Routes for Revenue Recovery & Licensing."""

from fastapi import APIRouter, Query

from app.services.licensing import LicensingService

router = APIRouter()


@router.get("/dashboard")
async def get_licensing_dashboard():
    """Get licensing opportunity dashboard with pipeline."""
    return LicensingService.get_licensing_dashboard()


@router.get("/evaluate/{violation_id}")
async def evaluate_opportunity(violation_id: str):
    """Evaluate whether a violation should become a licensing opportunity."""
    return LicensingService.evaluate_opportunity(violation_id=violation_id)


@router.get("/metrics")
async def get_recovery_metrics():
    """Get revenue recovery metrics — takedown vs licensing comparison."""
    return LicensingService.get_recovery_metrics()
