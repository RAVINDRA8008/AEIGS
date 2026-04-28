"""Routes for Video Intelligence — analysis, scene detection, clip matching."""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from PIL import Image
from pydantic import BaseModel
import io
import logging

from app.services.video_intelligence import VideoIntelligenceService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/analyze")
async def analyze_video(file: UploadFile = File(...)):
    """Analyze an uploaded video/GIF for scenes, highlights, and fingerprints."""
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image/video file")

    result = VideoIntelligenceService.analyze_video_comprehensive(image)
    result["filename"] = file.filename
    result["file_size"] = len(contents)
    return result


@router.post("/match-clip")
async def match_clip(
    clip: UploadFile = File(...),
    video: UploadFile = File(...),
):
    """Find where a clip appears inside a longer video."""
    clip_data = await clip.read()
    video_data = await video.read()

    try:
        clip_img = Image.open(io.BytesIO(clip_data))
        video_img = Image.open(io.BytesIO(video_data))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file format")

    clip_frames = VideoIntelligenceService.extract_frames_from_gif(clip_img, max_frames=10)
    video_frames = VideoIntelligenceService.extract_frames_from_gif(video_img, max_frames=50)

    result = VideoIntelligenceService.match_clip_in_video(clip_frames, video_frames)
    result["clip_name"] = clip.filename
    result["video_name"] = video.filename
    return result


class DemoAnalysisRequest(BaseModel):
    name: str


@router.post("/demo-analysis")
async def demo_analysis(request: DemoAnalysisRequest):
    """Generate demo video analysis results for any asset name."""
    return VideoIntelligenceService.generate_video_demo_analysis(request.name)


@router.post("/extract-frames")
async def extract_frames(
    file: UploadFile = File(...),
    max_frames: int = Query(20, ge=1, le=100),
):
    """Extract and fingerprint frames from a video/GIF."""
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file")

    frames = VideoIntelligenceService.extract_frames_from_gif(image, max_frames)
    fingerprints = []
    for f in frames:
        fp = VideoIntelligenceService.compute_frame_fingerprint(f["image"])
        fingerprints.append({
            "frame_index": f["frame_index"],
            "timestamp_ms": f["timestamp_ms"],
            **{k: v for k, v in fp.items() if k != "color_histogram"},
        })

    return {
        "total_frames": len(fingerprints),
        "fingerprints": fingerprints,
    }
