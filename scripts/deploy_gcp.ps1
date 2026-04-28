param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectId,

    [Parameter(Mandatory = $true)]
    [string]$GoogleApiKey,

    [string]$Region = "us-central1",
    [string]$BackendService = "aegis-backend",
    [string]$FrontendService = "aegis-frontend"
)

$ErrorActionPreference = "Stop"

Write-Host "Setting gcloud project to $ProjectId" -ForegroundColor Cyan
gcloud config set project $ProjectId | Out-Null

$backendImage = "gcr.io/$ProjectId/$BackendService`:latest"
$frontendImage = "gcr.io/$ProjectId/$FrontendService`:latest"

Write-Host "Building backend image: $backendImage" -ForegroundColor Cyan
gcloud builds submit `
  --config deployment/cloudbuild.backend.yaml `
  --substitutions "_IMAGE=$backendImage"

Write-Host "Deploying backend Cloud Run service: $BackendService" -ForegroundColor Cyan
gcloud run deploy $BackendService `
  --image $backendImage `
  --region $Region `
  --platform managed `
  --allow-unauthenticated `
  --set-env-vars "GOOGLE_API_KEY=$GoogleApiKey"

$backendUrl = gcloud run services describe $BackendService `
  --region $Region `
  --platform managed `
  --format "value(status.url)"

if (-not $backendUrl) {
    throw "Failed to resolve backend URL after deployment."
}

$apiBase = "$backendUrl/api"
Write-Host "Resolved backend API base URL: $apiBase" -ForegroundColor Green

Write-Host "Building frontend image: $frontendImage" -ForegroundColor Cyan
gcloud builds submit `
  --config deployment/cloudbuild.frontend.yaml `
  --substitutions "_IMAGE=$frontendImage,_VITE_API_BASE_URL=$apiBase"

Write-Host "Deploying frontend Cloud Run service: $FrontendService" -ForegroundColor Cyan
gcloud run deploy $FrontendService `
  --image $frontendImage `
  --region $Region `
  --platform managed `
  --allow-unauthenticated

$frontendUrl = gcloud run services describe $FrontendService `
  --region $Region `
  --platform managed `
  --format "value(status.url)"

Write-Host "" 
Write-Host "Deployment complete" -ForegroundColor Green
Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Green
Write-Host "Backend URL:  $backendUrl" -ForegroundColor Green
Write-Host "Health URL:   $backendUrl/api/health" -ForegroundColor Green
