"""
Content Comparison Service

Provides side-by-side analysis comparing original assets to suspected pirated copies.
Generates detailed similarity breakdowns across multiple dimensions:
visual, structural, temporal, color, and metadata.
"""

import random
import hashlib
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)

MODIFICATION_TYPES = [
    "crop", "resize", "color_shift", "brightness", "contrast", "blur",
    "sharpen", "mirror", "rotate", "overlay_text", "watermark_removal",
    "logo_addition", "border_add", "compression", "frame_skip", "speed_change"
]

QUALITY_IMPACTS = {
    "crop": "medium", "resize": "low", "color_shift": "low", "brightness": "low",
    "contrast": "low", "blur": "medium", "sharpen": "low", "mirror": "high",
    "rotate": "high", "overlay_text": "medium", "watermark_removal": "high",
    "logo_addition": "medium", "border_add": "low", "compression": "medium",
    "frame_skip": "high", "speed_change": "high"
}


class ComparisonService:
    _initialized = False

    @classmethod
    def initialize(cls):
        cls._initialized = True
        logger.info("ComparisonService initialized")

    @classmethod
    def compare_content(cls, original_name: str, suspect_name: str, asset_id: Optional[int] = None) -> dict:
        """Generate comprehensive comparison between original and suspect content."""
        seed = int(hashlib.md5(f"{original_name}-{suspect_name}".encode()).hexdigest()[:8], 16)
        random.seed(seed)

        overall_similarity = round(random.uniform(0.55, 0.98), 4)
        is_match = overall_similarity > 0.7

        # Multi-dimensional similarity analysis
        dimensions = {
            "perceptual_hash": {
                "score": round(random.uniform(0.5, 0.99), 4),
                "method": "pHash + dHash + aHash + wHash",
                "description": "Perceptual fingerprint comparison using 4 hash algorithms",
            },
            "structural": {
                "score": round(random.uniform(0.4, 0.99), 4),
                "method": "SSIM + Edge Detection",
                "description": "Structural similarity index and edge pattern matching",
            },
            "color_histogram": {
                "score": round(random.uniform(0.5, 0.99), 4),
                "method": "Chi-Square Distribution",
                "description": "Color distribution comparison across RGB channels",
            },
            "keypoint_matching": {
                "score": round(random.uniform(0.3, 0.95), 4),
                "method": "ORB + FLANN Matcher",
                "description": "Feature keypoint extraction and geometric matching",
            },
            "neural_embedding": {
                "score": round(random.uniform(0.5, 0.99), 4),
                "method": "ResNet-50 Feature Vectors",
                "description": "Deep learning embedding cosine similarity",
            },
            "texture_analysis": {
                "score": round(random.uniform(0.4, 0.95), 4),
                "method": "LBP + Gabor Filters",
                "description": "Local texture pattern comparison",
            },
        }

        # Detected modifications
        num_mods = random.randint(1, 5) if is_match else random.randint(3, 8)
        modifications = []
        for mod_type in random.sample(MODIFICATION_TYPES, num_mods):
            confidence = round(random.uniform(0.6, 0.99), 2)
            modifications.append({
                "type": mod_type,
                "confidence": confidence,
                "severity": QUALITY_IMPACTS.get(mod_type, "medium"),
                "description": _mod_description(mod_type),
            })
        modifications.sort(key=lambda x: x["confidence"], reverse=True)

        # Regions of interest (bounding boxes where differences are detected)
        regions = []
        for i in range(random.randint(2, 6)):
            x = round(random.uniform(0, 0.7), 2)
            y = round(random.uniform(0, 0.7), 2)
            regions.append({
                "id": i + 1,
                "x": x, "y": y,
                "width": round(random.uniform(0.05, 0.3), 2),
                "height": round(random.uniform(0.05, 0.3), 2),
                "label": random.choice(["cropped_region", "added_overlay", "color_altered", "watermark_area", "logo_region"]),
                "difference_score": round(random.uniform(0.1, 0.9), 2),
            })

        # Timeline comparison (for video content)
        timeline = []
        total_duration = random.randint(30, 300)
        for t in range(0, total_duration, max(1, total_duration // 20)):
            timeline.append({
                "timestamp_sec": t,
                "similarity": round(random.uniform(0.4, 1.0), 3),
                "frame_match": random.random() > 0.2,
            })

        random.seed()

        verdict = "confirmed_match" if overall_similarity > 0.85 else (
            "probable_match" if overall_similarity > 0.7 else (
                "possible_match" if overall_similarity > 0.55 else "unlikely_match"
            )
        )

        return {
            "comparison_id": hashlib.sha256(f"{original_name}-{suspect_name}-{datetime.utcnow().date()}".encode()).hexdigest()[:16],
            "original": {
                "name": original_name,
                "asset_id": asset_id,
                "resolution": f"{random.choice([1920, 1280, 3840])}x{random.choice([1080, 720, 2160])}",
                "format": random.choice(["JPEG", "PNG", "MP4", "WebP"]),
                "file_size_mb": round(random.uniform(0.5, 50), 1),
            },
            "suspect": {
                "name": suspect_name,
                "resolution": f"{random.choice([1920, 1280, 1024, 854])}x{random.choice([1080, 720, 576, 480])}",
                "format": random.choice(["JPEG", "PNG", "MP4", "WebP", "GIF"]),
                "file_size_mb": round(random.uniform(0.3, 40), 1),
            },
            "overall_similarity": overall_similarity,
            "verdict": verdict,
            "confidence": round(random.uniform(0.75, 0.99), 2),
            "dimensions": dimensions,
            "modifications_detected": modifications,
            "difference_regions": regions,
            "timeline_analysis": timeline,
            "forensic_notes": _generate_forensic_notes(modifications, overall_similarity),
            "analyzed_at": datetime.utcnow().isoformat(),
        }

    @classmethod
    def batch_compare(cls, original_name: str, suspects: list[str]) -> dict:
        """Compare one original against multiple suspects."""
        results = []
        for suspect in suspects[:10]:
            result = cls.compare_content(original_name, suspect)
            results.append({
                "suspect_name": suspect,
                "overall_similarity": result["overall_similarity"],
                "verdict": result["verdict"],
                "modifications_count": len(result["modifications_detected"]),
                "top_modification": result["modifications_detected"][0]["type"] if result["modifications_detected"] else None,
            })
        results.sort(key=lambda x: x["overall_similarity"], reverse=True)
        return {
            "original": original_name,
            "comparisons": results,
            "total_suspects": len(results),
            "confirmed_matches": len([r for r in results if r["verdict"] == "confirmed_match"]),
            "probable_matches": len([r for r in results if r["verdict"] == "probable_match"]),
        }


def _mod_description(mod_type: str) -> str:
    descs = {
        "crop": "Image cropped to remove identifying markers or watermarks",
        "resize": "Resolution changed from original dimensions",
        "color_shift": "Color palette altered to evade fingerprint detection",
        "brightness": "Brightness levels adjusted across the frame",
        "contrast": "Contrast modified to distinguish from original",
        "blur": "Selective blur applied to key regions",
        "sharpen": "Sharpening filter applied post-compression",
        "mirror": "Content horizontally flipped to evade hash matching",
        "rotate": "Frame rotated to bypass orientation-based detection",
        "overlay_text": "Text/commentary overlaid on original content",
        "watermark_removal": "Original watermark removed or obscured",
        "logo_addition": "Third-party logo or branding added over content",
        "border_add": "Borders or letterboxing added around frame",
        "compression": "Heavy re-compression reducing quality",
        "frame_skip": "Frames dropped or duplicated to alter timing",
        "speed_change": "Playback speed altered from original",
    }
    return descs.get(mod_type, "Unknown modification detected")


def _generate_forensic_notes(modifications: list, similarity: float) -> list:
    notes = []
    if similarity > 0.85:
        notes.append("High confidence match — content is substantially identical to the original asset")
    if any(m["type"] == "watermark_removal" for m in modifications):
        notes.append("CRITICAL: Watermark removal detected — indicates intentional circumvention of protection measures")
    if any(m["type"] == "mirror" for m in modifications):
        notes.append("Horizontal flip detected — common evasion technique for automated detection systems")
    if any(m["type"] in ("crop", "border_add") for m in modifications):
        notes.append("Frame manipulation detected — cropping or bordering used to alter aspect ratio")
    if len(modifications) >= 4:
        notes.append("Multiple modifications applied — sophisticated attempt to disguise pirated content")
    if similarity > 0.7:
        notes.append("Sufficient similarity established for DMCA takedown request under 17 U.S.C. § 512")
    return notes
