from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from datetime import datetime, timezone
from app.database import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50))
    file_size = Column(Integer)
    phash = Column(String(128))
    ahash = Column(String(128))
    dhash = Column(String(128))
    whash = Column(String(128))
    embedding_id = Column(String(100))
    vision_labels = Column(Text, default="[]")
    gemini_description = Column(Text, default="")
    organization = Column(String(255), default="Default Org")
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)
    # Digital DNA
    watermark_id = Column(String(100), default="")
    watermark_key = Column(String(255), default="")
    # Risk
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(20), default="low")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, nullable=False)
    asset_name = Column(String(255), default="")
    source_url = Column(String(1000), default="")
    matched_file_path = Column(String(500), default="")
    similarity_score = Column(Float, default=0.0)
    hash_similarity = Column(Float, default=0.0)
    embedding_similarity = Column(Float, default=0.0)
    match_type = Column(String(50), default="near-duplicate")
    status = Column(String(50), default="pending")
    platform = Column(String(255), default="Unknown")
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    details = Column(Text, default="{}")
    thumbnail_path = Column(String(500), default="")
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(20), default="low")


class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, index=True)
    scan_type = Column(String(50))
    target = Column(String(1000))
    results_count = Column(Integer, default=0)
    scanned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String(50), default="completed")


class Watermark(Base):
    __tablename__ = "watermarks"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    watermark_uid = Column(String(100), unique=True, nullable=False)
    recipient = Column(String(255), default="")
    purpose = Column(String(255), default="")
    embedded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)
    extra_metadata = Column("metadata", Text, default="{}")


class PropagationNode(Base):
    __tablename__ = "propagation_nodes"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=True)
    platform = Column(String(255), nullable=False)
    url = Column(String(1000), default="")
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    spread_velocity = Column(Float, default=0.0)
    reach_estimate = Column(Integer, default=0)
    parent_node_id = Column(Integer, ForeignKey("propagation_nodes.id"), nullable=True)
    status = Column(String(50), default="active")
    extra_metadata = Column("metadata", Text, default="{}")


class EnforcementAction(Base):
    __tablename__ = "enforcement_actions"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    action_type = Column(String(50), nullable=False)  # dmca, cease_desist, platform_report
    platform = Column(String(255), default="")
    target_url = Column(String(1000), default="")
    status = Column(String(50), default="draft")  # draft, sent, acknowledged, complied, escalated
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    sent_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    notice_content = Column(Text, default="")
    evidence_package = Column(Text, default="{}")
    response_notes = Column(Text, default="")
    priority = Column(String(20), default="medium")


class RightsZone(Base):
    __tablename__ = "rights_zones"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    region = Column(String(100), nullable=False)  # ISO country/region code
    license_type = Column(String(100), default="exclusive")  # exclusive, non-exclusive, blocked
    licensee = Column(String(255), default="")
    valid_from = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    valid_until = Column(DateTime, nullable=True)
    platforms_allowed = Column(Text, default="[]")  # JSON list
    max_uses = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, default="")
