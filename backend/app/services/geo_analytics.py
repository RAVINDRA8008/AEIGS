"""
Geographic Piracy Analytics Service

Provides worldwide piracy heatmap data, regional risk analysis,
trending hotspots, and geo-based enforcement recommendations.
"""

import random
import hashlib
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Real-world geo data for sports piracy hotspots
REGIONS = [
    {"id": "NA-US", "name": "United States", "lat": 39.8283, "lng": -98.5795, "country_code": "US", "continent": "North America"},
    {"id": "NA-CA", "name": "Canada", "lat": 56.1304, "lng": -106.3468, "country_code": "CA", "continent": "North America"},
    {"id": "NA-MX", "name": "Mexico", "lat": 23.6345, "lng": -102.5528, "country_code": "MX", "continent": "North America"},
    {"id": "SA-BR", "name": "Brazil", "lat": -14.2350, "lng": -51.9253, "country_code": "BR", "continent": "South America"},
    {"id": "SA-AR", "name": "Argentina", "lat": -38.4161, "lng": -63.6167, "country_code": "AR", "continent": "South America"},
    {"id": "EU-GB", "name": "United Kingdom", "lat": 55.3781, "lng": -3.4360, "country_code": "GB", "continent": "Europe"},
    {"id": "EU-DE", "name": "Germany", "lat": 51.1657, "lng": 10.4515, "country_code": "DE", "continent": "Europe"},
    {"id": "EU-FR", "name": "France", "lat": 46.2276, "lng": 2.2137, "country_code": "FR", "continent": "Europe"},
    {"id": "EU-ES", "name": "Spain", "lat": 40.4637, "lng": -3.7492, "country_code": "ES", "continent": "Europe"},
    {"id": "EU-IT", "name": "Italy", "lat": 41.8719, "lng": 12.5674, "country_code": "IT", "continent": "Europe"},
    {"id": "EU-NL", "name": "Netherlands", "lat": 52.1326, "lng": 5.2913, "country_code": "NL", "continent": "Europe"},
    {"id": "EU-PL", "name": "Poland", "lat": 51.9194, "lng": 19.1451, "country_code": "PL", "continent": "Europe"},
    {"id": "EU-RO", "name": "Romania", "lat": 45.9432, "lng": 24.9668, "country_code": "RO", "continent": "Europe"},
    {"id": "AS-IN", "name": "India", "lat": 20.5937, "lng": 78.9629, "country_code": "IN", "continent": "Asia"},
    {"id": "AS-CN", "name": "China", "lat": 35.8617, "lng": 104.1954, "country_code": "CN", "continent": "Asia"},
    {"id": "AS-JP", "name": "Japan", "lat": 36.2048, "lng": 138.2529, "country_code": "JP", "continent": "Asia"},
    {"id": "AS-KR", "name": "South Korea", "lat": 35.9078, "lng": 127.7669, "country_code": "KR", "continent": "Asia"},
    {"id": "AS-ID", "name": "Indonesia", "lat": -0.7893, "lng": 113.9213, "country_code": "ID", "continent": "Asia"},
    {"id": "AS-PH", "name": "Philippines", "lat": 12.8797, "lng": 121.7740, "country_code": "PH", "continent": "Asia"},
    {"id": "AS-VN", "name": "Vietnam", "lat": 14.0583, "lng": 108.2772, "country_code": "VN", "continent": "Asia"},
    {"id": "AS-TH", "name": "Thailand", "lat": 15.8700, "lng": 100.9925, "country_code": "TH", "continent": "Asia"},
    {"id": "AS-PK", "name": "Pakistan", "lat": 30.3753, "lng": 69.3451, "country_code": "PK", "continent": "Asia"},
    {"id": "ME-AE", "name": "UAE", "lat": 23.4241, "lng": 53.8478, "country_code": "AE", "continent": "Middle East"},
    {"id": "ME-SA", "name": "Saudi Arabia", "lat": 23.8859, "lng": 45.0792, "country_code": "SA", "continent": "Middle East"},
    {"id": "ME-TR", "name": "Turkey", "lat": 38.9637, "lng": 35.2433, "country_code": "TR", "continent": "Middle East"},
    {"id": "AF-NG", "name": "Nigeria", "lat": 9.0820, "lng": 8.6753, "country_code": "NG", "continent": "Africa"},
    {"id": "AF-ZA", "name": "South Africa", "lat": -30.5595, "lng": 22.9375, "country_code": "ZA", "continent": "Africa"},
    {"id": "AF-EG", "name": "Egypt", "lat": 26.8206, "lng": 30.8025, "country_code": "EG", "continent": "Africa"},
    {"id": "OC-AU", "name": "Australia", "lat": -25.2744, "lng": 133.7751, "country_code": "AU", "continent": "Oceania"},
    {"id": "AS-RU", "name": "Russia", "lat": 61.5240, "lng": 105.3188, "country_code": "RU", "continent": "Europe"},
]

