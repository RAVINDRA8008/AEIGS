from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def apply_sqlite_compat_migrations():
    """Apply minimal additive migrations for demo environments using legacy SQLite files."""
    if "sqlite" not in settings.DATABASE_URL:
        return

    migrations = {
        "assets": {
            "vision_labels": "ALTER TABLE assets ADD COLUMN vision_labels TEXT DEFAULT '[]'",
            "gemini_description": "ALTER TABLE assets ADD COLUMN gemini_description TEXT DEFAULT ''",
            "organization": "ALTER TABLE assets ADD COLUMN organization VARCHAR(255) DEFAULT 'Default Org'",
            "watermark_id": "ALTER TABLE assets ADD COLUMN watermark_id VARCHAR(100) DEFAULT ''",
            "watermark_key": "ALTER TABLE assets ADD COLUMN watermark_key VARCHAR(255) DEFAULT ''",
            "risk_score": "ALTER TABLE assets ADD COLUMN risk_score FLOAT DEFAULT 0.0",
            "risk_level": "ALTER TABLE assets ADD COLUMN risk_level VARCHAR(20) DEFAULT 'low'",
        },
        "matches": {
            "hash_similarity": "ALTER TABLE matches ADD COLUMN hash_similarity FLOAT DEFAULT 0.0",
            "embedding_similarity": "ALTER TABLE matches ADD COLUMN embedding_similarity FLOAT DEFAULT 0.0",
            "details": "ALTER TABLE matches ADD COLUMN details TEXT DEFAULT '{}'",
            "thumbnail_path": "ALTER TABLE matches ADD COLUMN thumbnail_path VARCHAR(500) DEFAULT ''",
            "risk_score": "ALTER TABLE matches ADD COLUMN risk_score FLOAT DEFAULT 0.0",
            "risk_level": "ALTER TABLE matches ADD COLUMN risk_level VARCHAR(20) DEFAULT 'low'",
        },
    }

    with engine.begin() as conn:
        for table, columns in migrations.items():
            existing = {
                row[1]
                for row in conn.exec_driver_sql(f"PRAGMA table_info({table})").fetchall()
            }
            for column_name, ddl in columns.items():
                if column_name not in existing:
                    conn.exec_driver_sql(ddl)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
