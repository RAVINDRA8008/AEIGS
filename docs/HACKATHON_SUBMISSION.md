# Hackathon Submission Notes

## Mandatory Requirement Mapping

### 1) Cloud Deployment Included
AEGIS is cloud-deployment ready and includes Dockerized frontend/backend plus Google Cloud Run deployment automation.

Implemented artifacts:
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `deployment/cloudbuild.backend.yaml`
- `deployment/cloudbuild.frontend.yaml`
- `scripts/deploy_gcp.ps1`

### 2) Google AI Model/Service Used
AEGIS uses Google Gemini (`gemini-2.0-flash`) in backend AI services.

Code references:
- `backend/app/services/google_ai.py`
- `backend/app/services/ai_narration.py`
- `backend/app/services/content_discovery.py`

## Recommended Form Wording
Use this text in the application form:

"Our prototype already integrates Google Gemini for content intelligence, violation explanation, and discovery analysis. The solution is cloud-deployment ready via containerized services and Cloud Run deployment pipelines. In this stage, we run core workflows and controlled automation; in the next stage, we enable full-scale live integrations and production traffic orchestration."

## Honest Phase Statement (If Asked)
"Gemini integration is active in our architecture and tested in prototype flows. For this round, we prioritize deterministic core workflows and controlled demo reliability. In the next level, we switch on expanded live AI automation at production scale."
