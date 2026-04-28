import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FolderOpen,
  Trash2,
  Sparkles,
  X,
  Image as ImageIcon,
  Loader2,
  Search,
  Grid3X3,
  List,
  Shield,
  Calendar,
  Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAssets, registerAsset, deleteAsset, analyzeAsset } from '../services/api';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
};

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  // Upload form
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadOrg, setUploadOrg] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const data = await getAssets();
      setAssets(data.assets);
    } catch (err) {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadFile(file);
      setUploadPreview(URL.createObjectURL(file));
      if (!uploadName) {
        setUploadName(file.name.replace(/\.[^.]+$/, ''));
      }
    }
  }, [uploadName]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim()) {
      toast.error('Please provide a file and name');
      return;
    }
    setUploading(true);
    try {
      await registerAsset(uploadFile, uploadName, uploadDesc, uploadOrg || 'Default Org');
      toast.success('Asset registered & fingerprinted!');
      resetUploadForm();
      setShowUpload(false);
      loadAssets();
    } catch (err) {
      toast.error('Failed to register asset');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAsset(id);
      toast.success('Asset removed');
      loadAssets();
    } catch (err) {
      toast.error('Failed to delete asset');
    }
  };

  const handleAnalyze = async (asset) => {
    setAnalyzing(asset.id);
    setAnalysisResult(null);
    try {
      const result = await analyzeAsset(asset.id);
      setAnalysisResult(result);
      setSelectedAsset(asset);
    } catch (err) {
      toast.error('AI analysis failed');
    } finally {
      setAnalyzing(null);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadPreview(null);
    setUploadName('');
    setUploadDesc('');
    setUploadOrg('');
  };

  const filteredAssets = assets.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.organization && a.organization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-9 w-52 mb-2" />
            <div className="skeleton h-5 w-72" />
          </div>
          <div className="skeleton h-12 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-72" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={FolderOpen}
        title="Protected Assets"
        subtitle={`${assets.length} asset${assets.length !== 1 ? 's' : ''} registered & fingerprinted`}
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowUpload(true)}
          className="btn-primary"
        >
          <Upload className="w-5 h-5" />
          Register Asset
        </motion.button>
      </PageHeader>

      {/* Search & View Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            placeholder="Search assets by name or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex bg-dark-900 rounded-xl border border-dark-700 p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-aegis-600/20 text-aegis-400' : 'text-dark-500 hover:text-dark-300'}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-aegis-600/20 text-aegis-400' : 'text-dark-500 hover:text-dark-300'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && (setShowUpload(false), resetUploadForm())}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="section-card w-full max-w-lg space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Register New Asset</h2>
                <button onClick={() => { setShowUpload(false); resetUploadForm(); }}
                  className="btn-ghost p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  ${isDragActive ? 'border-aegis-500 bg-aegis-500/10' : 'border-dark-600 hover:border-dark-500 hover:bg-dark-800/30'}`}
              >
                <input {...getInputProps()} />
                {uploadPreview ? (
                  <div className="space-y-3">
                    <img src={uploadPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                    <p className="text-sm text-dark-400">{uploadFile?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-dark-800 rounded-2xl flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-dark-500" />
                    </div>
                    <p className="text-dark-400">Drop your image here or click to browse</p>
                    <p className="text-xs text-dark-600">PNG, JPG, WEBP up to 20MB</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <input type="text" placeholder="Asset name *" value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)} className="input" />
                <input type="text" placeholder="Description" value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)} className="input" />
                <input type="text" placeholder="Organization" value={uploadOrg}
                  onChange={(e) => setUploadOrg(e.target.value)} className="input" />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleUpload}
                disabled={uploading || !uploadFile}
                className="btn-primary w-full justify-center py-3"
              >
                {uploading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Fingerprinting...</>
                ) : (
                  <><Upload className="w-5 h-5" /> Register & Fingerprint</>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Analysis Modal */}
      <AnimatePresence>
        {selectedAsset && analysisResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && (setSelectedAsset(null), setAnalysisResult(null))}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="section-card w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-warning-400" />
                  AI Analysis — {selectedAsset.name}
                </h2>
                <button onClick={() => { setSelectedAsset(null); setAnalysisResult(null); }}
                  className="btn-ghost p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {analysisResult.analysis && (
                  <div className="bg-dark-800/50 rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-aegis-400">Content Analysis</h3>
                    <p className="text-sm text-dark-300 leading-relaxed">{analysisResult.analysis.description}</p>
                    {analysisResult.analysis.labels?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {analysisResult.analysis.labels.map((label, i) => (
                          <span key={i} className="badge bg-dark-700 text-dark-300">{label}</span>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="text-sm">
                        <span className="text-dark-500">Sports Content:</span>{' '}
                        <span className={analysisResult.analysis.is_sports_content ? 'text-success-400' : 'text-danger-400'}>
                          {analysisResult.analysis.is_sports_content ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-dark-500">Content Type:</span>{' '}
                        <span className="text-white">{analysisResult.analysis.content_type}</span>
                      </div>
                    </div>
                  </div>
                )}
                {analysisResult.web_presence && (
                  <div className="bg-dark-800/50 rounded-xl p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-aegis-400">Web Presence Intel</h3>
                    <pre className="text-xs text-dark-300 whitespace-pre-wrap">
                      {JSON.stringify(analysisResult.web_presence, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Asset Grid / List */}
      {filteredAssets.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-3'
          }
        >
          {filteredAssets.map((asset) => (
            viewMode === 'grid' ? (
              <motion.div
                key={asset.id}
                variants={item}
                layout
                className="section-card p-0 overflow-hidden card-hover"
              >
                <div className="relative h-48 bg-dark-800 overflow-hidden group">
                  <img
                    src={asset.file_path}
                    alt={asset.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-transparent" />
                  <div className="absolute inset-0 bg-aegis-500/0 group-hover:bg-aegis-500/5 transition-colors duration-500" />
                  <div className="absolute top-3 right-3">
                    <span className="badge badge-success backdrop-blur-md flex items-center gap-1 shadow-lg">
                      <Shield className="w-3 h-3" /> Protected
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-white font-semibold truncate">{asset.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-dark-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {asset.organization}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(asset.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="bg-dark-800/50 rounded-lg p-2">
                    <p className="text-[10px] text-dark-500 font-mono truncate">
                      pHash: {asset.phash?.slice(0, 24)}...
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAnalyze(asset)}
                      disabled={analyzing === asset.id}
                      className="flex-1 btn-secondary py-2 justify-center text-sm"
                    >
                      {analyzing === asset.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      AI Analyze
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(asset.id)}
                      className="p-2 bg-dark-800 hover:bg-danger-500/20 text-dark-400 hover:text-danger-400 rounded-xl transition-all border border-dark-600 hover:border-danger-500/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={asset.id}
                variants={item}
                layout
                className="section-card flex items-center gap-4 p-4 card-hover"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-dark-800 flex-shrink-0">
                  <img src={asset.file_path} alt={asset.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{asset.name}</h3>
                  <p className="text-xs text-dark-500">{asset.organization} • {new Date(asset.uploaded_at).toLocaleDateString()}</p>
                </div>
                <span className="badge badge-success hidden sm:inline-flex">Protected</span>
                <div className="flex gap-2">
                  <button onClick={() => handleAnalyze(asset)} disabled={analyzing === asset.id}
                    className="btn-ghost text-sm">
                    {analyzing === asset.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(asset.id)} className="btn-ghost text-sm hover:text-danger-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          ))}
        </motion.div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title={searchQuery ? 'No matching assets' : 'No assets registered'}
          description={searchQuery ? 'Try adjusting your search' : 'Upload your first digital asset to start protecting it'}
          action={!searchQuery ? () => setShowUpload(true) : undefined}
          actionLabel="Register Your First Asset"
        />
      )}
    </div>
  );
}
