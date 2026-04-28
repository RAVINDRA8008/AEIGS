"""
Leak Prediction Engine — Preventive Intelligence

Analyzes asset distribution patterns, recipient behavior, platform risk,
and temporal anomalies to predict leak probability BEFORE it happens.

Produces:
  - Per-asset leak probability (0-100)
  - Per-recipient risk profile
  - Anomaly signals (unusual download patterns, new devices, etc.)
  - Recommended preventive actions
"""

import hashlib
import math
import random
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Simulated behavioral baseline (in production, trained from historical data)
_PLATFORM_LEAK_RATES = {
    "youtube": 0.12,
    "tiktok": 0.25,
    "instagram": 0.18,
    "twitter": 0.22,
    "facebook": 0.15,
    "telegram": 0.45,
    "reddit": 0.20,
    "discord": 0.30,
    "unknown": 0.35,
}

_CONTENT_TYPE_RISK = {
    "exclusive": 0.8,
    "premium": 0.7,
    "licensed": 0.5,
    "standard": 0.3,
    "promotional": 0.1,
}

_RECIPIENT_ROLE_RISK = {
    "contractor": 0.6,
    "partner": 0.4,
    "employee": 0.2,
    "internal": 0.1,
    "press": 0.5,
    "influencer": 0.35,
    "unknown": 0.7,
}