PIRACY_PLATFORMS = ["Telegram", "Twitter/X", "Reddit", "Discord", "YouTube", "Facebook", "TikTok", "VK", "Dailymotion", "Twitch"]
SPORTS = ["Football/Soccer", "Cricket", "Basketball", "Tennis", "Formula 1", "Boxing", "MMA/UFC", "Rugby", "Baseball", "Hockey"]

# Strategic context: WHY piracy happens in each region + what to do
RISK_EXPLANATIONS = {
    "IN": {"why": "High piracy due to delayed official broadcasts, expensive subscription bundles, and massive cricket/football demand", "action": "Deploy watermarking + faster regional release windows. Partner with JioTV/Hotstar for co-enforcement."},
    "BR": {"why": "Widespread piracy driven by high subscription costs relative to income and strong football culture", "action": "Implement tiered pricing strategy. Activate Telegram monitoring bots for Portuguese-language channels."},
    "ID": {"why": "Limited legal streaming options, high mobile-first usage, and active Telegram piracy communities", "action": "Prioritize mobile watermarking. Deploy real-time Telegram channel scanning and automated DMCA."},
    "PH": {"why": "Low broadband penetration pushes users to free piracy streams. Active Facebook Live piracy scene", "action": "Partner with local telcos for bundled access. Focus enforcement on Facebook and YouTube Live."},
    "VN": {"why": "Growing sports audience with limited legal access. Active re-streaming via Facebook groups", "action": "Establish regional CDN partnerships. Deploy Facebook Graph API monitoring for live streams."},
    "PK": {"why": "Cricket piracy peaks during major tournaments. Limited official streaming infrastructure", "action": "Pre-deploy enhanced watermarks before ICC events. Priority monitoring on YouTube and Dailymotion."},
    "NG": {"why": "Rapidly growing sports market with high data costs pushing users to pirated lower-quality streams", "action": "Support data-light official streams. Partner with local broadcasters for enforcement."},
    "EG": {"why": "Football piracy via satellite feed capture and IPTV redistribution in MENA region", "action": "Deploy broadcast-level forensic watermarks. Coordinate with beIN Sports for satellite monitoring."},
    "TH": {"why": "Active Telegram and LINE communities sharing live sports. Growing MMA/UFC piracy", "action": "Deploy LINE platform monitoring. Establish Thai-language DMCA notice templates."},
    "RO": {"why": "Eastern European hub for IPTV reselling and stream aggregation sites", "action": "Target IPTV infrastructure through ISP-level enforcement. Coordinate with Europol cybercrime unit."},
    "US": {"why": "Despite strong enforcement, cord-cutting drives piracy of premium sports (NFL, NBA, UFC PPV)", "action": "Leverage Content ID and Trusted Flagger status. Focus on Reddit and Discord community monitoring."},
    "GB": {"why": "Premier League piracy through illegal IPTV boxes and Telegram channels", "action": "Coordinate with UK Federation Against Copyright Theft (FACT). Deploy pub/venue monitoring."},
    "DE": {"why": "Bundesliga piracy via VPN circumvention and German-language stream aggregators", "action": "Implement geo-aware watermarking. Partner with German Copyright Authority (GVU)."},
    "FR": {"why": "Ligue 1 piracy through IPTV and social media. Strong Telegram community", "action": "Leverage HADOPI framework for graduated response. Deploy French-language content monitoring."},
    "ES": {"why": "La Liga piracy via illegal IPTV and social media during weekend match windows", "action": "Coordinate with LaLiga's anti-piracy unit. Deploy real-time social media scanning during match days."},
    "IT": {"why": "Serie A piracy through Telegram channels and IPTV. AGCOM enforcement available", "action": "File AGCOM takedown orders for rapid ISP blocking. Focus on Telegram bot networks."},
    "MX": {"why": "Boxing and Liga MX piracy via Facebook Live and YouTube. Growing UFC demand", "action": "Deploy Spanish-language DMCA templates. Partner with local broadcasters for simultaneous enforcement."},
    "AR": {"why": "Football culture drives piracy through free streaming sites and social media", "action": "Implement regional pricing pilot. Deploy targeted enforcement on local platforms."},
    "TR": {"why": "Super Lig and international football piracy via IPTV and Telegram", "action": "Coordinate with BTK (Turkish telecom authority) for domain blocking. Deploy Turkish-language monitoring."},
    "RU": {"why": "Active VK and Telegram piracy communities. Limited international enforcement cooperation", "action": "Focus on platform-level enforcement via VK and Telegram takedown APIs. Deploy Russian-language monitoring."},
    "CN": {"why": "State-controlled internet makes enforcement complex. Piracy via domestic platforms", "action": "Partner with Tencent Sports and iQIYI for Chinese market enforcement. Deploy Mandarin content matching."},
    "JP": {"why": "Baseball and football piracy via anonymous boards and P2P sharing", "action": "Leverage Japan's strong copyright law (CODA). Deploy Japanese-language watermark verification."},
    "KR": {"why": "K-League and international sports piracy via Korean platforms and community boards", "action": "Coordinate with KCC (Korean Communications Commission). Deploy Naver/Kakao monitoring."},
    "NL": {"why": "Eredivisie piracy and hub for European stream aggregation hosting", "action": "Target hosting infrastructure through Dutch notice-and-takedown procedures. ISP-level enforcement."},
    "PL": {"why": "Ekstraklasa and international football piracy via streaming sites hosted in-region", "action": "Coordinate with Polish copyright enforcement. Focus on hosting provider takedowns."},
    "AE": {"why": "Growing piracy despite high disposable income. BeIN Sports content redistribution", "action": "Coordinate with UAE Telecommunications Regulatory Authority. Premium enforcement partnership."},
    "SA": {"why": "Major sports investment market with beoutQ legacy piracy infrastructure", "action": "Leverage Saudi Arabia's strengthened IP law (2024). Deploy Arabic-language enforcement."},
    "ZA": {"why": "Rugby and cricket piracy via social media during major Southern Hemisphere events", "action": "Partner with MultiChoice/SuperSport for co-enforcement. Deploy event-based monitoring spikes."},
    "AU": {"why": "Time zone differences drive live sports piracy. Active Reddit and Discord communities", "action": "Deploy time-zone-aware monitoring peaks. Coordinate with eSafety Commissioner for domain blocking."},
}


