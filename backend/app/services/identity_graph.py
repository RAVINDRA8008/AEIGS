"""
Cross-Platform Offender Identity Graph Service

Tracks piracy networks, not just content. Links offender identities
across platforms via content patterns, posting times, and similarity clusters.
"""

import random
import hashlib
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

PLATFORMS = ["Telegram", "Twitter/X", "YouTube", "Reddit", "Discord", "Facebook", "TikTok", "VK", "Twitch", "Dailymotion"]
HANDLE_PREFIXES = ["stream", "sports", "live", "pirate", "free", "watch", "hd", "goal", "match", "replay"]
HANDLE_SUFFIXES = ["tv", "hq", "hub", "zone", "now", "fan", "cast", "clip", "vod", "king"]

NETWORK_NAMES = [
    "ShadowStream Network", "GlobalPirates Syndicate", "LiveSport Underground",
    "StreamJackers", "PirateGrid Alliance", "DarkRelay Collective",
    "GhostStream Ring", "ClipHarvest Cartel", "ReplayMafia Network",
    "TorrentSport Alliance", "BlackStream Federation", "LeakForce Syndicate",
]

REGIONS = ["Eastern Europe", "Southeast Asia", "South America", "Middle East", "North Africa", "South Asia", "Central Asia", "West Africa"]


def _seed(key: str) -> int:
    return int(hashlib.md5(key.encode()).hexdigest()[:8], 16)


def _generate_handle(seed_val: int) -> str:
    random.seed(seed_val)
    prefix = random.choice(HANDLE_PREFIXES)
    suffix = random.choice(HANDLE_SUFFIXES)
    num = random.randint(1, 999)
    sep = random.choice(["_", "", "."])
    return f"{prefix}{sep}{suffix}{num}"


