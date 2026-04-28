import axios from 'axios';

const rawApiBase = import.meta.env.VITE_API_BASE_URL || '/api';
const normalizedBase = rawApiBase.replace(/\/$/, '');
const API_BASE = normalizedBase.endsWith('/api') ? normalizedBase : `${normalizedBase}/api`;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

// ---- Assets ----
export const registerAsset = async (file, name, description = '', organization = 'Default Org') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  formData.append('description', description);
  formData.append('organization', organization);
  const res = await api.post('/assets/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getAssets = async (skip = 0, limit = 50) => {
  const res = await api.get(`/assets/?skip=${skip}&limit=${limit}`);
  return res.data;
};

export const getAsset = async (id) => {
  const res = await api.get(`/assets/${id}`);
  return res.data;
};

export const deleteAsset = async (id) => {
  const res = await api.delete(`/assets/${id}`);
  return res.data;
};

export const analyzeAsset = async (id) => {
  const res = await api.post(`/assets/${id}/analyze`);
  return res.data;
};

// ---- Scanning ----
export const scanUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/scan/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const scanURL = async (url) => {
  const res = await api.post('/scan/url', { url });
  return res.data;
};

export const batchScan = async (files) => {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  const res = await api.post('/scan/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const compareImages = async (file1, file2) => {
  const formData = new FormData();
  formData.append('file1', file1);
  formData.append('file2', file2);
  const res = await api.post('/scan/compare', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const quickCheck = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/scan/quick-check', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// ---- Dashboard ----
export const getDashboardStats = async () => {
  const res = await api.get('/dashboard/stats');
  return res.data;
};

export const getMatches = async (skip = 0, limit = 50, status = null, matchType = null) => {
  let url = `/dashboard/matches?skip=${skip}&limit=${limit}`;
  if (status) url += `&status=${status}`;
  if (matchType) url += `&match_type=${matchType}`;
  const res = await api.get(url);
  return res.data;
};

export const updateMatchStatus = async (matchId, status) => {
  const res = await api.patch(`/dashboard/matches/${matchId}`, { status });
  return res.data;
};

export const bulkUpdateMatches = async (matchIds, status) => {
  const res = await api.patch('/dashboard/matches/bulk-update', null, {
    params: { status },
    data: matchIds,
  });
  return res.data;
};

export const getScanHistory = async (limit = 20) => {
  const res = await api.get(`/dashboard/scan-history?limit=${limit}`);
  return res.data;
};

export const getActivity = async (limit = 30) => {
  const res = await api.get(`/dashboard/activity?limit=${limit}`);
  return res.data;
};

// ---- Reports ----
export const getReportSummary = async (days = 30) => {
  const res = await api.get(`/reports/summary?days=${days}`);
  return res.data;
};

export const exportViolations = async (format = 'csv', days = 30) => {
  const res = await api.get(`/reports/violations/export?format=${format}&days=${days}`, {
    responseType: 'blob',
  });
  return res;
};

export const exportAssets = async () => {
  const res = await api.get('/reports/assets/export', { responseType: 'blob' });
  return res;
};

// ---- Health ----
export const getHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

// ---- Digital DNA / Watermark ----
export const embedWatermark = async (assetId, recipient = '', purpose = '') => {
  const formData = new FormData();
  formData.append('recipient', recipient);
  formData.append('purpose', purpose);
  const res = await api.post(`/watermark/embed/${assetId}`, formData);
  return res.data;
};

export const verifyWatermark = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/watermark/verify', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const downloadWatermarked = (assetId, recipient = '') => {
  return `${API_BASE}/watermark/download/${assetId}?recipient=${encodeURIComponent(recipient)}`;
};

export const getWatermarkHistory = async (assetId) => {
  const res = await api.get(`/watermark/history/${assetId}`);
  return res.data;
};

// ---- Enforcement ----
export const generateEnforcement = async (matchId, actionType = 'dmca', priority = 'medium') => {
  const res = await api.post('/enforcement/generate', {
    match_id: matchId,
    action_type: actionType,
    priority,
  });
  return res.data;
};

export const listEnforcements = async (status = '') => {
  const res = await api.get(`/enforcement/list?status=${status}`);
  return res.data;
};

export const getEnforcement = async (actionId) => {
  const res = await api.get(`/enforcement/${actionId}`);
  return res.data;
};

export const updateEnforcement = async (actionId, data) => {
  const res = await api.patch(`/enforcement/${actionId}`, data);
  return res.data;
};

export const getEnforcementStats = async () => {
  const res = await api.get('/enforcement/stats/summary');
  return res.data;
};

// ---- Propagation ----
export const getPropagationTree = async (assetId) => {
  const res = await api.get(`/propagation/tree/${assetId}`);
  return res.data;
};

export const trackPropagation = async (matchId) => {
  const res = await api.post(`/propagation/track/${matchId}`);
  return res.data;
};

export const getPropagationOverview = async () => {
  const res = await api.get('/propagation/overview');
  return res.data;
};

// ---- Rights ----
export const createRightsZone = async (data) => {
  const res = await api.post('/rights/zones', data);
  return res.data;
};

export const getAssetRights = async (assetId) => {
  const res = await api.get(`/rights/zones/${assetId}`);
  return res.data;
};

export const deactivateRightsZone = async (zoneId) => {
  const res = await api.delete(`/rights/zones/${zoneId}`);
  return res.data;
};

export const checkRights = async (assetId, region, platform = '') => {
  const res = await api.get(`/rights/check?asset_id=${assetId}&region=${region}&platform=${platform}`);
  return res.data;
};

export const getRightsOverview = async () => {
  const res = await api.get('/rights/overview');
  return res.data;
};

// ---- Risk Intelligence ----
export const getRiskScore = async (matchId) => {
  const res = await api.get(`/risk/score/${matchId}`);
  return res.data;
};

export const batchRiskScores = async () => {
  const res = await api.get('/risk/batch');
  return res.data;
};

export const getRiskDashboard = async () => {
  const res = await api.get('/risk/dashboard');
  return res.data;
};

// ---- Real-Time Pipeline ----
export const runPipeline = async (assetName, assetId = null, fileSize = 0) => {
  const res = await api.post('/realtime/run', {
    asset_name: assetName,
    asset_id: assetId,
    file_size: fileSize,
  });
  return res.data;
};

export const simulateLeak = async (assetName) => {
  const res = await api.post('/realtime/simulate-leak', { asset_name: assetName });
  return res.data;
};

export const getPipelineStages = async () => {
  const res = await api.get('/realtime/stages');
  return res.data;
};

export const createSSEConnection = () => {
  return new EventSource(`${API_BASE}/realtime/stream`);
};

// ---- Video Intelligence ----
export const analyzeVideo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/video/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const matchVideoClip = async (clipFile, videoFile) => {
  const formData = new FormData();
  formData.append('clip', clipFile);
  formData.append('video', videoFile);
  const res = await api.post('/video/match-clip', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const videoDemoAnalysis = async (name) => {
  const res = await api.post('/video/demo-analysis', { name });
  return res.data;
};

// ---- Leak Prediction ----
export const getAssetLeakPrediction = async (assetId) => {
  const res = await api.get(`/prediction/asset/${assetId}`);
  return res.data;
};

export const getBatchPredictions = async () => {
  const res = await api.get('/prediction/batch');
  return res.data;
};

export const predictRecipientRisk = async (recipient, role = 'unknown') => {
  const res = await api.post('/prediction/recipient', { recipient, role });
  return res.data;
};

export const identifyLeakSource = async (watermarkUid = null, platform = 'unknown') => {
  const res = await api.post('/prediction/identify-source', {
    watermark_uid: watermarkUid,
    detection_platform: platform,
  });
  return res.data;
};

export const simulateLeakPrediction = async (assetName) => {
  const res = await api.post('/prediction/simulate', { asset_name: assetName });
  return res.data;
};

export const getLeakPredictionDashboard = async () => {
  const res = await api.get('/prediction/dashboard');
  return res.data;
};

// ---- Evidence Chain ----
export const recordEvidence = async (eventType, data = {}, assetId = null, matchId = null) => {
  const res = await api.post('/evidence/record', {
    event_type: eventType,
    data,
    asset_id: assetId,
    match_id: matchId,
  });
  return res.data;
};

export const getEvidenceChain = async (limit = 50, offset = 0) => {
  const res = await api.get(`/evidence/chain?limit=${limit}&offset=${offset}`);
  return res.data;
};

export const verifyEvidenceChain = async () => {
  const res = await api.get('/evidence/verify');
  return res.data;
};

export const getCourtPackage = async (assetId) => {
  const res = await api.get(`/evidence/court-package/${assetId}`);
  return res.data;
};

export const getEvidenceStats = async () => {
  const res = await api.get('/evidence/stats');
  return res.data;
};

// ---- Platform Integration ----
export const submitTakedown = async (platform, contentUrl, assetName, assetId, actionType = 'remove') => {
  const res = await api.post('/platform/takedown', {
    platform,
    content_url: contentUrl,
    asset_name: assetName,
    asset_id: assetId,
    action_type: actionType,
  });
  return res.data;
};

export const getTakedownStatus = async (requestId, platform) => {
  const res = await api.get(`/platform/takedown-status/${requestId}?platform=${platform}`);
  return res.data;
};

export const getPlatformOverview = async () => {
  const res = await api.get('/platform/platforms');
  return res.data;
};

export const youtubeContentId = async (assetName, videoUrl) => {
  const res = await api.post('/platform/content-id', {
    asset_name: assetName,
    video_url: videoUrl,
  });
  return res.data;
};

// ---- Revenue Impact ----
export const getRevenueDashboard = async () => {
  const res = await api.get('/revenue/dashboard');
  return res.data;
};

export const getRevenueSummary = async () => {
  const res = await api.get('/revenue/summary');
  return res.data;
};

export const getViolationRevenue = async (matchId) => {
  const res = await api.get(`/revenue/violation/${matchId}`);
  return res.data;
};

// ---- Content Discovery ----
export const discoveryWebSearch = async (data) => {
  const res = await api.post('/discovery/web-search', data);
  return res.data;
};

export const discoveryYouTubeSearch = async (data) => {
  const res = await api.post('/discovery/youtube-search', data);
  return res.data;
};

export const discoveryVisionDetect = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/discovery/vision-detect', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const discoverySweep = async (data) => {
  const res = await api.post('/discovery/sweep', data);
  return res.data;
};

export const discoverySweepAsset = async (assetId) => {
  const res = await api.post(`/discovery/sweep/${assetId}`);
  return res.data;
};

export const discoveryOverview = async () => {
  const res = await api.get('/discovery/overview');
  return res.data;
};

// ---- Geographic Analytics ----
export const getGeoHeatmap = async (sport, days = 30) => {
  let url = `/geo/heatmap?days=${days}`;
  if (sport) url += `&sport=${encodeURIComponent(sport)}`;
  const res = await api.get(url);
  return res.data;
};

export const getGeoRegion = async (regionId) => {
  const res = await api.get(`/geo/region/${regionId}`);
  return res.data;
};

export const getGeoContinents = async () => {
  const res = await api.get('/geo/continents');
  return res.data;
};

export const getGeoTrending = async (limit = 10) => {
  const res = await api.get(`/geo/trending?limit=${limit}`);
  return res.data;
};

// ---- Content Comparison ----
export const compareContent = async (originalName, suspectName, assetId = null) => {
  const res = await api.post('/comparison/analyze', {
    original_name: originalName,
    suspect_name: suspectName,
    asset_id: assetId,
  });
  return res.data;
};

export const batchCompare = async (originalName, suspects) => {
  const res = await api.post('/comparison/batch', {
    original_name: originalName,
    suspects,
  });
  return res.data;
};

// ---- DMCA Reports ----
export const generateDMCA = async (data) => {
  const res = await api.post('/dmca/generate', data);
  return res.data;
};

export const batchDMCA = async (violations) => {
  const res = await api.post('/dmca/batch', { violations });
  return res.data;
};

export const getDMCAReport = async (days = 30) => {
  const res = await api.get(`/dmca/report?days=${days}`);
  return res.data;
};

export const getDMCAPlatforms = async () => {
  const res = await api.get('/dmca/platforms');
  return res.data;
};

// ---- Identity Graph ----
export const getIdentityNetworks = async () => {
  const res = await api.get('/identity/networks');
  return res.data;
};

export const getNetworkDetail = async (networkId) => {
  const res = await api.get(`/identity/networks/${networkId}`);
  return res.data;
};

export const getOffenderProfile = async (offenderId) => {
  const res = await api.get(`/identity/offender/${offenderId}`);
  return res.data;
};

export const getIdentityStats = async () => {
  const res = await api.get('/identity/stats');
  return res.data;
};

// ---- AI Intelligence ----
export const aiExplainViolation = async (violationType, context = {}) => {
  const res = await api.post('/ai/explain', { violation_type: violationType, context });
  return res.data;
};

export const getAIAssetIntel = async (assetId) => {
  const res = await api.get(`/ai/asset/${assetId}`);
  return res.data;
};

export const getAIBriefing = async () => {
  const res = await api.get('/ai/briefing');
  return res.data;
};

// ---- Licensing & Revenue Recovery ----
export const getLicensingDashboard = async () => {
  const res = await api.get('/licensing/dashboard');
  return res.data;
};

export const evaluateLicensing = async (violationId) => {
  const res = await api.get(`/licensing/evaluate/${violationId}`);
  return res.data;
};

export const getLicensingMetrics = async () => {
  const res = await api.get('/licensing/metrics');
  return res.data;
};

// ---- Compliance & Audit ----
export const getComplianceStatus = async () => {
  const res = await api.get('/compliance/status');
  return res.data;
};

export const getAuditLog = async (limit = 50, category = null) => {
  let url = `/compliance/audit-log?limit=${limit}`;
  if (category) url += `&category=${encodeURIComponent(category)}`;
  const res = await api.get(url);
  return res.data;
};

export const getDataGovernance = async () => {
  const res = await api.get('/compliance/data-governance');
  return res.data;
};

export const verifyAuditIntegrity = async () => {
  const res = await api.get('/compliance/verify');
  return res.data;
};

export default api;
