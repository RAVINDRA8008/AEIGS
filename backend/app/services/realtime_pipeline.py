"""
Real-Time Detection Pipeline — Server-Sent Events (SSE)

Provides a streaming event pipeline that simulates and handles:
  - Upload → fingerprint → match → alert flow in real-time
  - Live detection events pushed to frontend via SSE
  - Pipeline stage progression with timing metrics
  - Concurrent scan monitoring
"""

import asyncio
import json
import time
import uuid
import random
import hashlib
from datetime import datetime
from typing import AsyncGenerator
import logging

logger = logging.getLogger(__name__)


class PipelineEvent:
    """Represents a single event in the detection pipeline."""

    def __init__(
        self,
        event_type: str,
        stage: str,
        data: dict,
        asset_id: int | None = None,
        pipeline_id: str | None = None,
    ):
        self.id = uuid.uuid4().hex[:12]
        self.pipeline_id = pipeline_id or uuid.uuid4().hex[:16]
        self.event_type = event_type
        self.stage = stage
        self.data = data
        self.asset_id = asset_id
        self.timestamp = datetime.utcnow().isoformat()

    def to_sse(self) -> str:
        payload = {
            "id": self.id,
            "pipeline_id": self.pipeline_id,
            "type": self.event_type,
            "stage": self.stage,
            "asset_id": self.asset_id,
            "data": self.data,
            "timestamp": self.timestamp,
        }
        return f"data: {json.dumps(payload)}\n\n"


# Global event bus for broadcasting to all connected SSE clients
_event_subscribers: list[asyncio.Queue] = []


async def subscribe() -> asyncio.Queue:
    """Subscribe to the global event bus."""
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)
    _event_subscribers.append(queue)
    return queue


def unsubscribe(queue: asyncio.Queue):
    """Unsubscribe from the event bus."""
    if queue in _event_subscribers:
        _event_subscribers.remove(queue)


async def broadcast(event: PipelineEvent):
    """Broadcast an event to all connected clients."""
    dead = []
    for q in _event_subscribers:
        try:
            q.put_nowait(event)
        except asyncio.QueueFull:
            dead.append(q)
    for q in dead:
        _event_subscribers.remove(q)


async def event_stream(queue: asyncio.Queue) -> AsyncGenerator[str, None]:
    """Generate SSE stream from a subscriber queue."""
    try:
        # Send heartbeat immediately
        yield f"data: {json.dumps({'type': 'connected', 'timestamp': datetime.utcnow().isoformat()})}\n\n"

        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=15.0)
                yield event.to_sse()
            except asyncio.TimeoutError:
                # Send keepalive
                yield f": keepalive {datetime.utcnow().isoformat()}\n\n"
    except asyncio.CancelledError:
        pass


PIPELINE_STAGES = [
    ("ingestion", "Receiving content"),
    ("preprocessing", "Normalizing image"),
    ("hash_generation", "Generating perceptual hashes"),
    ("embedding_generation", "Computing feature embeddings"),
    ("vector_search", "Searching fingerprint database"),
    ("hash_comparison", "Comparing hash signatures"),
    ("similarity_scoring", "Computing similarity scores"),
    ("watermark_check", "Checking for Digital DNA watermark"),
    ("risk_assessment", "Calculating risk score"),
    ("match_decision", "Determining match status"),
    ("alert_generation", "Generating alerts"),
]


