"""
Revenue Impact Engine

Calculates financial impact of content piracy — estimated revenue lost,
revenue protected through takedowns, projected future losses, and
per-asset / per-platform monetary breakdowns.
"""

import math
import logging
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)

# Average revenue per 1,000 views by platform (CPM in USD)
PLATFORM_CPM = {
    "youtube.com": 12.00,
    "facebook.com": 8.50,
    "instagram.com": 10.00,
    "twitter.com": 6.50,
    "x.com": 6.50,
    "tiktok.com": 5.00,
    "reddit.com": 3.00,
    "telegram": 1.50,
    "dailymotion.com": 4.00,
    "twitch.tv": 15.00,
    "unknown": 4.00,
    "Upload Scan": 4.00,
    "Batch Scan": 4.00,
}

# Sports content multiplier (sports media commands premium CPM)
SPORTS_CONTENT_MULTIPLIER = 2.5

# Licensing value per asset (illustrative base)
BASE_LICENSING_VALUE = 500.0  # USD per unique asset


class RevenueImpactService:

    @staticmethod
    def estimate_views_from_score(similarity_score: float, spread_count: int = 1) -> int:
        """Estimate potential views based on similarity and spread."""
        base_views = 5000
        similarity_boost = similarity_score ** 2 * 10000
        spread_boost = math.log2(max(spread_count, 1) + 1) * 3000
        return int(base_views + similarity_boost + spread_boost)

    @staticmethod
    def calculate_single_violation(
        similarity_score: float = 0.0,
        match_type: str = "near-duplicate",
        platform: str = "Unknown",
        spread_count: int = 1,
        days_active: int = 1,
    ) -> dict:
        """Calculate revenue impact for a single violation."""

        platform_key = platform.lower().replace("www.", "")
        cpm = PLATFORM_CPM.get(platform_key, PLATFORM_CPM["unknown"])

        # Estimate views
        estimated_views = RevenueImpactService.estimate_views_from_score(
            similarity_score, spread_count
        )
        # Scale by days active (content accumulates views over time)
        estimated_views = int(estimated_views * math.log2(max(days_active, 1) + 1))

        # Revenue lost = views * (CPM / 1000) * sports multiplier
        revenue_lost = round(estimated_views * (cpm / 1000) * SPORTS_CONTENT_MULTIPLIER, 2)

        # Licensing value at risk (higher similarity = more direct competition)
        licensing_impact = round(BASE_LICENSING_VALUE * similarity_score, 2)

        # Total impact
        total_impact = round(revenue_lost + licensing_impact, 2)

        return {
            "estimated_views": estimated_views,
            "cpm_rate": cpm,
            "revenue_lost": revenue_lost,
            "licensing_impact": licensing_impact,
            "total_impact": total_impact,
            "platform": platform,
            "match_type": match_type,
            "similarity_score": similarity_score,
            "days_active": days_active,
        }

    @staticmethod
    def calculate_portfolio_impact(matches: list, enforcements: list = None) -> dict:
        """Calculate total revenue impact across all violations."""

        total_revenue_lost = 0.0
        total_licensing_impact = 0.0
        total_estimated_views = 0
        total_revenue_protected = 0.0
        platform_breakdown = {}
        asset_breakdown = {}
        monthly_trend = {}

        now = datetime.now(timezone.utc)

        for match in matches:
            detected_at = match.detected_at if hasattr(match, 'detected_at') else now
            if detected_at.tzinfo is None:
                detected_at = detected_at.replace(tzinfo=timezone.utc)
            days_active = max((now - detected_at).days, 1)

            impact = RevenueImpactService.calculate_single_violation(
                similarity_score=match.similarity_score,
                match_type=match.match_type,
                platform=match.platform or "Unknown",
                spread_count=1,
                days_active=days_active,
            )

            total_revenue_lost += impact["revenue_lost"]
            total_licensing_impact += impact["licensing_impact"]
            total_estimated_views += impact["estimated_views"]

            # Platform breakdown
            plat = match.platform or "Unknown"
            if plat not in platform_breakdown:
                platform_breakdown[plat] = {
                    "violations": 0,
                    "revenue_lost": 0.0,
                    "estimated_views": 0,
                }
            platform_breakdown[plat]["violations"] += 1
            platform_breakdown[plat]["revenue_lost"] += impact["revenue_lost"]
            platform_breakdown[plat]["estimated_views"] += impact["estimated_views"]

            # Asset breakdown
            asset_key = f"{match.asset_id}:{match.asset_name}"
            if asset_key not in asset_breakdown:
                asset_breakdown[asset_key] = {
                    "asset_id": match.asset_id,
                    "asset_name": match.asset_name,
                    "violations": 0,
                    "revenue_lost": 0.0,
                    "estimated_views": 0,
                }
            asset_breakdown[asset_key]["violations"] += 1
            asset_breakdown[asset_key]["revenue_lost"] += impact["revenue_lost"]
            asset_breakdown[asset_key]["estimated_views"] += impact["estimated_views"]

            # Monthly trend
            month_key = detected_at.strftime("%Y-%m")
            if month_key not in monthly_trend:
                monthly_trend[month_key] = {"month": month_key, "revenue_lost": 0.0, "violations": 0}
            monthly_trend[month_key]["revenue_lost"] += impact["revenue_lost"]
            monthly_trend[month_key]["violations"] += 1

        # Calculate revenue protected from successful enforcements
        if enforcements:
            for enforcement in enforcements:
                if enforcement.status in ("complied", "acknowledged"):
                    # Estimate recovered revenue (enforcement stopped further views)
                    total_revenue_protected += BASE_LICENSING_VALUE * 0.6

        # Project future losses (30 / 60 / 90 day projections)
        daily_loss_rate = total_revenue_lost / max(30, 1)  # Normalize to daily
        projections = {
            "30_day": round(daily_loss_rate * 30, 2),
            "60_day": round(daily_loss_rate * 60 * 1.15, 2),  # Growth factor
            "90_day": round(daily_loss_rate * 90 * 1.35, 2),
        }

        # Round platform breakdown values
        for p in platform_breakdown.values():
            p["revenue_lost"] = round(p["revenue_lost"], 2)

        # Sort and take top assets
        top_assets = sorted(
            asset_breakdown.values(),
            key=lambda x: x["revenue_lost"],
            reverse=True,
        )[:10]
        for a in top_assets:
            a["revenue_lost"] = round(a["revenue_lost"], 2)

        # Sort monthly trend
        trend = sorted(monthly_trend.values(), key=lambda x: x["month"])
        for t in trend:
            t["revenue_lost"] = round(t["revenue_lost"], 2)

        return {
            "total_revenue_lost": round(total_revenue_lost, 2),
            "total_licensing_impact": round(total_licensing_impact, 2),
            "total_impact": round(total_revenue_lost + total_licensing_impact, 2),
            "total_estimated_views": total_estimated_views,
            "total_revenue_protected": round(total_revenue_protected, 2),
            "net_loss": round(total_revenue_lost + total_licensing_impact - total_revenue_protected, 2),
            "total_violations": len(matches),
            "projections": projections,
            "platform_breakdown": platform_breakdown,
            "top_impacted_assets": top_assets,
            "monthly_trend": trend,
            "cost_of_inaction": round(projections["90_day"] * 1.5, 2),
        }
