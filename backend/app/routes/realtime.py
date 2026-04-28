"""Routes for Real-Time Detection Pipeline (SSE) and Live Leak Simulation."""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import logging

from app.services.realtime_pipeline import (
    RealTimePipeline,
    LiveLeakSimulation,
    subscribe,
    unsubscribe,
    event_stream,
)

logger = logging.getLogger(__name__)
router = APIRouter()


class PipelineRunRequest(BaseModel):
    asset_name: str
    asset_id: int | None = None
    file_size: int = 0


class LeakSimulationRequest(BaseModel):
    asset_name: str


@router.get("/stream")
async def sse_stream():
    """Subscribe to real-time detection events via Server-Sent Events."""
    queue = await subscribe()

    async def generate():
        try:
            async for chunk in event_stream(queue):
                yield chunk
        finally:
            unsubscribe(queue)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/run")
async def run_pipeline(request: PipelineRunRequest):
    """Run a detection pipeline (with simulated stages) and broadcast events."""
    result = await RealTimePipeline.run_detection_pipeline(
        asset_name=request.asset_name,
        asset_id=request.asset_id,
        file_size=request.file_size,
        simulate=True,
    )
    return result


@router.post("/simulate-leak")
async def simulate_leak(request: LeakSimulationRequest):
    """Run a live leak simulation that broadcasts events in real-time."""
    result = await LiveLeakSimulation.run_simulation(request.asset_name)
    return result


@router.get("/stages")
async def get_pipeline_stages():
    """Get list of all pipeline stages."""
    from app.services.realtime_pipeline import PIPELINE_STAGES

    return {
        "total_stages": len(PIPELINE_STAGES),
        "stages": [
            {"key": key, "label": label, "order": idx}
            for idx, (key, label) in enumerate(PIPELINE_STAGES)
        ],
    }
