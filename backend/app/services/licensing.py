"""
Revenue Recovery & Licensing Service

Converts violations into licensing opportunities.
Instead of just takedowns, offers monetization paths.
"""

import random
import hashlib
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

LICENSE_TIERS = [
    {"tier": "Clip License", "price_range": [99, 499], "duration": "per clip", "description": "Single clip usage rights for social media and editorial"},
    {"tier": "Highlight Package", "price_range": [999, 4999], "duration": "monthly", "description": "Curated highlights for fan channels and sports media"},
    {"tier": "Broadcast Syndication", "price_range": [9999, 49999], "duration": "per event", "description": "Full broadcast redistribution rights for regional partners"},
    {"tier": "Creator Partnership", "price_range": [299, 1499], "duration": "monthly", "description": "Revenue sharing model for fan content creators"},
    {"tier": "Enterprise API", "price_range": [4999, 19999], "duration": "monthly", "description": "API access for sports data and clip integration"},
]

CONVERSION_CHANNELS = ["Fan Channel", "Sports Blog", "News Outlet", "Aggregator App", "Social Media Influencer", "Regional Broadcaster", "Podcast/Commentary"]


class LicensingService:
    _initialized = False

    @classmethod
    def initialize(cls):
        cls._initialized = True
        logger.info("LicensingService initialized")

    @classmethod
    def get_licensing_dashboard(cls) -> dict:
        """Get licensing opportunity dashboard."""
        random.seed(_seed("licensing-dash"))

        # Active licensing opportunities from violations
        opportunities = []
        for i in range(12):
            s = _seed(f"opp-{i}")
            random.seed(s)
            tier = random.choice(LICENSE_TIERS)
            channel_type = random.choice(CONVERSION_CHANNELS)
            followers = random.randint(5000, 2000000)
            violations = random.randint(3, 50)
            price = random.randint(tier["price_range"][0], tier["price_range"][1])

            opportunities.append({
                "id": f"LIC-{hashlib.md5(f'opp-{i}'.encode()).hexdigest()[:8].upper()}",
                "violator_handle": f"@{_generate_name(s)}",
                "channel_type": channel_type,
                "platform": random.choice(["YouTube", "Twitter/X", "TikTok", "Twitch", "Instagram"]),
                "followers": followers,
                "monthly_views": followers * random.randint(5, 30),
                "violations_count": violations,
                "revenue_potential": price,
                "suggested_tier": tier["tier"],
                "tier_description": tier["description"],
                "conversion_probability": round(random.uniform(0.25, 0.85), 2),
                "status": random.choice(["identified", "contacted", "negotiating", "converted", "declined"]),
                "estimated_monthly_revenue": round(price * random.uniform(0.8, 1.2), 2),
                "content_type": random.choice(["highlights", "commentary", "analysis", "reactions", "compilations"]),
            })

        opportunities.sort(key=lambda x: x["revenue_potential"], reverse=True)

        # Converted licenses (success stories)
        converted = [o for o in opportunities if o["status"] == "converted"]
        active_revenue = sum(o["estimated_monthly_revenue"] for o in converted)

        # Pipeline metrics
        pipeline = {
            "identified": len([o for o in opportunities if o["status"] == "identified"]),
            "contacted": len([o for o in opportunities if o["status"] == "contacted"]),
            "negotiating": len([o for o in opportunities if o["status"] == "negotiating"]),
            "converted": len(converted),
            "declined": len([o for o in opportunities if o["status"] == "declined"]),
        }

        random.seed()

        return {
            "summary": {
                "total_opportunities": len(opportunities),
                "total_pipeline_value": sum(o["revenue_potential"] for o in opportunities),
                "active_monthly_revenue": round(active_revenue, 2),
                "conversion_rate": round(len(converted) / max(len(opportunities), 1) * 100, 1),
                "avg_deal_value": round(sum(o["revenue_potential"] for o in opportunities) / max(len(opportunities), 1), 2),
                "revenue_vs_takedown_ratio": round(active_revenue / max(sum(o["revenue_potential"] for o in opportunities), 1) * 100, 1),
            },
            "pipeline": pipeline,
            "opportunities": opportunities,
            "license_tiers": LICENSE_TIERS,
        }

    @classmethod
    def evaluate_opportunity(cls, violation_id: str = None) -> dict:
        """Evaluate whether a violation should become a licensing opportunity."""
        seed = _seed(f"eval-{violation_id or 'demo'}")
        random.seed(seed)

        followers = random.randint(1000, 5000000)
        violations = random.randint(1, 100)
        monthly_views = followers * random.randint(3, 25)
        tier = random.choice(LICENSE_TIERS)

        # Scoring logic
        audience_score = min(100, followers / 20000 * 100)
        engagement_score = round(random.uniform(30, 95), 1)
        compliance_score = max(0, 100 - violations * 2)
        brand_safety = round(random.uniform(40, 95), 1)

        overall = round((audience_score * 0.3 + engagement_score * 0.25 + compliance_score * 0.25 + brand_safety * 0.2), 1)

        recommendation = "license" if overall > 60 else "monitor" if overall > 40 else "takedown"

        random.seed()

        return {
            "violation_id": violation_id,
            "evaluation": {
                "audience_score": round(audience_score, 1),
                "engagement_score": engagement_score,
                "compliance_history": compliance_score,
                "brand_safety_score": brand_safety,
                "overall_score": overall,
            },
            "recommendation": recommendation,
            "suggested_action": {
                "license": {
                    "action": "Offer Licensing Agreement",
                    "description": f"This creator has {followers:,} followers and strong engagement. Converting to a {tier['tier']} ({tier['duration']}) could generate ${tier['price_range'][0]}-${tier['price_range'][1]} recurring revenue.",
                    "suggested_tier": tier["tier"],
                    "suggested_price": random.randint(tier["price_range"][0], tier["price_range"][1]),
                },
                "monitor": {
                    "action": "Monitor & Evaluate",
                    "description": "This creator shows potential but needs further evaluation. Continue monitoring their content and engagement before deciding.",
                },
                "takedown": {
                    "action": "Proceed with DMCA Takedown",
                    "description": "This account has low conversion potential and high infringement severity. Standard DMCA enforcement recommended.",
                },
            }.get(recommendation),
            "financial_comparison": {
                "takedown_outcome": {
                    "immediate_revenue": 0,
                    "deterrence_value": round(random.uniform(500, 5000), 2),
                    "legal_cost": round(random.uniform(50, 500), 2),
                },
                "licensing_outcome": {
                    "monthly_revenue": round(random.uniform(tier["price_range"][0], tier["price_range"][1]) * 0.8, 2),
                    "annual_projection": round(random.uniform(tier["price_range"][0], tier["price_range"][1]) * 10, 2),
                    "audience_reach": f"{monthly_views:,} monthly views",
                },
            },
        }

    @classmethod
    def get_recovery_metrics(cls) -> dict:
        """Get revenue recovery metrics — takedown vs licensing comparison."""
        random.seed(_seed("recovery-metrics"))

        months = []
        for i in range(6):
            month_date = (datetime.utcnow() - timedelta(days=30 * (5 - i))).strftime("%b %Y")
            takedown_count = random.randint(50, 300)
            licensed_count = random.randint(5, 40)
            takedown_revenue = 0
            license_revenue = licensed_count * random.randint(200, 3000)

            months.append({
                "month": month_date,
                "takedowns": takedown_count,
                "licenses_issued": licensed_count,
                "takedown_revenue": takedown_revenue,
                "license_revenue": license_revenue,
                "total_revenue": license_revenue,
                "conversion_rate": round(licensed_count / max(takedown_count + licensed_count, 1) * 100, 1),
            })

        random.seed()

        total_license_revenue = sum(m["license_revenue"] for m in months)

        return {
            "period": "Last 6 months",
            "monthly_data": months,
            "totals": {
                "total_takedowns": sum(m["takedowns"] for m in months),
                "total_licenses": sum(m["licenses_issued"] for m in months),
                "total_license_revenue": total_license_revenue,
                "avg_license_value": round(total_license_revenue / max(sum(m["licenses_issued"] for m in months), 1), 2),
                "revenue_trend": "growing",
            },
            "insight": f"Licensing generated ${total_license_revenue:,.2f} in revenue that would have been $0 through takedowns alone. Converting just 10% more violations to licenses could add ${round(total_license_revenue * 0.3, 2):,.2f} in annual revenue.",
        }


def _seed(key: str) -> int:
    return int(hashlib.md5(key.encode()).hexdigest()[:8], 16)


def _generate_name(seed_val: int) -> str:
    random.seed(seed_val)
    prefixes = ["sports", "goal", "match", "replay", "fan", "highlight", "stream", "live"]
    suffixes = ["tv", "hub", "zone", "daily", "pro", "cast", "clips", "hq"]
    return f"{random.choice(prefixes)}_{random.choice(suffixes)}{random.randint(1, 99)}"
