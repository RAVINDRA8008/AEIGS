"""Routes for Geographic Piracy Analytics — Global Heatmap."""

from fastapi import APIRouter, Query
from typing import Optional

from app.services.geo_analytics import GeoAnalyticsService

router = APIRouter()


@router.get("/heatmap")
async def get_heatmap(
    sport: Optional[str] = Query(None, description="Filter by sport"),
    days: int = Query(30, ge=1, le=365),
):
    """Get worldwide piracy heatmap data with intensity values per region."""
    return GeoAnalyticsService.get_heatmap_data(sport_filter=sport, days=days)


@router.get("/region/{region_id}")
async def get_region_detail(region_id: str):
    """Get detailed piracy analytics for a specific region."""
    return GeoAnalyticsService.get_regional_detail(region_id)


@router.get("/continents")
async def get_continent_summary():
    """Aggregate piracy stats by continent."""
    return GeoAnalyticsService.get_continent_summary()


@router.get("/trending")
async def get_trending_hotspots(limit: int = Query(10, ge=1, le=30)):
    """Get regions with fastest-growing piracy rates."""
    return GeoAnalyticsService.get_trending_hotspots(limit=limit)
