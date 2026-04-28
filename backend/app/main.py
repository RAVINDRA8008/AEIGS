from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
import logging
import time

from app.config import settings
from app.database import engine, Base, apply_sqlite_compat_migrations
from app.routes import assets, scan, dashboard, reports, watermark, enforcement, propagation, rights, risk
from app.routes import realtime, video, prediction, evidence, platform
from app.routes import revenue, discovery, geo, comparison, dmca
from app.routes import identity, ai_explain, licensing, compliance
from app.services.fingerprint import FingerprintService
from app.services.google_ai import GoogleAIService
from app.services.evidence_chain import EvidenceChainService
from app.services.content_discovery import ContentDiscoveryService
from app.services.geo_analytics import GeoAnalyticsService
from app.services.comparison import ComparisonService
from app.services.dmca_report import DMCAReportService
from app.services.identity_graph import IdentityGraphService
from app.services.ai_narration import AINarrationService
from app.services.licensing import LicensingService
from app.services.compliance import ComplianceService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    apply_sqlite_compat_migrations()
    # Create upload directories
    for subdir in ["originals", "scans", "thumbnails", "reports"]:
        os.makedirs(os.path.join(settings.UPLOAD_DIR, subdir), exist_ok=True)
    os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
    # Initialize services
    FingerprintService.initialize()
    GoogleAIService.initialize()
    EvidenceChainService.initialize()
    ContentDiscoveryService.initialize()
    GeoAnalyticsService.initialize()
    ComparisonService.initialize()
    DMCAReportService.initialize()
    IdentityGraphService.initialize()
    AINarrationService.initialize()
    LicensingService.initialize()
    ComplianceService.initialize()
    logger.info("AEGIS services initialized")
    yield
    logger.info("AEGIS shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    description="Protecting the Integrity of Digital Sports Media — AEGIS Digital Asset Protection Platform",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    response.headers["X-Process-Time"] = f"{duration:.3f}s"
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


# Serve uploaded files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(assets.router, prefix="/api/assets", tags=["Assets"])
app.include_router(scan.router, prefix="/api/scan", tags=["Scan"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(watermark.router, prefix="/api/watermark", tags=["Digital DNA"])
app.include_router(enforcement.router, prefix="/api/enforcement", tags=["Enforcement"])
app.include_router(propagation.router, prefix="/api/propagation", tags=["Propagation"])
app.include_router(rights.router, prefix="/api/rights", tags=["Rights"])
app.include_router(risk.router, prefix="/api/risk", tags=["Risk Intelligence"])
app.include_router(realtime.router, prefix="/api/realtime", tags=["Real-Time Pipeline"])
app.include_router(video.router, prefix="/api/video", tags=["Video Intelligence"])
app.include_router(prediction.router, prefix="/api/prediction", tags=["Leak Prediction"])
app.include_router(evidence.router, prefix="/api/evidence", tags=["Evidence Chain"])
app.include_router(platform.router, prefix="/api/platform", tags=["Platform Integration"])
app.include_router(revenue.router, prefix="/api/revenue", tags=["Revenue Impact"])
app.include_router(discovery.router, prefix="/api/discovery", tags=["Content Discovery"])
app.include_router(geo.router, prefix="/api/geo", tags=["Geographic Analytics"])
app.include_router(comparison.router, prefix="/api/comparison", tags=["Content Comparison"])
app.include_router(dmca.router, prefix="/api/dmca", tags=["DMCA Reports"])
app.include_router(identity.router, prefix="/api/identity", tags=["Identity Graph"])
app.include_router(ai_explain.router, prefix="/api/ai", tags=["AI Intelligence"])
app.include_router(licensing.router, prefix="/api/licensing", tags=["Licensing & Recovery"])
app.include_router(compliance.router, prefix="/api/compliance", tags=["Compliance & Audit"])


@app.get("/api/health")
async def health_check():
    chroma_ok = FingerprintService.health_check()
    ai_ok = GoogleAIService._initialized
    discovery_ok = ContentDiscoveryService._initialized
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": "5.0.0",
        "services": {
            "chromadb": "connected" if chroma_ok else "disconnected",
            "google_ai": "active" if ai_ok else "inactive (no API key)",
            "content_discovery": "active" if discovery_ok else "standby",
        },
    }
