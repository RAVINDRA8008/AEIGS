import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield,
  Dna,
  Eye,
  Zap,
  Scale,
  Globe,
  ArrowRight,
  ChevronDown,
  Fingerprint,
  BarChart3,
  FileWarning,
  Network,
  Lock,
  TrendingUp,
  CheckCircle2,
  Play,
} from 'lucide-react';

const features = [
  {
    icon: Fingerprint,
    title: 'AI-Powered Detection',
    description:
      'Multi-layer fingerprinting with perceptual hashing, vector embeddings, and Gemini 2.0 semantic analysis.',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    icon: Dna,
    title: 'Digital DNA Watermarking',
    description:
      'Invisible steganographic watermarks trace leaked content back to the exact recipient — forensic-grade.',
    color: 'from-purple-500 to-pink-400',
  },
  {
    icon: BarChart3,
    title: 'Risk Intelligence Engine',
    description:
      'Multi-factor risk scoring combines platform impact, spread velocity, content value, and revenue exposure.',
    color: 'from-amber-500 to-orange-400',
  },
  {
    icon: FileWarning,
    title: 'Automated Enforcement',
    description:
      'One-click DMCA takedown generation with evidence packaging and compliance tracking.',
    color: 'from-red-500 to-rose-400',
  },
  {
    icon: Network,
    title: 'Propagation Tracking',
    description:
      'Content lineage graphs show exactly how and where your media spreads across platforms in real-time.',
    color: 'from-green-500 to-emerald-400',
  },
  {
    icon: Globe,
    title: 'Rights Management',
    description:
      'Region-based licensing with platform authorization — know instantly if usage is authorized.',
    color: 'from-indigo-500 to-violet-400',
  },
];

const stats = [
  { value: '99.7%', label: 'Detection Accuracy' },
  { value: '<2s', label: 'Scan Speed' },
  { value: '6', label: 'Protection Layers' },
  { value: '24/7', label: 'Monitoring' },
];

