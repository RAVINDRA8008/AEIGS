"""
Video Intelligence Service — Video-Native Content Protection

Handles:
  - Frame extraction from video files
  - Scene boundary / shot detection
  - Keyframe fingerprinting
  - Clip matching (detect re-used segments inside longer videos)
  - Highlight / key moment detection
  - Video-level similarity scoring

Uses numpy + Pillow for frame analysis (no OpenCV dependency).
For production, this would use ffmpeg + GPU acceleration.
"""

import hashlib
import math
import random
import struct
import io
import numpy as np
from PIL import Image
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class VideoIntelligenceService:
    """Video analysis and clip detection engine."""

    @classmethod
    def extract_frames_from_gif(cls, image: Image.Image, max_frames: int = 30) -> list[dict]:
        """Extract frames from an animated GIF/WebP (our demo-compatible video format)."""
        frames = []
        try:
            n_frames = getattr(image, 'n_frames', 1)
            step = max(1, n_frames // max_frames)

            for i in range(0, n_frames, step):
                image.seek(i)
                frame = image.copy().convert("RGB")
                frame_data = {
                    "frame_index": i,
                    "timestamp_ms": i * 33,  # ~30fps
                    "image": frame,
                    "size": frame.size,
                }
                frames.append(frame_data)

                if len(frames) >= max_frames:
                    break
        except EOFError:
            pass

        return frames

    @classmethod
    def compute_frame_fingerprint(cls, frame: Image.Image) -> dict:
        """Compute a compact fingerprint for a single frame."""
        # Resize to standard size for comparison
        thumb = frame.resize((64, 64), Image.Resampling.LANCZOS)
        arr = np.array(thumb, dtype=np.float64)

        # Color histogram (compact)
        color_hist = []
        for ch in range(3):
            hist, _ = np.histogram(arr[:, :, ch], bins=16, range=(0, 256))
            hist = hist / (hist.sum() + 1e-10)
            color_hist.extend(hist.tolist())

        # Grayscale DCT-like hash
        gray = np.mean(arr, axis=2)
        mean_val = gray.mean()
        hash_bits = (gray > mean_val).flatten()
        hash_hex = "".join(str(int(b)) for b in hash_bits[:64])

        # Edge density
        dx = np.abs(np.diff(gray, axis=1)).mean()
        dy = np.abs(np.diff(gray, axis=0)).mean()
        edge_density = float(dx + dy)

        # Brightness / contrast
        brightness = float(gray.mean())
        contrast = float(gray.std())

        return {
            "color_histogram": color_hist,
            "perceptual_hash": hash_hex,
            "edge_density": round(edge_density, 4),
            "brightness": round(brightness, 2),
            "contrast": round(contrast, 2),
        }

    @classmethod
    def detect_scene_boundaries(cls, frames: list[dict]) -> list[dict]:
        """Detect scene changes between consecutive frames."""
        if len(frames) < 2:
            return []

        scenes = []
        prev_fp = cls.compute_frame_fingerprint(frames[0]["image"])

        for i in range(1, len(frames)):
            curr_fp = cls.compute_frame_fingerprint(frames[i]["image"])

            # Compare color histograms
            prev_hist = np.array(prev_fp["color_histogram"])
            curr_hist = np.array(curr_fp["color_histogram"])
            hist_diff = float(np.sum(np.abs(prev_hist - curr_hist)))

            # Compare brightness/contrast
            bright_diff = abs(curr_fp["brightness"] - prev_fp["brightness"])
            contrast_diff = abs(curr_fp["contrast"] - prev_fp["contrast"])

            # Combined scene change score
            change_score = hist_diff * 0.6 + (bright_diff / 128) * 0.25 + (contrast_diff / 64) * 0.15

            if change_score > 0.35:  # Scene change threshold
                scenes.append({
                    "frame_index": frames[i]["frame_index"],
                    "timestamp_ms": frames[i]["timestamp_ms"],
                    "change_score": round(change_score, 4),
                    "type": "hard_cut" if change_score > 0.7 else "gradual_transition",
                })

            prev_fp = curr_fp

        return scenes

    @classmethod
    def detect_highlights(cls, frames: list[dict]) -> list[dict]:
        """Detect key moments / highlights based on visual activity."""
        if len(frames) < 3:
            return []

        # Compute activity metrics per frame
        activities = []
        for i, frame_data in enumerate(frames):
            fp = cls.compute_frame_fingerprint(frame_data["image"])
            activity = fp["edge_density"] * 0.4 + fp["contrast"] * 0.6
            activities.append({
                "frame_index": frame_data["frame_index"],
                "timestamp_ms": frame_data["timestamp_ms"],
                "activity": activity,
            })

        # Find peaks (local maxima above average)
        avg_activity = np.mean([a["activity"] for a in activities])
        std_activity = np.std([a["activity"] for a in activities])
        threshold = avg_activity + 0.5 * std_activity

        highlights = []
        for i, act in enumerate(activities):
            if act["activity"] > threshold:
                is_peak = True
                if i > 0 and activities[i - 1]["activity"] > act["activity"]:
                    is_peak = False
                if i < len(activities) - 1 and activities[i + 1]["activity"] > act["activity"]:
                    is_peak = False

                if is_peak:
                    highlights.append({
                        "frame_index": act["frame_index"],
                        "timestamp_ms": act["timestamp_ms"],
                        "intensity": round(act["activity"], 4),
                        "type": "high_activity_moment",
                    })

        return highlights[:10]  # Top 10 highlights

    @classmethod
    def match_clip_in_video(
        cls,
        clip_frames: list[dict],
        video_frames: list[dict],
        threshold: float = 0.7,
    ) -> dict:
        """
        Find where a clip appears inside a longer video.
        Sliding window comparison of frame fingerprints.
        """
        if not clip_frames or not video_frames:
            return {"match_found": False, "segments": []}

        # Fingerprint all frames
        clip_fps = [cls.compute_frame_fingerprint(f["image"]) for f in clip_frames]
        video_fps = [cls.compute_frame_fingerprint(f["image"]) for f in video_frames]

        clip_len = len(clip_fps)
        video_len = len(video_fps)

        if clip_len > video_len:
            return {"match_found": False, "segments": []}

        # Sliding window
        segments = []
        for start in range(video_len - clip_len + 1):
            window = video_fps[start : start + clip_len]

            # Compare each pair
            similarities = []
            for c_fp, v_fp in zip(clip_fps, window):
                c_hist = np.array(c_fp["color_histogram"])
                v_hist = np.array(v_fp["color_histogram"])
                sim = 1 - float(np.sum(np.abs(c_hist - v_hist))) / 2
                similarities.append(sim)

            avg_sim = np.mean(similarities)

            if avg_sim >= threshold:
                segments.append({
                    "start_frame": video_frames[start]["frame_index"],
                    "end_frame": video_frames[start + clip_len - 1]["frame_index"],
                    "start_ms": video_frames[start]["timestamp_ms"],
                    "end_ms": video_frames[start + clip_len - 1]["timestamp_ms"],
                    "similarity": round(float(avg_sim), 4),
                    "frame_matches": len([s for s in similarities if s >= threshold]),
                })

        return {
            "match_found": len(segments) > 0,
            "segments": segments,
            "clip_length_frames": clip_len,
            "video_length_frames": video_len,
        }

    @classmethod
    def analyze_video_comprehensive(cls, image: Image.Image) -> dict:
        """Full video analysis pipeline for a single video/GIF."""
        start_time = datetime.utcnow()

        # Extract frames
        frames = cls.extract_frames_from_gif(image)
        if not frames:
            return {"error": "No frames could be extracted"}

        # Detect scenes
        scenes = cls.detect_scene_boundaries(frames)

        # Detect highlights
        highlights = cls.detect_highlights(frames)

        # Fingerprint all frames
        fingerprints = []
        for f in frames:
            fp = cls.compute_frame_fingerprint(f["image"])
            fingerprints.append({
                "frame_index": f["frame_index"],
                "timestamp_ms": f["timestamp_ms"],
                "hash": fp["perceptual_hash"][:16],
                "brightness": fp["brightness"],
                "edge_density": fp["edge_density"],
            })

        # Compute video-level statistics
        brightnesses = [fp["brightness"] for fp in fingerprints]
        edges = [fp["edge_density"] for fp in fingerprints]

        duration = datetime.utcnow() - start_time

        return {
            "total_frames": len(frames),
            "scenes_detected": len(scenes),
            "highlights_detected": len(highlights),
            "scenes": scenes,
            "highlights": highlights,
            "frame_fingerprints": fingerprints,
            "statistics": {
                "avg_brightness": round(float(np.mean(brightnesses)), 2),
                "brightness_variance": round(float(np.std(brightnesses)), 2),
                "avg_edge_density": round(float(np.mean(edges)), 2),
                "visual_complexity": round(float(np.std(edges)), 4),
            },
            "analysis_duration_ms": round(duration.total_seconds() * 1000, 1),
        }

    @classmethod
    def generate_video_demo_analysis(cls, name: str) -> dict:
        """Generate realistic video analysis results for demo purposes."""
        seed = int(hashlib.md5(name.encode()).hexdigest(), 16) % 10000
        rng = random.Random(seed)

        total_frames = rng.randint(150, 3000)
        fps = rng.choice([24, 30, 60])
        duration_sec = total_frames / fps

        # Generate scene boundaries
        num_scenes = rng.randint(3, 15)
        scenes = []
        for i in range(num_scenes):
            frame = rng.randint(1, total_frames - 1)
            scenes.append({
                "frame_index": frame,
                "timestamp_ms": round(frame / fps * 1000),
                "change_score": round(rng.uniform(0.4, 0.95), 4),
                "type": rng.choice(["hard_cut", "gradual_transition"]),
            })
        scenes.sort(key=lambda x: x["frame_index"])

        # Generate highlights
        num_highlights = rng.randint(2, 8)
        highlights = []
        for i in range(num_highlights):
            frame = rng.randint(1, total_frames - 1)
            highlights.append({
                "frame_index": frame,
                "timestamp_ms": round(frame / fps * 1000),
                "intensity": round(rng.uniform(30, 80), 4),
                "type": rng.choice([
                    "high_activity_moment",
                    "dramatic_lighting_change",
                    "fast_motion",
                    "key_visual_event",
                ]),
            })
        highlights.sort(key=lambda x: x["frame_index"])

        # Generate frame fingerprints (sampled)
        sample_count = min(30, total_frames)
        fingerprints = []
        for i in range(sample_count):
            frame = int(i * total_frames / sample_count)
            fingerprints.append({
                "frame_index": frame,
                "timestamp_ms": round(frame / fps * 1000),
                "hash": hashlib.md5(f"{name}:{frame}".encode()).hexdigest()[:16],
                "brightness": round(rng.uniform(40, 200), 2),
                "edge_density": round(rng.uniform(5, 40), 4),
            })

        return {
            "total_frames": total_frames,
            "fps": fps,
            "duration_seconds": round(duration_sec, 1),
            "scenes_detected": len(scenes),
            "highlights_detected": len(highlights),
            "scenes": scenes,
            "highlights": highlights,
            "frame_fingerprints": fingerprints,
            "statistics": {
                "avg_brightness": round(rng.uniform(80, 160), 2),
                "brightness_variance": round(rng.uniform(10, 50), 2),
                "avg_edge_density": round(rng.uniform(10, 30), 2),
                "visual_complexity": round(rng.uniform(2, 15), 4),
            },
            "clip_detection_ready": True,
            "analysis_duration_ms": round(rng.uniform(200, 2000), 1),
        }
