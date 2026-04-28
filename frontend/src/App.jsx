import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Scan from './pages/Scan';
import Matches from './pages/Matches';
import Reports from './pages/Reports';
import LandingPage from './pages/LandingPage';
import WatermarkPage from './pages/WatermarkPage';
import EnforcementPage from './pages/EnforcementPage';
import PropagationPage from './pages/PropagationPage';
import RealtimeMonitor from './pages/RealtimeMonitor';
import VideoAnalysis from './pages/VideoAnalysis';
import PredictionPage from './pages/PredictionPage';
import EvidencePage from './pages/EvidencePage';
import RevenueDashboard from './pages/RevenueDashboard';
import ContentDiscovery from './pages/ContentDiscovery';
import GeoHeatmap from './pages/GeoHeatmap';
import ContentComparison from './pages/ContentComparison';
import DMCAGenerator from './pages/DMCAGenerator';
import IdentityGraph from './pages/IdentityGraph';
import LicensingPage from './pages/LicensingPage';
import ComplianceAudit from './pages/ComplianceAudit';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#f0fdf4' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fef2f2' },
          },
        }}
      />
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/scan" element={<Scan />} />
                <Route path="/matches" element={<Matches />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/watermark" element={<WatermarkPage />} />
                <Route path="/enforcement" element={<EnforcementPage />} />
                <Route path="/propagation" element={<PropagationPage />} />
                <Route path="/realtime" element={<RealtimeMonitor />} />
                <Route path="/video" element={<VideoAnalysis />} />
                <Route path="/prediction" element={<PredictionPage />} />
                <Route path="/evidence" element={<EvidencePage />} />
                <Route path="/revenue" element={<RevenueDashboard />} />
                <Route path="/discovery" element={<ContentDiscovery />} />
                <Route path="/geo" element={<GeoHeatmap />} />
                <Route path="/comparison" element={<ContentComparison />} />
                <Route path="/dmca" element={<DMCAGenerator />} />
                <Route path="/identity" element={<IdentityGraph />} />
                <Route path="/licensing" element={<LicensingPage />} />
                <Route path="/compliance" element={<ComplianceAudit />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