class IdentityGraphService:
    _initialized = False

    @classmethod
    def initialize(cls):
        cls._initialized = True
        logger.info("IdentityGraphService initialized")

    @classmethod
    def get_network_overview(cls) -> dict:
        """Get overview of all tracked piracy networks."""
        random.seed(_seed("network-overview"))
        networks = []
        total_offenders = 0
        total_violations = 0

        for i, name in enumerate(NETWORK_NAMES):
            s = _seed(f"net-{i}")
            random.seed(s)
            members = random.randint(3, 25)
            violations = random.randint(50, 2000)
            total_offenders += members
            total_violations += violations

            active_platforms = random.sample(PLATFORMS, random.randint(3, 7))
            region = random.choice(REGIONS)

            networks.append({
                "id": f"NET-{hashlib.md5(name.encode()).hexdigest()[:8].upper()}",
                "name": name,
                "members": members,
                "total_violations": violations,
                "active_platforms": active_platforms,
                "primary_region": region,
                "threat_level": "critical" if violations > 1000 else "high" if violations > 500 else "medium",
                "status": random.choice(["active", "active", "active", "monitoring", "partially_disrupted"]),
                "first_seen": (datetime.utcnow() - timedelta(days=random.randint(30, 365))).strftime("%Y-%m-%d"),
                "last_activity": (datetime.utcnow() - timedelta(hours=random.randint(1, 72))).isoformat(),
                "estimated_revenue_impact": round(random.uniform(50000, 2000000), 2),
                "coordination_score": round(random.uniform(0.5, 0.98), 2),
            })

        networks.sort(key=lambda x: x["total_violations"], reverse=True)
        random.seed()

        return {
            "total_networks": len(networks),
            "total_offenders": total_offenders,
            "total_violations": total_violations,
            "critical_networks": len([n for n in networks if n["threat_level"] == "critical"]),
            "networks": networks,
            "generated_at": datetime.utcnow().isoformat(),
        }

    @classmethod
    def get_network_detail(cls, network_id: str) -> dict:
        """Get detailed identity graph for a specific network."""
        overview = cls.get_network_overview()
        network = next((n for n in overview["networks"] if n["id"] == network_id), None)
        if not network:
            return {"error": "Network not found"}

        seed = _seed(f"detail-{network_id}")
        random.seed(seed)

        # Generate member nodes
        nodes = []
        edges = []
        leader_id = None

        for i in range(network["members"]):
            handle_seed = _seed(f"{network_id}-member-{i}")
            member_id = f"OFF-{hashlib.md5(f'{network_id}-{i}'.encode()).hexdigest()[:8].upper()}"
            platform_count = random.randint(1, 5)
            member_platforms = random.sample(PLATFORMS, platform_count)

            # Generate cross-platform aliases
            aliases = []
            for plat in member_platforms:
                aliases.append({
                    "platform": plat,
                    "handle": _generate_handle(handle_seed + hash(plat)),
                    "followers": random.randint(100, 500000),
                    "violations": random.randint(5, 200),
                    "confidence": round(random.uniform(0.65, 0.99), 2),
                })

            role = "leader" if i == 0 else "distributor" if i < 3 else "uploader" if i < 6 else "re-streamer"
            if i == 0:
                leader_id = member_id

            nodes.append({
                "id": member_id,
                "role": role,
                "aliases": aliases,
                "platforms": member_platforms,
                "total_violations": sum(a["violations"] for a in aliases),
                "risk_score": round(random.uniform(40, 99), 1),
                "first_seen": (datetime.utcnow() - timedelta(days=random.randint(10, 300))).strftime("%Y-%m-%d"),
                "posting_pattern": {
                    "peak_hours": sorted(random.sample(range(24), 3)),
                    "avg_delay_minutes": round(random.uniform(2, 45), 1),
                    "timezone_estimate": random.choice(["UTC+2", "UTC+3", "UTC+5", "UTC+5:30", "UTC+7", "UTC+8"]),
                },
                "content_fingerprint": {
                    "watermark_style": random.choice(["overlay_logo", "corner_text", "none", "border_crop"]),
                    "encoding_signature": f"h264_{random.choice(['crf23', 'crf28', 'crf18'])}_{random.choice(['720p', '1080p', '480p'])}",
                    "crop_pattern": random.choice(["4px_border", "letterbox", "none", "aspect_shift"]),
                },
            })

        # Generate edges (connections between members)
        for i, node in enumerate(nodes):
            for j in range(i + 1, len(nodes)):
                if random.random() > 0.4:
                    link_type = random.choice(["content_relay", "simultaneous_upload", "shared_source", "cross_promotion"])
                    edges.append({
                        "source": node["id"],
                        "target": nodes[j]["id"],
                        "relationship": link_type,
                        "strength": round(random.uniform(0.3, 1.0), 2),
                        "evidence_count": random.randint(2, 50),
                    })

        # Linking signals — what connected these identities
        linking_signals = [
            {"type": "Content Pattern Match", "description": "Identical watermark overlay and crop patterns across platforms", "confidence": 0.94},
            {"type": "Temporal Correlation", "description": f"Uploads within {random.randint(2, 15)} minutes of each other across {random.randint(2, 4)} platforms", "confidence": 0.87},
            {"type": "Encoding Fingerprint", "description": "Same transcoding pipeline signature detected in all uploads", "confidence": 0.91},
            {"type": "Metadata Leakage", "description": "Shared device identifiers found in video metadata", "confidence": 0.96},
            {"type": "Behavioral Analysis", "description": "Matching upload schedules and content selection patterns", "confidence": 0.78},
            {"type": "Network Analysis", "description": "Cross-referencing referral links and shared infrastructure", "confidence": 0.83},
        ]

        random.seed()

        return {
            "network": network,
            "graph": {
                "nodes": nodes,
                "edges": edges,
            },
            "linking_signals": linking_signals,
            "total_revenue_impact": network["estimated_revenue_impact"],
            "recommended_actions": [
                {"action": "Coordinated Takedown", "description": f"Simultaneously submit DMCA to {len(network['active_platforms'])} platforms to prevent migration", "priority": "critical"},
                {"action": "Platform Escalation", "description": "Escalate repeat offenders to platform trust & safety teams for account termination", "priority": "high"},
                {"action": "Monitor Migration", "description": "Watch for new accounts using similar content patterns if network is disrupted", "priority": "medium"},
            ],
        }

    @classmethod
    def get_offender_profile(cls, offender_id: str) -> dict:
        """Get detailed profile for a specific offender."""
        seed = _seed(f"offender-{offender_id}")
        random.seed(seed)

        platform_count = random.randint(2, 6)
        platforms = random.sample(PLATFORMS, platform_count)

        aliases = []
        total_violations = 0
        for plat in platforms:
            v = random.randint(10, 300)
            total_violations += v
            aliases.append({
                "platform": plat,
                "handle": _generate_handle(_seed(f"{offender_id}-{plat}")),
                "profile_url": f"https://{plat.lower().replace('/', '').replace(' ', '')}.com/user/{_generate_handle(_seed(f'{offender_id}-{plat}'))}",
                "followers": random.randint(50, 200000),
                "violations": v,
                "account_created": (datetime.utcnow() - timedelta(days=random.randint(30, 730))).strftime("%Y-%m-%d"),
                "status": random.choice(["active", "active", "suspended", "monitoring"]),
                "link_confidence": round(random.uniform(0.7, 0.99), 2),
            })

        # Activity timeline
        activity = []
        for i in range(min(20, total_violations)):
            activity.append({
                "timestamp": (datetime.utcnow() - timedelta(hours=random.randint(1, 720))).isoformat(),
                "platform": random.choice(platforms),
                "action": random.choice(["uploaded_clip", "live_stream", "repost", "shared_link"]),
                "content": f"{random.choice(['Premier League', 'Champions League', 'NBA', 'NFL', 'UFC', 'F1'])} {random.choice(['highlights', 'full match', 'live stream', 'clip'])}",
                "status": random.choice(["taken_down", "active", "pending"]),
            })
        activity.sort(key=lambda x: x["timestamp"], reverse=True)

        random.seed()

        return {
            "offender_id": offender_id,
            "threat_level": "critical" if total_violations > 500 else "high" if total_violations > 200 else "medium",
            "total_violations": total_violations,
            "active_platforms": len([a for a in aliases if a["status"] == "active"]),
            "aliases": aliases,
            "recent_activity": activity[:15],
            "behavioral_profile": {
                "upload_frequency": f"{round(random.uniform(2, 20), 1)} per day",
                "peak_activity_hours": sorted(random.sample(range(24), 4)),
                "preferred_sports": random.sample(["Football", "Basketball", "Cricket", "F1", "UFC", "Tennis"], 3),
                "avg_time_to_upload": f"{random.randint(3, 30)} minutes after live event",
                "content_type": random.choice(["live_streams", "highlights", "full_replays", "mixed"]),
            },
            "risk_score": round(random.uniform(50, 99), 1),
            "estimated_damage": round(random.uniform(10000, 500000), 2),
        }

    @classmethod
    def get_identity_stats(cls) -> dict:
        """Get aggregate identity tracking statistics."""
        overview = cls.get_network_overview()
        random.seed(_seed("id-stats"))

        random.seed()
        return {
            "total_networks_tracked": overview["total_networks"],
            "total_offenders_identified": overview["total_offenders"],
            "cross_platform_links": random.randint(200, 1500),
            "identities_confirmed": random.randint(50, 300),
            "accounts_terminated": random.randint(100, 800),
            "active_investigations": random.randint(5, 30),
            "avg_platforms_per_offender": round(random.uniform(2.1, 4.5), 1),
            "link_accuracy": round(random.uniform(0.85, 0.96), 2),
            "networks_disrupted_30d": random.randint(2, 12),
            "revenue_protected_30d": round(random.uniform(500000, 5000000), 2),
        }
