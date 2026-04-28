# AEGIS — Digital Asset Protection Platform

> **Advanced Engine for Guarding Intellectual Sports-media**
> 
> Protecting the Integrity of Digital Sports Media

## Problem Statement

Sports organizations generate massive volumes of high-value digital media that rapidly scatter across global platforms. This visibility gap leaves proprietary content highly vulnerable to unauthorized redistribution and intellectual property violations.

**AEGIS** identifies, tracks, and flags unauthorized use of official sports media using multi-layered fingerprinting and Google AI.

## Features

- **Multi-Algorithm Fingerprinting** — Perceptual hashing (pHash, aHash, dHash, wHash) + visual embedding vectors
- **AI-Powered Analysis** — Google Gemini 2.0 Flash for content analysis, comparison, and web presence detection
- **Real-Time Scanning** — Upload any image to instantly check against registered assets
- **Side-by-Side Comparison** — Compare two images with detailed similarity breakdown
- **Violation Dashboard** — Real-time monitoring with charts, filters, and status management
- **Robust Detection** — Catches cropped, resized, color-shifted, compressed, and overlaid copies
- **ChromaDB Vector Search** — Fast similarity search across thousands of registered assets

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   React + Vite  │────▶│   FastAPI        │
│   Tailwind CSS  │     │   Python 3.11    │
│   Recharts      │     │                  │
└─────────────────┘     └────────┬─────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
              ┌─────▼─────┐ ┌───▼───┐  ┌─────▼──────┐
              │  ChromaDB  │ │SQLite │  │ Google AI  │
              │  Vectors   │ │  DB   │  │ Gemini 2.0 │
              └────────────┘ └───────┘  │ Vision AI  │
                                        └────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Lucide Icons |
| Backend | Python 3.11, FastAPI, SQLAlchemy |
| AI/ML | Google Gemini 2.0 Flash, Perceptual Hashing, ChromaDB |
| Database | SQLite (dev), PostgreSQL (prod) |
| Vector DB | ChromaDB (cosine similarity) |
| Deployment | Docker, Google Cloud Run |

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Google AI API Key ([Get one here](https://aistudio.google.com/apikey))

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt

# Create .env file
echo GOOGLE_API_KEY=your-key-here > .env

# Run
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

### Docker (Full Stack)

```bash
# Set your API key
echo GOOGLE_API_KEY=your-key-here > .env

# Build and run
docker compose up --build
```

Visit `http://localhost:3000`

## Google Cloud Deployment

### One-command deployment (Windows PowerShell)

```powershell
# Requires: gcloud auth login + gcloud auth configure-docker
./scripts/deploy_gcp.ps1 \
  -ProjectId "your-gcp-project" \
  -GoogleApiKey "your-gemini-key" \
  -Region "us-central1"
```

This script will:
- Build backend and frontend container images with Cloud Build
- Deploy both services to Cloud Run
- Configure frontend to call deployed backend API
- Print frontend, backend, and health URLs

### Manual deployment artifacts
- `deployment/cloudbuild.backend.yaml`
- `deployment/cloudbuild.frontend.yaml`


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assets/register` | Register & fingerprint a new asset |
| GET | `/api/assets/` | List all protected assets |
| GET | `/api/assets/{id}` | Get asset details |
| DELETE | `/api/assets/{id}` | Deactivate an asset |
| POST | `/api/assets/{id}/analyze` | AI analysis of an asset |
| POST | `/api/scan/upload` | Scan an image against all assets |
| POST | `/api/scan/compare` | Compare two images directly |
| POST | `/api/scan/quick-check` | Fast hash-only check |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/matches` | List all violations |
| PATCH | `/api/dashboard/matches/{id}` | Update violation status |

## How It Works

1. **Register** — Upload official sports media. AEGIS generates 4 perceptual hashes + a 146-dimensional visual embedding
2. **Fingerprint** — Hashes and embeddings are stored in SQLite and ChromaDB respectively
3. **Analyze** — Google Gemini describes the content, detects watermarks, assesses originality
4. **Scan** — Upload suspect content. AEGIS compares using hash similarity (60% weight) + embedding similarity (40% weight)
5. **Detect** — Matches above 85% threshold are flagged. Types: exact, near-duplicate, derivative, modified
6. **Respond** — Review violations on the dashboard. Confirm or dismiss with one click

## Hackathon Submission Pack

- Submission wording: `docs/HACKATHON_SUBMISSION.md`
- Video/demo flow: `docs/DEMO_RUNBOOK.md`
- Deck structure: `docs/PPT_OUTLINE.md`

## Team

Built for the Solution Challenge 2026

## License

MIT
