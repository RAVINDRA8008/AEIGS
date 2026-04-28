from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# --- Asset Schemas ---
class AssetCreate(BaseModel):
    name: str
    description: str = ""
    organization: str = "Default Org"


class AssetResponse(BaseModel):
    id: int
    name: str
    description: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    phash: Optional[str] = None
    ahash: Optional[str] = None
    dhash: Optional[str] = None
    whash: Optional[str] = None
    vision_labels: str = "[]"
    gemini_description: str = ""
    organization: str
    uploaded_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class AssetListResponse(BaseModel):
    total: int
    assets: list[AssetResponse]


# --- Match Schemas ---
class MatchResponse(BaseModel):
    id: int
    asset_id: int
    asset_name: str
    source_url: str
    matched_file_path: str
    similarity_score: float
    hash_similarity: float
    embedding_similarity: float
    match_type: str
    status: str
    platform: str
    detected_at: datetime
    details: str
    thumbnail_path: str

    class Config:
        from_attributes = True


class MatchListResponse(BaseModel):
    total: int
    matches: list[MatchResponse]


class MatchUpdateStatus(BaseModel):
    status: str


# --- Scan Schemas ---
class ScanURLRequest(BaseModel):
    url: str


class ScanResult(BaseModel):
    matched: bool
    asset_id: Optional[int] = None
    asset_name: Optional[str] = None
    similarity_score: float = 0.0
    hash_similarity: float = 0.0
    embedding_similarity: float = 0.0
    match_type: str = "none"
    details: dict = {}


class ScanResponse(BaseModel):
    scan_id: int
    results: list[ScanResult]
    total_matches: int


# --- Dashboard Schemas ---
class DashboardStats(BaseModel):
    total_assets: int
    total_matches: int
    total_scans: int
    pending_violations: int
    confirmed_violations: int
    protection_rate: float
    recent_matches: list[MatchResponse]
    matches_by_day: list[dict]
    matches_by_type: list[dict]


# --- Google AI Schemas ---
class GeminiAnalysisRequest(BaseModel):
    asset_id: int
    query: str = "Describe this sports media content in detail"


class GeminiAnalysisResponse(BaseModel):
    asset_id: int
    description: str
    labels: list[str]
    is_sports_content: bool
    content_type: str


# --- Watermark Schemas ---
class WatermarkEmbedRequest(BaseModel):
    recipient: str = ""
    purpose: str = ""


class WatermarkResponse(BaseModel):
    id: int
    asset_id: int
    watermark_uid: str
    recipient: str
    purpose: str
    embedded_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class WatermarkVerifyResponse(BaseModel):
    watermark_detected: bool
    watermark_uid: Optional[str] = None
    asset_id: Optional[int] = None
    asset_name: Optional[str] = None
    recipient: Optional[str] = None
    confidence: float = 0.0


# --- Risk Scoring Schemas ---
class RiskScoreResponse(BaseModel):
    match_id: int
    overall_score: float
    risk_level: str
    factors: dict
    recommendations: list[str]


# --- Enforcement Schemas ---
class EnforcementCreateRequest(BaseModel):
    match_id: int
    action_type: str = "dmca"
    priority: str = "medium"


class EnforcementResponse(BaseModel):
    id: int
    match_id: int
    asset_id: int
    action_type: str
    platform: str
    target_url: str
    status: str
    generated_at: datetime
    sent_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    notice_content: str
    priority: str

    class Config:
        from_attributes = True


class EnforcementUpdateRequest(BaseModel):
    status: Optional[str] = None
    response_notes: Optional[str] = None


# --- Propagation Schemas ---
class PropagationNodeResponse(BaseModel):
    id: int
    asset_id: int
    match_id: Optional[int] = None
    platform: str
    url: str
    detected_at: datetime
    spread_velocity: float
    reach_estimate: int
    parent_node_id: Optional[int] = None
    status: str

    class Config:
        from_attributes = True


class PropagationTreeResponse(BaseModel):
    asset_id: int
    asset_name: str
    total_nodes: int
    platforms_affected: list[str]
    total_reach: int
    nodes: list[PropagationNodeResponse]


# --- Rights Zone Schemas ---
class RightsZoneCreateRequest(BaseModel):
    asset_id: int
    region: str
    license_type: str = "exclusive"
    licensee: str = ""
    platforms_allowed: list[str] = []
    max_uses: Optional[int] = None
    notes: str = ""


class RightsZoneResponse(BaseModel):
    id: int
    asset_id: int
    region: str
    license_type: str
    licensee: str
    valid_from: datetime
    valid_until: Optional[datetime] = None
    platforms_allowed: str
    max_uses: Optional[int] = None
    is_active: bool
    notes: str

    class Config:
        from_attributes = True
