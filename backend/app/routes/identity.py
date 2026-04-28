"""Routes for Cross-Platform Offender Identity Graph."""

from fastapi import APIRouter, Query

from app.services.identity_graph import IdentityGraphService

router = APIRouter()


@router.get("/networks")
async def get_network_overview():
    """Get overview of all tracked piracy networks."""
    return IdentityGraphService.get_network_overview()


@router.get("/networks/{network_id}")
async def get_network_detail(network_id: str):
    """Get detailed identity graph for a specific network."""
    return IdentityGraphService.get_network_detail(network_id)


@router.get("/offender/{offender_id}")
async def get_offender_profile(offender_id: str):
    """Get detailed cross-platform profile for a specific offender."""
    return IdentityGraphService.get_offender_profile(offender_id)


@router.get("/stats")
async def get_identity_stats():
    """Get aggregate identity tracking statistics."""
    return IdentityGraphService.get_identity_stats()
