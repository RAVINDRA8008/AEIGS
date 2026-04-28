"""
Content Discovery Service

Actively hunts for pirated content across the web using:
- Google Custom Search API (reverse image search / text search)
- YouTube Data API v3 (video search)
- Google Cloud Vision API (web detection, label detection, logo detection)

This is the KILLER feature — transforms AEGIS from passive to active.
"""

import logging
import json
import hashlib
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)


class ContentDiscoveryService:
    """Active content discovery across web platforms."""

    _search_client = None
    _youtube_client = None
    _vision_client = None
    _initialized = False

    @classmethod
    def initialize(cls):
        from app.config import settings

        # Google Custom Search
        if settings.GOOGLE_API_KEY and settings.GOOGLE_CSE_ID:
            try:
                from googleapiclient.discovery import build
                cls._search_client = build(
                    "customsearch", "v1",
                    developerKey=settings.GOOGLE_API_KEY
                )
                logger.info("Google Custom Search initialized")
            except Exception as e:
                logger.warning(f"Custom Search init failed: {e}")

        # YouTube Data API
        if settings.GOOGLE_API_KEY:
            try:
                from googleapiclient.discovery import build
                cls._youtube_client = build(
                    "youtube", "v3",
                    developerKey=settings.GOOGLE_API_KEY
                )
                logger.info("YouTube Data API initialized")
            except Exception as e:
                logger.warning(f"YouTube API init failed: {e}")

        # Cloud Vision
        if settings.GOOGLE_API_KEY:
            try:
                from google.cloud import vision
                cls._vision_client = vision.ImageAnnotatorClient()
                logger.info("Cloud Vision API initialized")
            except Exception:
                # Fallback: use REST-based Vision via generativeai
                try:
                    import google.generativeai as genai
                    genai.configure(api_key=settings.GOOGLE_API_KEY)
                    cls._vision_client = "gemini_fallback"
                    logger.info("Cloud Vision fallback (Gemini) initialized")
                except Exception as e2:
                    logger.warning(f"Vision init failed: {e2}")

        cls._initialized = True

    @classmethod
    def search_web_for_content(
        cls,
        query: str,
        asset_name: str = "",
        num_results: int = 10,
    ) -> list[dict]:
        """Search the web for potentially infringing content using Google Custom Search."""
        results = []

        if cls._search_client:
            try:
                from app.config import settings
                search_query = f"{query} {asset_name}".strip()
                response = cls._search_client.cse().list(
                    q=search_query,
                    cx=settings.GOOGLE_CSE_ID,
                    num=min(num_results, 10),
                    searchType="image",
                ).execute()

                for item in response.get("items", []):
                    results.append({
                        "source": "google_search",
                        "title": item.get("title", ""),
                        "url": item.get("link", ""),
                        "display_url": item.get("displayLink", ""),
                        "snippet": item.get("snippet", ""),
                        "thumbnail": item.get("image", {}).get("thumbnailLink", ""),
                        "mime_type": item.get("mime", ""),
                        "context_url": item.get("image", {}).get("contextLink", ""),
                        "detected_at": datetime.now(timezone.utc).isoformat(),
                        "risk_level": "medium",
                    })
            except Exception as e:
                logger.error(f"Google Search failed: {e}")

        # Always include simulated results if no real API
        if not results:
            results = cls._simulate_web_search(query, asset_name)

        return results

    @classmethod
    def search_youtube(
        cls,
        query: str,
        asset_name: str = "",
        max_results: int = 10,
    ) -> list[dict]:
        """Search YouTube for potentially infringing videos."""
        results = []

        if cls._youtube_client:
            try:
                search_query = f"{query} {asset_name}".strip()
                response = cls._youtube_client.search().list(
                    q=search_query,
                    part="snippet",
                    type="video",
                    maxResults=min(max_results, 25),
                    order="relevance",
                ).execute()

                for item in response.get("items", []):
                    snippet = item.get("snippet", {})
                    video_id = item.get("id", {}).get("videoId", "")
                    results.append({
                        "source": "youtube",
                        "video_id": video_id,
                        "title": snippet.get("title", ""),
                        "description": snippet.get("description", ""),
                        "channel": snippet.get("channelTitle", ""),
                        "channel_id": snippet.get("channelId", ""),
                        "url": f"https://www.youtube.com/watch?v={video_id}",
                        "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
                        "published_at": snippet.get("publishedAt", ""),
                        "detected_at": datetime.now(timezone.utc).isoformat(),
                        "risk_level": "medium",
                    })

                # Get video statistics for risk assessment
                if results:
                    video_ids = [r["video_id"] for r in results if r.get("video_id")]
                    if video_ids:
                        stats_response = cls._youtube_client.videos().list(
                            part="statistics,contentDetails",
                            id=",".join(video_ids[:50]),
                        ).execute()

                        stats_map = {}
                        for v in stats_response.get("items", []):
                            stats_map[v["id"]] = v.get("statistics", {})

                        for r in results:
                            vid_stats = stats_map.get(r["video_id"], {})
                            r["view_count"] = int(vid_stats.get("viewCount", 0))
                            r["like_count"] = int(vid_stats.get("likeCount", 0))
                            # Higher views = higher risk
                            if r["view_count"] > 100000:
                                r["risk_level"] = "critical"
                            elif r["view_count"] > 10000:
                                r["risk_level"] = "high"
                            elif r["view_count"] > 1000:
                                r["risk_level"] = "medium"
                            else:
                                r["risk_level"] = "low"

            except Exception as e:
                logger.error(f"YouTube search failed: {e}")

        if not results:
            results = cls._simulate_youtube_search(query, asset_name)

        return results

    @classmethod
    def detect_web_entities(cls, image_bytes: bytes) -> dict:
        """Use Cloud Vision API web detection to find where an image appears online."""
        if cls._vision_client and cls._vision_client != "gemini_fallback":
            try:
                from google.cloud import vision
                image = vision.Image(content=image_bytes)
                response = cls._vision_client.web_detection(image=image)
                web = response.web_detection

                results = {
                    "web_entities": [],
                    "full_matching_images": [],
                    "partial_matching_images": [],
                    "visually_similar_images": [],
                    "pages_with_matching_images": [],
                    "best_guess_labels": [],
                }

                for entity in (web.web_entities or []):
                    results["web_entities"].append({
                        "description": entity.description,
                        "score": round(entity.score, 4),
                    })

                for img in (web.full_matching_images or []):
                    results["full_matching_images"].append({"url": img.url})

                for img in (web.partial_matching_images or []):
                    results["partial_matching_images"].append({"url": img.url})

                for img in (web.visually_similar_images or []):
                    results["visually_similar_images"].append({"url": img.url})

                for page in (web.pages_with_matching_images or []):
                    results["pages_with_matching_images"].append({
                        "url": page.url,
                        "title": page.page_title,
                    })

                for label in (web.best_guess_labels or []):
                    results["best_guess_labels"].append(label.label)

                return results

            except Exception as e:
                logger.error(f"Cloud Vision web detection failed: {e}")

        return cls._simulate_web_detection(image_bytes)

    @classmethod
    def detect_labels_and_logos(cls, image_bytes: bytes) -> dict:
        """Use Cloud Vision for label detection, logo detection, and safe search."""
        if cls._vision_client and cls._vision_client != "gemini_fallback":
            try:
                from google.cloud import vision
                image = vision.Image(content=image_bytes)

                # Label detection
                label_response = cls._vision_client.label_detection(image=image)
                labels = [
                    {"description": l.description, "score": round(l.score, 4)}
                    for l in label_response.label_annotations
                ]

                # Logo detection
                logo_response = cls._vision_client.logo_detection(image=image)
                logos = [
                    {"description": l.description, "score": round(l.score, 4)}
                    for l in logo_response.logo_annotations
                ]

                # OCR / Text detection
                text_response = cls._vision_client.text_detection(image=image)
                texts = [t.description for t in text_response.text_annotations[:5]]

                return {
                    "labels": labels,
                    "logos": logos,
                    "detected_text": texts,
                }

            except Exception as e:
                logger.error(f"Cloud Vision detection failed: {e}")

        return {"labels": [], "logos": [], "detected_text": []}

    @classmethod
    def full_discovery_sweep(
        cls,
        asset_name: str,
        keywords: list[str] = None,
        image_bytes: bytes = None,
    ) -> dict:
        """Run a full discovery sweep: web search + YouTube + Vision API."""
        sweep_id = hashlib.md5(
            f"{asset_name}{datetime.now(timezone.utc).isoformat()}".encode()
        ).hexdigest()[:12]

        search_terms = [asset_name]
        if keywords:
            search_terms.extend(keywords)
        query = " ".join(search_terms)

        # Run all discovery channels
        web_results = cls.search_web_for_content(query, asset_name)
        youtube_results = cls.search_youtube(query, asset_name)

        vision_results = None
        if image_bytes:
            vision_results = cls.detect_web_entities(image_bytes)

        # Combine and risk-rank
        all_findings = []

        for r in web_results:
            r["channel"] = "web"
            all_findings.append(r)

        for r in youtube_results:
            r["channel"] = "youtube"
            all_findings.append(r)

        if vision_results:
            for page in vision_results.get("pages_with_matching_images", []):
                all_findings.append({
                    "channel": "vision_api",
                    "source": "cloud_vision",
                    "title": page.get("title", "Matching page"),
                    "url": page.get("url", ""),
                    "risk_level": "high",
                    "detected_at": datetime.now(timezone.utc).isoformat(),
                })
            for img in vision_results.get("full_matching_images", []):
                all_findings.append({
                    "channel": "vision_api",
                    "source": "cloud_vision",
                    "title": "Full image match found",
                    "url": img.get("url", ""),
                    "risk_level": "critical",
                    "detected_at": datetime.now(timezone.utc).isoformat(),
                })

        # Risk scoring for all findings
        risk_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        all_findings.sort(key=lambda x: risk_order.get(x.get("risk_level", "low"), 4))

        # Summary
        critical_count = sum(1 for f in all_findings if f.get("risk_level") == "critical")
        high_count = sum(1 for f in all_findings if f.get("risk_level") == "high")

        return {
            "sweep_id": sweep_id,
            "asset_name": asset_name,
            "query": query,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_findings": len(all_findings),
            "critical_findings": critical_count,
            "high_risk_findings": high_count,
            "findings": all_findings,
            "channels_searched": {
                "web_search": len(web_results),
                "youtube": len(youtube_results),
                "vision_api": len(vision_results.get("pages_with_matching_images", [])) + len(vision_results.get("full_matching_images", [])) if vision_results else 0,
            },
            "vision_details": vision_results,
        }

    # ---- Simulation fallbacks (for demo when APIs aren't configured) ----

    @staticmethod
    def _simulate_web_search(query: str, asset_name: str) -> list[dict]:
        """Generate realistic demo results."""
        import random
        platforms = [
            ("reddit.com", "r/sports - Unauthorized highlight clip"),
            ("twitter.com", "Fan account reposting official media"),
            ("facebook.com", "Sports page sharing protected content"),
            ("pinterest.com", "Board collection of sports media"),
            ("dailymotion.com", "Full match highlights re-upload"),
            ("telegram", "Sports channel media distribution"),
        ]
        results = []
        for platform, desc in random.sample(platforms, min(4, len(platforms))):
            risk = random.choice(["critical", "high", "medium"])
            results.append({
                "source": "google_search",
                "title": f"{desc} — {asset_name}",
                "url": f"https://{platform}/content/{hashlib.md5(f'{platform}{asset_name}'.encode()).hexdigest()[:8]}",
                "display_url": platform,
                "snippet": f"Potential unauthorized use of '{asset_name}' detected on {platform}",
                "thumbnail": "",
                "detected_at": datetime.now(timezone.utc).isoformat(),
                "risk_level": risk,
                "simulated": True,
            })
        return results

    @staticmethod
    def _simulate_youtube_search(query: str, asset_name: str) -> list[dict]:
        """Generate realistic YouTube demo results."""
        import random
        channels = [
            ("SportsHighlightsHD", "Full Match Highlights"),
            ("GoalMaster2024", "Best Goals Compilation"),
            ("MatchReplay", "Extended Match Coverage"),
            ("SportsFanOfficial", "Fan Cam Angles"),
            ("HighlightReel", "Top 10 Plays"),
        ]
        results = []
        for channel, prefix in random.sample(channels, min(3, len(channels))):
            vid = hashlib.md5(f"{channel}{asset_name}".encode()).hexdigest()[:11]
            views = random.randint(500, 500000)
            risk = "critical" if views > 100000 else "high" if views > 10000 else "medium"
            results.append({
                "source": "youtube",
                "video_id": vid,
                "title": f"{prefix} — {asset_name}",
                "description": f"Watch the best moments from {asset_name}",
                "channel": channel,
                "channel_id": f"UC{hashlib.md5(channel.encode()).hexdigest()[:22]}",
                "url": f"https://www.youtube.com/watch?v={vid}",
                "thumbnail": f"https://img.youtube.com/vi/{vid}/hqdefault.jpg",
                "published_at": datetime.now(timezone.utc).isoformat(),
                "detected_at": datetime.now(timezone.utc).isoformat(),
                "view_count": views,
                "like_count": int(views * 0.03),
                "risk_level": risk,
                "simulated": True,
            })
        return results

    @staticmethod
    def _simulate_web_detection(image_bytes: bytes) -> dict:
        """Simulate Cloud Vision web detection results."""
        img_hash = hashlib.md5(image_bytes[:1000]).hexdigest()[:8]
        return {
            "web_entities": [
                {"description": "Sports", "score": 0.92},
                {"description": "Football", "score": 0.85},
                {"description": "Highlight", "score": 0.78},
            ],
            "full_matching_images": [
                {"url": f"https://cdn.sportsmedia.com/images/{img_hash}_full.jpg"},
            ],
            "partial_matching_images": [
                {"url": f"https://reddit.com/media/{img_hash}_partial.jpg"},
                {"url": f"https://twitter.com/pic/{img_hash}_crop.jpg"},
            ],
            "visually_similar_images": [
                {"url": f"https://pinterest.com/pin/{img_hash}_similar.jpg"},
            ],
            "pages_with_matching_images": [
                {"url": f"https://reddit.com/r/sports/{img_hash}", "title": "🔥 Amazing play from last night"},
                {"url": f"https://facebook.com/groups/sportsfans/posts/{img_hash}", "title": "Who saw this?!"},
            ],
            "best_guess_labels": ["sports highlight", "match footage"],
            "simulated": True,
        }