class RealTimePipeline:
    """Manages the real-time detection pipeline."""

    @classmethod
    async def run_detection_pipeline(
        cls,
        asset_name: str,
        asset_id: int | None = None,
        file_size: int = 0,
        simulate: bool = False,
    ) -> dict:
        """Run a full detection pipeline, broadcasting events at each stage."""

        pipeline_id = uuid.uuid4().hex[:16]
        start_time = time.time()
        results = {"pipeline_id": pipeline_id, "stages": [], "matches": []}

        # Start event
        await broadcast(PipelineEvent(
            event_type="pipeline_start",
            stage="initialization",
            data={
                "asset_name": asset_name,
                "file_size": file_size,
                "total_stages": len(PIPELINE_STAGES),
            },
            asset_id=asset_id,
            pipeline_id=pipeline_id,
        ))

        for idx, (stage_key, stage_label) in enumerate(PIPELINE_STAGES):
            stage_start = time.time()

            # Broadcast stage start
            await broadcast(PipelineEvent(
                event_type="stage_start",
                stage=stage_key,
                data={
                    "label": stage_label,
                    "progress": round((idx / len(PIPELINE_STAGES)) * 100),
                    "stage_number": idx + 1,
                    "total_stages": len(PIPELINE_STAGES),
                },
                asset_id=asset_id,
                pipeline_id=pipeline_id,
            ))

            # Simulate processing time (varied by stage)
            if simulate:
                delay = cls._stage_delay(stage_key)
                await asyncio.sleep(delay)

            stage_duration = round((time.time() - stage_start) * 1000, 1)

            # Generate stage-specific data
            stage_data = cls._stage_result(stage_key, asset_name, pipeline_id)
            stage_data["duration_ms"] = stage_duration
            stage_data["label"] = stage_label

            # Broadcast stage complete
            await broadcast(PipelineEvent(
                event_type="stage_complete",
                stage=stage_key,
                data=stage_data,
                asset_id=asset_id,
                pipeline_id=pipeline_id,
            ))

            results["stages"].append({
                "stage": stage_key,
                "label": stage_label,
                "duration_ms": stage_duration,
                "data": stage_data,
            })

            # If match found at match_decision, broadcast alert
            if stage_key == "match_decision" and stage_data.get("match_found"):
                results["matches"] = stage_data.get("matches", [])

        total_duration = round((time.time() - start_time) * 1000, 1)

        # Pipeline complete
        await broadcast(PipelineEvent(
            event_type="pipeline_complete",
            stage="done",
            data={
                "total_duration_ms": total_duration,
                "stages_completed": len(PIPELINE_STAGES),
                "matches_found": len(results["matches"]),
                "asset_name": asset_name,
            },
            asset_id=asset_id,
            pipeline_id=pipeline_id,
        ))

        results["total_duration_ms"] = total_duration
        return results

    @staticmethod
    def _stage_delay(stage: str) -> float:
        """Return simulated processing delay for a stage."""
        delays = {
            "ingestion": 0.2,
            "preprocessing": 0.3,
            "hash_generation": 0.4,
            "embedding_generation": 0.6,
            "vector_search": 0.5,
            "hash_comparison": 0.3,
            "similarity_scoring": 0.2,
            "watermark_check": 0.4,
            "risk_assessment": 0.3,
            "match_decision": 0.2,
            "alert_generation": 0.1,
        }
        base = delays.get(stage, 0.2)
        return base + random.uniform(0, 0.15)

    @staticmethod
    def _stage_result(stage: str, asset_name: str, pipeline_id: str) -> dict:
        """Generate realistic result data for a pipeline stage."""
        seed = int(hashlib.md5(f"{asset_name}:{pipeline_id}".encode()).hexdigest(), 16)
        rng = random.Random(seed)

        if stage == "hash_generation":
            return {
                "hashes": {
                    "phash": hashlib.md5(f"p:{asset_name}".encode()).hexdigest()[:16],
                    "ahash": hashlib.md5(f"a:{asset_name}".encode()).hexdigest()[:16],
                    "dhash": hashlib.md5(f"d:{asset_name}".encode()).hexdigest()[:16],
                    "whash": hashlib.md5(f"w:{asset_name}".encode()).hexdigest()[:16],
                },
            }
        elif stage == "embedding_generation":
            return {"embedding_dimensions": 356, "norm": round(rng.uniform(0.95, 1.05), 4)}
        elif stage == "vector_search":
            candidates = rng.randint(0, 8)
            return {"candidates_found": candidates, "search_space": rng.randint(50, 5000)}
        elif stage == "similarity_scoring":
            return {
                "max_similarity": round(rng.uniform(0.3, 0.98), 4),
                "avg_similarity": round(rng.uniform(0.1, 0.6), 4),
                "candidates_scored": rng.randint(0, 8),
            }
        elif stage == "watermark_check":
            return {
                "watermark_detected": rng.random() > 0.6,
                "method": "dual_layer_lsb_dct",
            }
        elif stage == "risk_assessment":
            score = round(rng.uniform(20, 95), 1)
            return {
                "risk_score": score,
                "risk_level": (
                    "critical" if score >= 75
                    else "high" if score >= 50
                    else "medium" if score >= 25
                    else "low"
                ),
            }
        elif stage == "match_decision":
            # Simulate finding a match ~60% of the time for demos
            match_found = rng.random() > 0.4
            matches = []
            if match_found:
                platforms = ["youtube", "tiktok", "instagram", "twitter"]
                p = rng.choice(platforms)
                matches.append({
                    "platform": p,
                    "similarity": round(rng.uniform(0.75, 0.99), 4),
                    "url": f"https://{p}.com/content/{rng.randint(10000, 99999)}",
                    "risk_level": rng.choice(["critical", "high", "medium"]),
                })
            return {"match_found": match_found, "matches": matches}
        elif stage == "alert_generation":
            return {"alerts_sent": rng.randint(0, 3), "channels": ["dashboard", "sse"]}

        return {}


