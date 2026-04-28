"""
Platform Integration Service — Simulated Takedown APIs

Simulates direct-to-platform enforcement:
  - YouTube Content ID–style matching
  - 1-click DMCA takedown requests
  - Platform-specific compliance workflows
  - Response tracking and SLA monitoring
"""

import uuid
import random
import hashlib
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

PLATFORM_CONFIGS = {
    "youtube": {
        "name": "YouTube Content ID",
        "api_type": "content_id",
        "avg_response_hours": 24,
        "compliance_rate": 0.92,
        "supports": ["block", "track", "monetize"],
        "sla_hours": 48,
    },
    "tiktok": {
        "name": "TikTok Rights Manager",
        "api_type": "rights_manager",
        "avg_response_hours": 36,
        "compliance_rate": 0.85,
        "supports": ["remove", "mute"],
        "sla_hours": 72,
    },
    "instagram": {
        "name": "Instagram IP Report",
        "api_type": "ip_report",
        "avg_response_hours": 48,
        "compliance_rate": 0.80,
        "supports": ["remove", "disable"],
        "sla_hours": 72,
    },
    "twitter": {
        "name": "X/Twitter DMCA",
        "api_type": "dmca_form",
        "avg_response_hours": 72,
        "compliance_rate": 0.75,
        "supports": ["remove", "withhold"],
        "sla_hours": 96,
    },
    "facebook": {
        "name": "Facebook Rights Manager",
        "api_type": "rights_manager",
        "avg_response_hours": 24,
        "compliance_rate": 0.88,
        "supports": ["block", "track", "monetize", "remove"],
        "sla_hours": 48,
    },
    "telegram": {
        "name": "Telegram DMCA Bot",
        "api_type": "dmca_bot",
        "avg_response_hours": 96,
        "compliance_rate": 0.45,
        "supports": ["remove"],
        "sla_hours": 168,
    },
    "reddit": {
        "name": "Reddit Copyright Report",
        "api_type": "copyright_form",
        "avg_response_hours": 48,
        "compliance_rate": 0.82,
        "supports": ["remove"],
        "sla_hours": 72,
    },
}


class PlatformIntegrationService:

    @classmethod
    def submit_takedown(
        cls,
        platform: str,
        content_url: str,
        asset_name: str,
        asset_id: int,
        action_type: str = "remove",
        evidence_hash: str | None = None,
    ) -> dict:
        """Submit a takedown request to a platform (simulated)."""

        config = PLATFORM_CONFIGS.get(platform.lower(), PLATFORM_CONFIGS["twitter"])
        request_id = uuid.uuid4().hex[:12]

        seed = int(hashlib.md5(f"{content_url}:{request_id}".encode()).hexdigest(), 16)
        rng = random.Random(seed)

        # Simulate API submission
        estimated_response = datetime.utcnow() + timedelta(
            hours=config["avg_response_hours"] * rng.uniform(0.5, 1.5)
        )

        return {
            "request_id": request_id,
            "platform": platform.lower(),
            "platform_name": config["name"],
            "api_type": config["api_type"],
            "action_type": action_type,
            "content_url": content_url,
            "asset_name": asset_name,
            "asset_id": asset_id,
            "status": "submitted",
            "submitted_at": datetime.utcnow().isoformat(),
            "estimated_response": estimated_response.isoformat(),
            "sla_deadline": (
                datetime.utcnow() + timedelta(hours=config["sla_hours"])
            ).isoformat(),
            "evidence_hash": evidence_hash,
            "compliance_probability": config["compliance_rate"],
            "available_actions": config["supports"],
            "tracking_url": f"https://aegis.app/takedown/{request_id}",
        }

    @classmethod
    def check_takedown_status(cls, request_id: str, platform: str) -> dict:
        """Check the status of a submitted takedown (simulated progression)."""

        config = PLATFORM_CONFIGS.get(platform.lower(), PLATFORM_CONFIGS["twitter"])
        seed = int(hashlib.md5(request_id.encode()).hexdigest(), 16)
        rng = random.Random(seed)

        # Simulate status based on time elapsed (deterministic per request)
        status_progression = [
            ("submitted", 0),
            ("acknowledged", rng.randint(1, 6)),
            ("under_review", rng.randint(6, 24)),
            ("action_taken" if rng.random() < config["compliance_rate"] else "rejected", rng.randint(24, 96)),
        ]

        # Pick current status based on elapsed sim-hours
        sim_hours = rng.randint(0, 120)
        current_status = "submitted"
        for status, hours in status_progression:
            if sim_hours >= hours:
                current_status = status

        return {
            "request_id": request_id,
            "platform": platform,
            "status": current_status,
            "last_updated": datetime.utcnow().isoformat(),
            "platform_reference": f"{platform.upper()}-{request_id[:8]}",
            "notes": cls._status_note(current_status),
        }

    @classmethod
    def get_platform_overview(cls) -> dict:
        """Overview of all supported platform integrations."""
        platforms = []
        for key, config in PLATFORM_CONFIGS.items():
            platforms.append({
                "id": key,
                "name": config["name"],
                "api_type": config["api_type"],
                "avg_response_hours": config["avg_response_hours"],
                "compliance_rate": round(config["compliance_rate"] * 100, 1),
                "sla_hours": config["sla_hours"],
                "supported_actions": config["supports"],
                "status": "connected",
            })

        return {
            "total_platforms": len(platforms),
            "platforms": platforms,
            "total_compliance_rate": round(
                sum(c["compliance_rate"] for c in PLATFORM_CONFIGS.values())
                / len(PLATFORM_CONFIGS) * 100,
                1,
            ),
        }

    @classmethod
    def youtube_content_id_match(cls, asset_name: str, video_url: str) -> dict:
        """Simulate YouTube Content ID matching result."""
        seed = int(hashlib.md5(f"{asset_name}:{video_url}".encode()).hexdigest(), 16)
        rng = random.Random(seed)

        match_type = rng.choice(["audio", "visual", "audiovisual"])
        confidence = round(rng.uniform(0.75, 0.99), 4)

        return {
            "platform": "youtube",
            "match_type": match_type,
            "confidence": confidence,
            "video_url": video_url,
            "asset_name": asset_name,
            "matched_segments": [
                {
                    "start_time": f"{rng.randint(0, 5)}:{rng.randint(0, 59):02d}",
                    "end_time": f"{rng.randint(5, 15)}:{rng.randint(0, 59):02d}",
                    "similarity": round(rng.uniform(0.8, 0.99), 4),
                }
            ],
            "recommended_actions": (
                ["block", "monetize", "track"]
                if confidence > 0.9
                else ["track"]
            ),
            "content_id_claim": {
                "claimable": confidence > 0.85,
                "claim_type": "visual" if match_type in ["visual", "audiovisual"] else "audio",
                "revenue_share": f"{rng.randint(70, 100)}%",
            },
        }

    @staticmethod
    def _status_note(status: str) -> str:
        notes = {
            "submitted": "Request has been submitted to the platform's abuse team.",
            "acknowledged": "Platform has acknowledged receipt of the takedown request.",
            "under_review": "Content is being reviewed by the platform's moderation team.",
            "action_taken": "Platform has taken action — content has been removed or restricted.",
            "rejected": "Platform has declined the request. Consider legal escalation.",
        }
        return notes.get(status, "Status update pending.")