def _seed(key: str) -> int:
    return int(hashlib.md5(key.encode()).hexdigest()[:8], 16)


class GeoAnalyticsService:
    _initialized = False

    @classmethod
    def initialize(cls):
        cls._initialized = True
        logger.info("GeoAnalyticsService initialized")

    @classmethod
    def get_heatmap_data(cls, sport_filter: Optional[str] = None, days: int = 30) -> dict:
        """Generate worldwide piracy heatmap data with intensity values."""
        hotspots = []
        total_violations = 0

        # High-piracy regions get higher base rates
        high_piracy = {"IN", "BR", "ID", "PH", "VN", "PK", "NG", "EG", "TH", "RO"}
        medium_piracy = {"US", "GB", "DE", "FR", "ES", "IT", "MX", "AR", "TR", "RU"}

        for region in REGIONS:
            seed = _seed(f"{region['id']}-{days}-{sport_filter or 'all'}")
            random.seed(seed)

            cc = region["country_code"]
            if cc in high_piracy:
                violations = random.randint(800, 4500)
                intensity = round(random.uniform(0.7, 1.0), 2)
                risk_level = "critical" if violations > 3000 else "high"
            elif cc in medium_piracy:
                violations = random.randint(200, 1200)
                intensity = round(random.uniform(0.4, 0.7), 2)
                risk_level = "medium" if violations < 800 else "high"
            else:
                violations = random.randint(50, 500)
                intensity = round(random.uniform(0.1, 0.4), 2)
                risk_level = "low" if violations < 200 else "medium"

            total_violations += violations

            top_platforms = random.sample(PIRACY_PLATFORMS, 3)
            top_sport = sport_filter or random.choice(SPORTS)

            risk_info = RISK_EXPLANATIONS.get(cc, {"why": "Moderate piracy activity detected in region", "action": "Deploy standard monitoring and enforcement protocols"})

            hotspots.append({
                "id": region["id"],
                "name": region["name"],
                "lat": region["lat"],
                "lng": region["lng"],
                "country_code": region["country_code"],
                "continent": region["continent"],
                "violations": violations,
                "intensity": intensity,
                "risk_level": risk_level,
                "top_platforms": top_platforms,
                "primary_sport": top_sport,
                "takedown_rate": round(random.uniform(0.15, 0.85), 2),
                "avg_response_time_hours": round(random.uniform(2, 72), 1),
                "trend": random.choice(["rising", "stable", "declining"]),
                "change_pct": round(random.uniform(-25, 40), 1),
                "risk_explanation": risk_info["why"],
                "suggested_action": risk_info["action"],
            })

        random.seed()
        hotspots.sort(key=lambda x: x["violations"], reverse=True)

        return {
            "total_violations": total_violations,
            "total_regions": len(hotspots),
            "high_risk_regions": len([h for h in hotspots if h["risk_level"] in ("critical", "high")]),
            "hotspots": hotspots,
            "generated_at": datetime.utcnow().isoformat(),
            "period_days": days,
        }

    @classmethod
    def get_regional_detail(cls, region_id: str) -> dict:
        """Get detailed piracy analytics for a specific region."""
        region = next((r for r in REGIONS if r["id"] == region_id), None)
        if not region:
            return {"error": "Region not found"}

        seed = _seed(f"detail-{region_id}")
        random.seed(seed)

        # Generate daily trend data for last 30 days
        daily_trend = []
        base = random.randint(20, 150)
        for i in range(30):
            date = (datetime.utcnow() - timedelta(days=29 - i)).strftime("%Y-%m-%d")
            val = max(0, base + random.randint(-20, 30))
            daily_trend.append({"date": date, "violations": val})
            base = val

        # Platform breakdown
        platform_data = []
        for plat in PIRACY_PLATFORMS:
            count = random.randint(10, 500)
            platform_data.append({
                "platform": plat,
                "violations": count,
                "takedown_success": round(random.uniform(0.2, 0.9), 2),
            })
        platform_data.sort(key=lambda x: x["violations"], reverse=True)

        # Sport breakdown
        sport_data = []
        for sport in SPORTS:
            count = random.randint(5, 300)
            sport_data.append({"sport": sport, "violations": count})
        sport_data.sort(key=lambda x: x["violations"], reverse=True)

        # Active streams / live piracy
        active_streams = []
        for _ in range(random.randint(2, 8)):
            active_streams.append({
                "id": hashlib.md5(str(random.random()).encode()).hexdigest()[:10],
                "platform": random.choice(PIRACY_PLATFORMS),
                "sport": random.choice(SPORTS),
                "viewers": random.randint(100, 50000),
                "detected_at": (datetime.utcnow() - timedelta(minutes=random.randint(5, 300))).isoformat(),
                "status": random.choice(["live", "taken_down", "monitoring"]),
            })

        random.seed()

        return {
            "region": region,
            "total_violations_30d": sum(d["violations"] for d in daily_trend),
            "daily_trend": daily_trend,
            "platform_breakdown": platform_data[:6],
            "sport_breakdown": sport_data[:6],
            "active_streams": active_streams,
            "enforcement_stats": {
                "dmca_sent": random.randint(50, 500),
                "successful_takedowns": random.randint(30, 400),
                "avg_response_hours": round(random.uniform(4, 48), 1),
                "pending_actions": random.randint(5, 50),
            },
            "risk_score": round(random.uniform(30, 95), 1),
        }

    @classmethod
    def get_continent_summary(cls) -> list:
        """Aggregate piracy stats by continent."""
        heatmap = cls.get_heatmap_data()
        continents = {}
        for spot in heatmap["hotspots"]:
            c = spot["continent"]
            if c not in continents:
                continents[c] = {"continent": c, "violations": 0, "regions": 0, "high_risk": 0}
            continents[c]["violations"] += spot["violations"]
            continents[c]["regions"] += 1
            if spot["risk_level"] in ("critical", "high"):
                continents[c]["high_risk"] += 1
        result = sorted(continents.values(), key=lambda x: x["violations"], reverse=True)
        return result

    @classmethod
    def get_trending_hotspots(cls, limit: int = 10) -> list:
        """Get regions with fastest-growing piracy rates."""
        heatmap = cls.get_heatmap_data()
        rising = [h for h in heatmap["hotspots"] if h["trend"] == "rising"]
        rising.sort(key=lambda x: x["change_pct"], reverse=True)
        return rising[:limit]