class LiveLeakSimulation:
    """Generate a live leak demonstration that unfolds in real-time."""

    @classmethod
    async def run_simulation(cls, asset_name: str) -> dict:
        """Simulate a leak unfolding across platforms in real-time."""
        pipeline_id = uuid.uuid4().hex[:16]
        seed = int(hashlib.md5(asset_name.encode()).hexdigest(), 16) % 10000
        rng = random.Random(seed)

        platforms_timeline = [
            ("telegram", "Shared in private channel", 0),
            ("twitter", "Posted by anonymous account", 8),
            ("reddit", "Crossposted to subreddit", 15),
            ("tiktok", "Re-uploaded as short clip", 25),
            ("youtube", "Full content re-uploaded", 40),
            ("instagram", "Screenshots shared in stories", 55),
        ]

        selected = rng.sample(platforms_timeline, k=rng.randint(3, 5))
        selected.sort(key=lambda x: x[2])

        # Phase 1: Initial leak
        await broadcast(PipelineEvent(
            event_type="leak_simulation",
            stage="leak_detected",
            data={
                "phase": "initial_leak",
                "asset_name": asset_name,
                "message": f"⚠️ LEAK DETECTED: '{asset_name}' found on {selected[0][0]}",
                "platform": selected[0][0],
                "detail": selected[0][1],
                "reach": rng.randint(50, 500),
                "total_phases": len(selected),
                "current_phase": 1,
            },
            pipeline_id=pipeline_id,
        ))

        await asyncio.sleep(2)

        # Phase 2+: Spreading
        total_reach = rng.randint(50, 500)
        for idx, (platform, detail, _) in enumerate(selected[1:], 2):
            reach_increase = rng.randint(1000, 100000)
            total_reach += reach_increase

            await broadcast(PipelineEvent(
                event_type="leak_simulation",
                stage="spreading",
                data={
                    "phase": "spreading",
                    "asset_name": asset_name,
                    "message": f"📡 Spread to {platform}: {detail}",
                    "platform": platform,
                    "detail": detail,
                    "reach_increase": reach_increase,
                    "total_reach": total_reach,
                    "velocity": round(total_reach / (idx * 10), 1),
                    "total_phases": len(selected),
                    "current_phase": idx,
                },
                pipeline_id=pipeline_id,
            ))

            await asyncio.sleep(1.5)

        # Phase: Source identified
        source = rng.choice([
            "Media Partner (Alpha Corp) — watermark UID: a3f7",
            "Contractor (John D.) — watermark UID: 8bc2",
            "Press Early Access (TechBlog) — watermark UID: f190",
        ])

        await broadcast(PipelineEvent(
            event_type="leak_simulation",
            stage="source_identified",
            data={
                "phase": "source_identified",
                "asset_name": asset_name,
                "message": f"🎯 SOURCE IDENTIFIED: {source}",
                "source": source,
                "confidence": round(rng.uniform(0.85, 0.99), 2),
                "method": "dual_layer_watermark_trace",
                "total_reach": total_reach,
            },
            pipeline_id=pipeline_id,
        ))

        await asyncio.sleep(1)

        # Phase: Enforcement
        await broadcast(PipelineEvent(
            event_type="leak_simulation",
            stage="enforcement_initiated",
            data={
                "phase": "enforcement",
                "asset_name": asset_name,
                "message": "🛡️ Automated DMCA takedowns dispatched",
                "takedowns_sent": len(selected),
                "platforms": [s[0] for s in selected],
                "total_reach": total_reach,
                "revenue_at_risk": round(total_reach * rng.uniform(0.005, 0.02), 2),
            },
            pipeline_id=pipeline_id,
        ))

        return {
            "simulation_complete": True,
            "pipeline_id": pipeline_id,
            "platforms_affected": len(selected),
            "total_reach": total_reach,
            "source_identified": True,
        }