const techStack = [
  { name: 'Gemini 2.0 Flash', desc: 'Semantic image understanding' },
  { name: 'Cloud Vision AI', desc: 'Visual feature extraction' },
  { name: 'ChromaDB', desc: 'Vector similarity search' },
  { name: 'Perceptual Hashing', desc: 'Robust fingerprinting' },
  { name: 'LSB Steganography', desc: 'Invisible watermarking' },
  { name: 'FastAPI', desc: 'High-performance backend' },
];

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-dark-950 text-white overflow-x-hidden">
      {/* ---------- Navbar ---------- */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 backdrop-blur-xl bg-dark-950/70">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aegis-500 to-accent-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">AEGIS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-dark-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#tech" className="hover:text-white transition-colors">
              Technology
            </a>
          </div>
          <Link
            to="/"
            className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2"
          >
            Open Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* ---------- Hero ---------- */}
      <section className="relative pt-32 pb-24 px-6 flex flex-col items-center text-center">
        {/* Background effects */}
        <div
          className="absolute inset-0 bg-radial-glow opacity-40"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        />
        <div className="absolute inset-0 bg-grid opacity-10" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-4xl"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-aegis-500/10 text-aegis-400 text-xs font-semibold tracking-wider uppercase mb-6 border border-aegis-500/20">
            <Zap className="w-3.5 h-3.5" /> Google Solution Challenge 2025
          </span>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6">
            <span className="gradient-text-hero">Real-Time Digital Asset</span>
            <br />
            <span className="text-white">Intelligence & Enforcement</span>
          </h1>

          <p className="text-lg md:text-xl text-dark-300 max-w-2xl mx-auto mb-10">
            AEGIS is the first platform that doesn't just <em>detect</em> sports
            media piracy — it <strong>tracks propagation</strong>,{' '}
            <strong>scores risk</strong>, <strong>traces leaks</strong> with
            Digital DNA, and <strong>automates takedowns</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="btn-primary text-base px-8 py-3.5 flex items-center gap-3 shadow-glow-md"
            >
              <Play className="w-5 h-5" /> Launch Platform
            </Link>
            <a
              href="#features"
              className="btn-secondary text-base px-8 py-3.5 flex items-center gap-3"
            >
              Explore Features <ChevronDown className="w-5 h-5" />
            </a>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative z-10 mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl w-full"
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl py-5 px-4 text-center"
            >
              <div className="text-3xl font-extrabold gradient-text">
                {s.value}
              </div>
              <div className="text-xs text-dark-400 mt-1 uppercase tracking-wider">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ---------- Problem Statement ---------- */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto glass-card rounded-3xl p-10 md:p-14 border border-red-500/10">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Eye className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                The $12B Problem
              </h2>
              <p className="text-dark-300 text-lg leading-relaxed">
                Sports media piracy costs the industry{' '}
                <strong className="text-white">$12 billion annually</strong>.
                Existing tools stop at detection — they can tell you{' '}
                <em>if</em> content was copied, but not <em>who</em> leaked it,{' '}
                <em>how fast</em> it's spreading, <em>where</em> it's
                authorized, or <em>what to do about it</em>. AEGIS closes every
                gap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Six Layers of Protection
            </h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">
              From detection to enforcement — a complete digital asset
              intelligence pipeline.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-card rounded-2xl p-7 card-hover group"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- How It Works ---------- */}
      <section id="how-it-works" className="py-20 px-6 bg-dark-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How It Works
          </h2>

          <div className="space-y-0">
            {[
              {
                step: '01',
                title: 'Register & Protect',
                desc: 'Upload your sports media. AEGIS generates perceptual hashes, vector embeddings, Gemini analysis, and optional Digital DNA watermarks.',
                icon: Lock,
              },
              {
                step: '02',
                title: 'Detect & Score',
                desc: 'Scan suspected copies. Our multi-layer detection engine calculates similarity across 4 hash types, embeddings, and AI comparison. Risk engine scores every match.',
                icon: Eye,
              },
              {
                step: '03',
                title: 'Track & Trace',
                desc: 'Propagation graphs reveal how content spreads. Digital DNA traces leaks back to the exact recipient who distributed it.',
                icon: Network,
              },
              {
                step: '04',
                title: 'Enforce & Recover',
                desc: 'Auto-generated DMCA notices with evidence packages. Track compliance. Estimate revenue impact and recovery potential.',
                icon: Scale,
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="flex items-start gap-6 py-8 border-b border-dark-800 last:border-0"
              >
                <div className="text-4xl font-extrabold text-aegis-500/20 w-16 text-right flex-shrink-0">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-aegis-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <item.icon className="w-6 h-6 text-aegis-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-dark-400 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Tech Stack ---------- */}
      <section id="tech" className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built on Google Cloud
          </h2>
          <p className="text-dark-400 text-lg mb-12 max-w-xl mx-auto">
            Powered by Gemini AI, Cloud Vision, and open-source intelligence.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {techStack.map((t) => (
              <div
                key={t.name}
                className="glass-card rounded-xl p-5 text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold">{t.name}</span>
                </div>
                <p className="text-xs text-dark-500 pl-6">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-12 border border-aegis-500/10"
          >
            <h2 className="text-3xl font-bold mb-4">
              Stop Piracy. Start Enforcing.
            </h2>
            <p className="text-dark-300 mb-8">
              AEGIS gives rights holders a complete intelligence and enforcement
              platform — from first detection to final takedown.
            </p>
            <Link
              to="/"
              className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-3 shadow-glow-lg"
            >
              <Shield className="w-5 h-5" /> Enter AEGIS Dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-dark-800 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-dark-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-aegis-500" />
            <span>
              AEGIS — Advanced Engine for Guarding Intellectual Sports-media
            </span>
          </div>
          <div>Google Solution Challenge 2025 • Built with Gemini AI</div>
        </div>
      </footer>
    </div>
  );
}
