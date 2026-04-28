"""
Risk Scoring Engine

Multi-factor risk scoring for violations. Combines similarity confidence,
platform impact, content type, spread velocity, and revenue potential to
produce a single prioritised risk score (0-100) with a human-readable level.
"""

import logging

logger = logging.getLogger(__name__)

# Platform impact weights (higher = more damaging)
PLATFORM_WEIGHTS = {
    "youtube.com": 0.95,
    "facebook.com": 0.90,
    "instagram.com": 0.90,
    "twitter.com": 0.85,
    "x.com": 0.85,
    "tiktok.com": 0.92,
    "reddit.com": 0.75,
    "telegram": 0.70,
    "whatsapp": 0.60,
    "pinterest.com": 0.50,
    "unknown": 0.40,
}

# Match-type severity
TYPE_SEVERITY = {
    "exact": 1.0,
    "near-duplicate": 0.85,
    "derivative": 0.65,
    "modified": 0.50,
    "low-similarity": 0.25,
}


class RiskScoringService:

    @staticmethod
    def calculate(
        similarity_score: float = 0.0,
        match_type: str = "near-duplicate",
        platform: str = "Unknown",
        source_url: str = "",
        spread_count: int = 0,
        is_sports_content: bool = True,
    ) -> dict:
        """Return a risk assessment dict with overall score, level, factors, and recommendations."""

        # --- Factor scores (each 0-1) ---

        # 1. Similarity confidence
        sim_factor = min(similarity_score, 1.0)

        # 2. Match-type severity
        type_factor = TYPE_SEVERITY.get(match_type, 0.4)

        # 3. Platform impact
        platform_key = platform.lower().replace("www.", "")
        platform_factor = PLATFORM_WEIGHTS.get(platform_key, PLATFORM_WEIGHTS["unknown"])

        # 4. Spread velocity (logarithmic)
        import math
        spread_factor = min(math.log2(spread_count + 1) / 10.0, 1.0)

        # 5. Content category bonus
        content_factor = 0.85 if is_sports_content else 0.50

        # 6. URL presence (has a live URL = higher risk)
        url_factor = 0.8 if source_url else 0.3

        # --- Weighted combination ---
        weights = {
            "similarity": 0.25,
            "type_severity": 0.20,
            "platform_impact": 0.20,
            "spread_velocity": 0.10,
            "content_value": 0.15,
            "url_evidence": 0.10,
        }

        raw = (
            sim_factor * weights["similarity"]
            + type_factor * weights["type_severity"]
            + platform_factor * weights["platform_impact"]
            + spread_factor * weights["spread_velocity"]
            + content_factor * weights["content_value"]
            + url_factor * weights["url_evidence"]
        )

        overall = round(raw * 100, 1)

        # --- Level ---
        if overall >= 80:
            level = "critical"
        elif overall >= 60:
            level = "high"
        elif overall >= 40:
            level = "medium"
        else:
            level = "low"

        # --- Recommendations ---
        recs: list[str] = []
        if overall >= 80:
            recs.append("Immediate DMCA takedown recommended")
            recs.append("Escalate to legal team")
        if overall >= 60:
            recs.append("Generate enforcement notice")
            recs.append("Document evidence for legal proceedings")
        if platform_factor >= 0.85:
            recs.append(f"High-impact platform ({platform}) — prioritise removal")
        if spread_factor >= 0.3:
            recs.append("Content is spreading — act quickly")
        if not recs:
            recs.append("Monitor for further activity")

        # --- Revenue impact estimate (illustrative) ---
        base_revenue_per_view = 0.012  # $/view for sports media
        estimated_views = max(spread_count * 500, 100)
        revenue_at_risk = round(estimated_views * base_revenue_per_view, 2)

        return {
            "overall_score": overall,
            "risk_level": level,
            "factors": {
                "similarity_confidence": round(sim_factor * 100, 1),
                "type_severity": round(type_factor * 100, 1),
                "platform_impact": round(platform_factor * 100, 1),
                "spread_velocity": round(spread_factor * 100, 1),
                "content_value": round(content_factor * 100, 1),
                "url_evidence": round(url_factor * 100, 1),
            },
            "revenue_at_risk": revenue_at_risk,
            "estimated_views": estimated_views,
            "recommendations": recs,
        }