class LeakPredictionService:

    @classmethod
    def predict_asset_risk(
        cls,
        asset_id: int,
        asset_name: str,
        content_type: str = "standard",
        distribution_count: int = 0,
        existing_violations: int = 0,
        platforms_distributed: list[str] | None = None,
        revenue_value: float = 0.0,
    ) -> dict:
        """Calculate leak probability for a single asset."""

        platforms = platforms_distributed or []

        # Factor 1: Content value attractiveness (higher value = higher leak risk)
        value_score = min(revenue_value / 10000, 1.0) if revenue_value > 0 else 0.3
        content_risk = _CONTENT_TYPE_RISK.get(content_type, 0.3)

        # Factor 2: Distribution breadth (more copies = more risk)
        distribution_risk = 1 - math.exp(-0.15 * distribution_count)

        # Factor 3: Platform exposure risk
        platform_risk = 0.0
        if platforms:
            platform_risk = max(_PLATFORM_LEAK_RATES.get(p.lower(), 0.35) for p in platforms)

        # Factor 4: Historical violation rate
        violation_rate = min(existing_violations * 0.15, 1.0)

        # Factor 5: Temporal risk — newer content leaks faster
        temporal_risk = 0.6  # default moderate

        # Weighted combination
        weights = {
            "value_attractiveness": 0.20,
            "content_sensitivity": 0.15,
            "distribution_breadth": 0.20,
            "platform_exposure": 0.20,
            "violation_history": 0.15,
            "temporal_risk": 0.10,
        }

        raw_score = (
            weights["value_attractiveness"] * value_score
            + weights["content_sensitivity"] * content_risk
            + weights["distribution_breadth"] * distribution_risk
            + weights["platform_exposure"] * platform_risk
            + weights["violation_history"] * violation_rate
            + weights["temporal_risk"] * temporal_risk
        )

        probability = round(raw_score * 100, 1)
        probability = min(max(probability, 0), 100)

        # Determine risk level and generate recommendations
        if probability >= 75:
            level = "critical"
            recommendations = [
                "Enable robust DCT watermarking immediately",
                "Reduce distribution to essential recipients only",
                "Enable real-time monitoring for this asset",
                "Consider legal pre-notification to recipients",
            ]
        elif probability >= 50:
            level = "high"
            recommendations = [
                "Apply dual-layer watermarking",
                "Increase monitoring frequency",
                "Review recipient access list",
            ]
        elif probability >= 25:
            level = "medium"
            recommendations = [
                "Standard watermarking applied",
                "Periodic monitoring recommended",
            ]
        else:
            level = "low"
            recommendations = ["Continue standard monitoring"]

        # Anomaly signals
        anomalies = cls._detect_anomalies(
            distribution_count, existing_violations, platforms
        )

        return {
            "asset_id": asset_id,
            "asset_name": asset_name,
            "leak_probability": probability,
            "risk_level": level,
            "factors": {
                "value_attractiveness": round(value_score * 100, 1),
                "content_sensitivity": round(content_risk * 100, 1),
                "distribution_breadth": round(distribution_risk * 100, 1),
                "platform_exposure": round(platform_risk * 100, 1),
                "violation_history": round(violation_rate * 100, 1),
                "temporal_risk": round(temporal_risk * 100, 1),
            },
            "anomalies": anomalies,
            "recommendations": recommendations,
            "predicted_at": datetime.utcnow().isoformat(),
        }

    @classmethod
    def predict_recipient_risk(
        cls,
        recipient: str,
        role: str = "unknown",
        total_assets_shared: int = 0,
        past_violations: int = 0,
        platforms_active: list[str] | None = None,
    ) -> dict:
        """Profile a recipient's leak risk based on behavior patterns."""

        role_risk = _RECIPIENT_ROLE_RISK.get(role, 0.7)

        # Behavioral scoring
        volume_risk = 1 - math.exp(-0.1 * total_assets_shared)
        violation_risk = min(past_violations * 0.25, 1.0)

        platform_risk = 0.0
        if platforms_active:
            platform_risk = sum(
                _PLATFORM_LEAK_RATES.get(p.lower(), 0.35) for p in platforms_active
            ) / len(platforms_active)

        # Weighted risk
        risk_score = (
            0.30 * role_risk
            + 0.25 * violation_risk
            + 0.25 * volume_risk
            + 0.20 * platform_risk
        )

        trust_score = round((1 - risk_score) * 100, 1)
        risk_percent = round(risk_score * 100, 1)

        # Generate behavioral flags
        flags = []
        if violation_risk > 0.5:
            flags.append("repeat_violator")
        if volume_risk > 0.6:
            flags.append("high_volume_access")
        if platform_risk > 0.3:
            flags.append("high_risk_platforms")
        if role_risk > 0.5:
            flags.append("elevated_role_risk")

        return {
            "recipient": recipient,
            "role": role,
            "trust_score": trust_score,
            "risk_score": risk_percent,
            "risk_level": (
                "critical" if risk_percent >= 75
                else "high" if risk_percent >= 50
                else "medium" if risk_percent >= 25
                else "low"
            ),
            "behavioral_flags": flags,
            "recommendation": (
                "restrict_access" if risk_percent >= 75
                else "enhanced_monitoring" if risk_percent >= 50
                else "standard_monitoring" if risk_percent >= 25
                else "trusted"
            ),
        }

    @classmethod
    def identify_leak_source(
        cls,
        watermark_uid: str | None = None,
        detection_platform: str = "unknown",
        detection_time: str | None = None,
        propagation_nodes: list[dict] | None = None,
    ) -> dict:
        """Attempt to identify who leaked content based on available evidence."""

        evidence_strength = 0.0
        source_info = {
            "identified": False,
            "source_type": "unknown",
            "confidence": 0.0,
            "evidence": [],
        }

        # Evidence 1: Watermark tracing (strongest signal)
        if watermark_uid:
            evidence_strength += 0.6
            source_info["evidence"].append({
                "type": "watermark_trace",
                "weight": 0.6,
                "detail": f"Unique watermark UID {watermark_uid[:8]}... links to specific recipient",
            })
            source_info["identified"] = True
            source_info["source_type"] = "watermark_traced"

        # Evidence 2: Propagation analysis
        if propagation_nodes and len(propagation_nodes) > 0:
            # Find the earliest node (ground zero)
            sorted_nodes = sorted(
                propagation_nodes,
                key=lambda n: n.get("detected_at", "9999"),
            )
            ground_zero = sorted_nodes[0]
            evidence_strength += 0.25
            source_info["evidence"].append({
                "type": "propagation_origin",
                "weight": 0.25,
                "detail": f"First detection on {ground_zero.get('platform', 'unknown')}",
                "ground_zero": ground_zero,
            })
            source_info["ground_zero_platform"] = ground_zero.get("platform")
            source_info["ground_zero_url"] = ground_zero.get("url")

        # Evidence 3: Platform pattern analysis
        if detection_platform != "unknown":
            evidence_strength += 0.15
            source_info["evidence"].append({
                "type": "platform_analysis",
                "weight": 0.15,
                "detail": f"Detected on {detection_platform} — analyzing upload pattern",
            })

        source_info["confidence"] = round(min(evidence_strength, 1.0), 2)
        source_info["evidence_strength"] = (
            "conclusive" if evidence_strength >= 0.7
            else "strong" if evidence_strength >= 0.5
            else "moderate" if evidence_strength >= 0.3
            else "weak"
        )

        return source_info

    @staticmethod
    def _detect_anomalies(
        distribution_count: int,
        violations: int,
        platforms: list[str],
    ) -> list[dict]:
        """Detect anomalous patterns in asset distribution."""
        anomalies = []

        if distribution_count > 10:
            anomalies.append({
                "type": "over_distribution",
                "severity": "high",
                "detail": f"Asset shared with {distribution_count} recipients — above safe threshold",
            })

        if violations > 3:
            anomalies.append({
                "type": "repeat_violations",
                "severity": "critical",
                "detail": f"{violations} violations detected — systematic leaking pattern",
            })

        high_risk_platforms = [
            p for p in platforms
            if _PLATFORM_LEAK_RATES.get(p.lower(), 0) > 0.3
        ]
        if high_risk_platforms:
            anomalies.append({
                "type": "high_risk_platforms",
                "severity": "medium",
                "detail": f"Present on high-risk platforms: {', '.join(high_risk_platforms)}",
            })

        return anomalies

    @classmethod
    def generate_leak_simulation(cls, asset_name: str) -> dict:
        """Generate a realistic leak simulation for demo purposes."""

        # Deterministic but varied based on asset name
        seed = int(hashlib.md5(asset_name.encode()).hexdigest(), 16) % 10000
        rng = random.Random(seed)

        platforms = ["youtube", "tiktok", "instagram", "twitter", "telegram", "reddit"]
        selected_platforms = rng.sample(platforms, k=rng.randint(2, 4))

        now = datetime.utcnow()
        events = []

        # Simulate leak timeline
        leak_start = now - timedelta(hours=rng.randint(1, 48))
        current = leak_start

        for i, platform in enumerate(selected_platforms):
            delay = timedelta(minutes=rng.randint(5, 120) * (i + 1))
            current = leak_start + delay
            reach = rng.randint(100, 500000) * (len(selected_platforms) - i)

            events.append({
                "timestamp": current.isoformat(),
                "platform": platform,
                "event_type": "first_detection" if i == 0 else "spread",
                "reach": reach,
                "url": f"https://{platform}.com/content/{rng.randint(10000, 99999)}",
                "velocity": round(reach / max(1, (current - leak_start).total_seconds() / 3600), 1),
            })

        # Identify simulated source
        source_recipient = rng.choice([
            "media_partner_alpha",
            "contractor_john_doe",
            "agency_xyz",
            "freelancer_review_copy",
            "press_early_access",
        ])

        total_reach = sum(e["reach"] for e in events)
        revenue_at_risk = round(total_reach * rng.uniform(0.001, 0.01), 2)

        return {
            "simulation": True,
            "asset_name": asset_name,
            "leak_origin": {
                "platform": events[0]["platform"],
                "timestamp": events[0]["timestamp"],
                "suspected_source": source_recipient,
                "confidence": round(rng.uniform(0.75, 0.98), 2),
            },
            "propagation_timeline": events,
            "total_platforms_affected": len(selected_platforms),
            "total_reach": total_reach,
            "revenue_at_risk": revenue_at_risk,
            "time_to_viral": f"{rng.randint(15, 360)} minutes",
            "top_amplifier": {
                "platform": rng.choice(selected_platforms),
                "amplification_factor": round(rng.uniform(5, 50), 1),
            },
        }
