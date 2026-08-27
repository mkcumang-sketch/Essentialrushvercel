"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  FileText,
  Globe,
  Image as ImageIcon,
  Link2,
  ListChecks,
  Loader2,
  RefreshCcw,
  Rocket,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Wand2,
  XCircle,
  LucideIcon,
} from "lucide-react";

import { AnimatePresence, motion } from "framer-motion";

import SeoAnalyticsDashboard from "./SeoAnalyticsDashboard";
import RedirectManager from "./RedirectManager";

/* =========================================================
   TYPES
========================================================= */

interface SeoStats {
  totalProducts: number;
  totalIndexed: number;
  totalNoindex: number;
  avgScore: number;
  indexedAvgScore?: number;
  missingMetaTitle: number;
  missingMetaDesc: number;
  missingAltText: number;
  missingFocusKeyword?: number;
  missingCanonical?: number;
  totalImages?: number;
  optimizedImages?: number;
  imageCoverage?: number;
  metadataCoverage?: number;
  needsAttention?: SeoIssue[];
}

interface SeoIssue {
  id: string;
  name: string;
  slug?: string;
  score: number;
  issues: {
    title?: boolean;
    desc?: boolean;
    alt?: boolean;
    focusKeyword?: boolean;
    canonical?: boolean;
  };
}

interface ApiResponse {
  success: boolean;
  data?: SeoStats;
  error?: string;
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function SeoEngineTab() {
  const [stats, setStats] = useState<SeoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "overview" | "analytics" | "redirects" | "tools"
  >("overview");

  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<Date | null>(null);

  /* =======================================================
     FETCH SEO DATA
  ======================================================= */

  const fetchSeoStats = useCallback(
    async (showRefreshLoader = false) => {
      try {
        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const response = await fetch("/api/seo/analytics", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`SEO API returned ${response.status}`);
        }

        const json: ApiResponse = await response.json();

        if (!json.success || !json.data) {
          throw new Error(json.error || "Unable to load SEO intelligence.");
        }

        setStats(json.data);
        setLastScan(new Date());
      } catch (err) {
        console.error("SEO Engine Error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load SEO data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchSeoStats();
  }, [fetchSeoStats]);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const score = stats?.avgScore ?? 0;

  const scoreStatus = useMemo(() => {
    if (score >= 90) {
      return {
        label: "Excellent",
        description: "Your SEO foundation is highly optimized.",
        icon: CheckCircle2,
        tone: "emerald",
      };
    }
    if (score >= 80) {
      return {
        label: "Healthy",
        description: "Your SEO is in good shape with minor opportunities.",
        icon: ShieldCheck,
        tone: "green",
      };
    }
    if (score >= 60) {
      return {
        label: "Needs Attention",
        description: "Several improvements could increase visibility.",
        icon: AlertTriangle,
        tone: "orange",
      };
    }
    return {
      label: "Critical",
      description: "Important SEO issues require immediate attention.",
      icon: XCircle,
      tone: "red",
    };
  }, [score]);

  const opportunityCount = useMemo(() => {
    if (!stats) return 0;
    return (
      (stats.missingMetaTitle || 0) +
      (stats.missingMetaDesc || 0) +
      (stats.missingAltText || 0) +
      (stats.missingFocusKeyword || 0) +
      (stats.missingCanonical || 0)
    );
  }, [stats]);

  const indexedPercentage = useMemo(() => {
    if (!stats?.totalProducts) return 0;
    return Math.round((stats.totalIndexed / stats.totalProducts) * 100);
  }, [stats]);

  const metadataCoverage = useMemo(() => {
    if (stats?.metadataCoverage !== undefined) {
      return stats.metadataCoverage;
    }
    if (!stats?.totalProducts) return 0;
    const title = stats.totalProducts - stats.missingMetaTitle;
    const desc = stats.totalProducts - stats.missingMetaDesc;
    return Math.round(((title + desc) / (stats.totalProducts * 2)) * 100);
  }, [stats]);

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigation = [
    { id: "overview" as const, label: "Overview", icon: Activity },
    { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
    { id: "redirects" as const, label: "Redirects", icon: Link2 },
    { id: "tools" as const, label: "SEO Tools", icon: Wand2 },
  ];

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="flex flex-col items-center gap-5"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.15)]">
              <Search size={28} className="text-[#D4AF37]" />
            </div>
            <Loader2 size={84} className="absolute -inset-2.5 text-[#D4AF37]/40 animate-spin" />
          </div>
          <div className="text-center mt-2">
            <p className="text-white font-bold tracking-wide">Scanning SEO Intelligence</p>
            <p className="text-xs text-gray-500 mt-1.5 uppercase tracking-widest font-bold">
              Analyzing metadata & indexing...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !stats) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full bg-red-500/5 border border-red-500/20 rounded-[2rem] p-10 text-center shadow-[0_0_50px_rgba(239,68,68,0.05)]"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <AlertCircle size={30} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mt-6">SEO Intelligence Offline</h2>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">{error || "Unable to load SEO analytics. Please check your connection."}</p>
          <button
            type="button"
            onClick={() => fetchSeoStats()}
            className="mt-7 inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all shadow-lg"
          >
            <RefreshCcw size={14} /> Retry Scan
          </button>
        </motion.div>
      </div>
    );
  }

  const StatusIcon = scoreStatus.icon;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-8 pb-24 text-white"
    >
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a] shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.08),transparent_40%)] pointer-events-none" />

        <div className="relative p-6 md:p-8 flex flex-col xl:flex-row justify-between gap-7">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                <Sparkles size={22} className="text-[#D4AF37]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl md:text-3xl font-serif text-[#D4AF37] tracking-tight">
                    SEO Command Center
                  </h2>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] uppercase tracking-[0.2em] text-emerald-400 font-bold">
                    Live
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 font-medium tracking-wide">
                  Centralized metadata audits, search engine indexing & optimization.
                </p>
              </div>
            </div>

            {lastScan && (
              <div className="mt-5 flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                <Clock3 size={11} className="text-[#D4AF37]" />
                Last scan: {lastScan.toLocaleTimeString()}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <QuickHeaderButton icon={Rocket} label="Run Full Audit" onClick={() => fetchSeoStats(true)} />
            <button
              type="button"
              onClick={() => fetchSeoStats(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#D4AF37] text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(212,175,55,0.15)]"
            >
              <RefreshCcw size={14} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Scanning..." : "Sync Engine"}
            </button>
          </div>
        </div>
      </div>

      {/* SCORE + QUICK OVERVIEW */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <SeoScoreRing score={score} />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${score >= 80 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : score >= 60 ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                   <StatusIcon size={20} />
                </div>
                <span className="text-xl font-bold tracking-wide">{scoreStatus.label}</span>
              </div>
              <p className="text-sm text-gray-400 mt-3 max-w-xl leading-relaxed">{scoreStatus.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7">
                <MiniStat label="Indexed" value={`${indexedPercentage}%`} />
                <MiniStat label="Metadata" value={`${metadataCoverage}%`} />
                <MiniStat label="Images" value={`${stats.imageCoverage ?? 0}%`} />
                <MiniStat label="Issues" value={opportunityCount} highlight={opportunityCount > 0} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#D4AF37]/10 to-black/40 border border-[#D4AF37]/20 rounded-[2rem] p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-20">
             <Target size={120} className="text-[#D4AF37]" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Optimization Queue</p>
              <p className="text-5xl font-black text-[#D4AF37] mt-3">{opportunityCount}</p>
              <p className="text-xs text-gray-300 mt-4 leading-relaxed max-w-[200px]">
                High-impact SEO opportunities detected. Resolve them to boost rankings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection("analytics")}
              className="mt-6 w-full py-3.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              Review Issues <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS WITH FRAMER MOTION MAGIC */}
      <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl overflow-x-auto relative">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`relative flex items-center gap-2 px-5 py-3 rounded-xl whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-colors ${
                active ? "text-black" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="seo-nav-tab"
                  className="absolute inset-0 bg-[#D4AF37] rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={15} /> {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* CONTENT AREA */}
      <AnimatePresence mode="wait">
        {activeSection === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <EngineMetric icon={ShieldCheck} label="SEO Health" value={`${stats.avgScore}%`} description={scoreStatus.label} tone="green" />
              <EngineMetric icon={Globe} label="Indexed Pages" value={stats.totalIndexed} description={`of ${stats.totalProducts} assets`} tone="blue" />
              <EngineMetric icon={ImageIcon} label="Alt Coverage" value={`${stats.imageCoverage ?? 0}%`} description="Image accessibility" tone="purple" />
              <EngineMetric icon={AlertTriangle} label="Open Issues" value={opportunityCount} description="Pending optimization" tone="orange" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <IssueBreakdown stats={stats} />
              <CoveragePanel indexed={indexedPercentage} metadata={metadataCoverage} images={stats.imageCoverage ?? 0} />
            </div>

            <div>
              <SectionTitle icon={ListChecks} title="Quick Actions" description="High-impact SEO operations" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                <ActionCard icon={Bot} title="AI Metadata" description="Generate optimized titles & descriptions." onClick={() => setActiveSection("tools")} />
                <ActionCard icon={ImageIcon} title="Image SEO" description="Fix missing image ALT attributes." onClick={() => setActiveSection("analytics")} />
                <ActionCard icon={Link2} title="Redirect Audit" description="Find and manage broken URL redirects." onClick={() => setActiveSection("redirects")} />
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === "analytics" && (
          <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SeoAnalyticsDashboard />
          </motion.div>
        )}

        {activeSection === "redirects" && (
          <motion.div key="redirects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RedirectManager />
          </motion.div>
        )}

        {activeSection === "tools" && (
          <motion.div key="tools" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <SectionTitle icon={Wand2} title="SEO Intelligence Tools" description="Utilities for optimizing your catalog" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <ToolCard icon={Bot} title="AI Meta Synthesizer" description="Generate SEO-friendly meta titles and descriptions from product data." />
              <ToolCard icon={ImageIcon} title="ALT Text Generator" description="Create descriptive, accessibility-friendly image ALT text." />
              <ToolCard icon={Search} title="Keyword Analyzer" description="Analyze focus keywords and content relevance." />
              <ToolCard icon={FileText} title="Sitemap Inspector" description="Check sitemap availability and indexing configuration." />
              <ToolCard icon={ShieldCheck} title="Robots.txt Check" description="Validate crawler access and blocked routes." />
              <ToolCard icon={Globe} title="Canonical Inspector" description="Detect missing or inconsistent canonical URLs." />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* =========================================================
   SCORE RING
========================================================= */

function SeoScoreRing({ score }: { score: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (Math.min(score, 100) / 100) * circumference;

  return (
    <div className="relative w-36 h-36 shrink-0 drop-shadow-2xl">
      <svg width="144" height="144" className="-rotate-90">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="72" cy="72" r={radius} stroke="currentColor" strokeWidth="8" fill="none" className="text-white/5" />
        <motion.circle
          cx="72"
          cy="72"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          className={score >= 80 ? "text-emerald-400" : score >= 60 ? "text-orange-400" : "text-red-400"}
          filter="url(#glow)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progress }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black font-mono text-white tracking-tighter">{score}</span>
        <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

/* =========================================================
   METRIC
========================================================= */

function EngineMetric({
  icon: Icon,
  label,
  value,
  description,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description: string;
  tone: "green" | "blue" | "purple" | "orange";
}) {
  const tones = {
    green: "bg-emerald-500/5 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/40",
    blue: "bg-blue-500/5 text-blue-400 border-blue-500/20 group-hover:border-blue-500/40",
    purple: "bg-purple-500/5 text-purple-400 border-purple-500/20 group-hover:border-purple-500/40",
    orange: "bg-orange-500/5 text-orange-400 border-orange-500/20 group-hover:border-orange-500/40",
  };

  return (
    <motion.div whileHover={{ y: -4 }} className="group bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 shadow-lg transition-colors">
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors ${tones[tone]}`}>
        <Icon size={20} />
      </div>
      <p className="text-[9px] uppercase tracking-widest font-black text-gray-500 mt-6">{label}</p>
      <p className="text-3xl font-bold font-mono text-white mt-1.5 tracking-tight">{value}</p>
      <p className="text-[10px] font-semibold text-gray-600 mt-1">{description}</p>
    </motion.div>
  );
}

/* =========================================================
   ISSUE BREAKDOWN
========================================================= */

function IssueBreakdown({ stats }: { stats: SeoStats }) {
  const issues = [
    { label: "Meta Titles", value: stats.missingMetaTitle, icon: FileText },
    { label: "Meta Descriptions", value: stats.missingMetaDesc, icon: FileText },
    { label: "Image ALT Text", value: stats.missingAltText, icon: ImageIcon },
    { label: "Focus Keywords", value: stats.missingFocusKeyword ?? 0, icon: Target },
    { label: "Canonical URLs", value: stats.missingCanonical ?? 0, icon: Link2 },
  ];

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-7 shadow-lg">
      <div className="flex items-center justify-between mb-7 border-b border-white/5 pb-5">
        <div>
          <h3 className="font-bold text-white text-lg">Issue Breakdown</h3>
          <p className="text-xs font-semibold text-gray-500 mt-1">SEO problems detected by category</p>
        </div>
        <div className="p-3 rounded-full bg-orange-500/10 border border-orange-500/20">
          <AlertTriangle size={20} className="text-orange-400" />
        </div>
      </div>
      <div className="space-y-5">
        {issues.map((issue) => {
          const Icon = issue.icon;
          return (
            <div key={issue.label} className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Icon size={16} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between gap-3 mb-1.5">
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">{issue.label}</span>
                  <span className={`text-[11px] font-black ${issue.value > 0 ? "text-red-400" : "text-emerald-400"}`}>{issue.value}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(issue.value, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-red-400 rounded-full" 
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   COVERAGE
========================================================= */

function CoveragePanel({ indexed, metadata, images }: { indexed: number; metadata: number; images: number }) {
  const rows = [
    { label: "Indexing Status", value: indexed },
    { label: "Metadata Health", value: metadata },
    { label: "Image Optimization", value: images },
  ];

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-7 shadow-lg">
      <div className="flex items-center justify-between mb-7 border-b border-white/5 pb-5">
        <div>
          <h3 className="font-bold text-white text-lg">SEO Coverage</h3>
          <p className="text-xs font-semibold text-gray-500 mt-1">Overall catalog optimization</p>
        </div>
        <div className="p-3 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20">
          <Globe size={20} className="text-[#D4AF37]" />
        </div>
      </div>
      <div className="space-y-6">
        {rows.map((row) => (
          <div key={row.label} className="group">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">{row.label}</span>
              <span className="font-black font-mono text-white">{row.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(row.value, 100)}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className={`h-full rounded-full ${row.value >= 80 ? "bg-emerald-400" : row.value >= 60 ? "bg-orange-400" : "bg-red-400"}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   ACTION CARD
========================================================= */

function ActionCard({ icon: Icon, title, description, onClick }: { icon: LucideIcon; title: string; description: string; onClick: () => void }) {
  return (
    <motion.button type="button" whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} onClick={onClick} className="text-left bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-[#D4AF37]/40 hover:bg-white/[0.02] transition-all group shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="relative z-10 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-colors shadow-sm">
        <Icon size={20} />
      </div>
      <h3 className="font-bold text-base mt-5 group-hover:text-[#D4AF37] transition-colors relative z-10">{title}</h3>
      <p className="text-xs text-gray-400 mt-2 leading-relaxed relative z-10">{description}</p>
      <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-black text-gray-500 group-hover:text-[#D4AF37] mt-5 transition-colors relative z-10">
        Open Utility <ChevronRight size={14} />
      </div>
    </motion.button>
  );
}

/* =========================================================
   TOOL CARD
========================================================= */

function ToolCard({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  const [launching, setLaunching] = useState(false);

  const launch = () => {
    setLaunching(true);
    setTimeout(() => {
      setLaunching(false);
    }, 800);
  };

  return (
    <motion.div whileHover={{ y: -4 }} className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-7 shadow-lg flex flex-col justify-between group">
      <div>
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:bg-[#D4AF37]/10 transition-colors">
          <Icon size={24} strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-sm font-medium text-gray-500 mt-2.5 leading-relaxed">{description}</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        type="button"
        onClick={launch}
        disabled={launching}
        className="mt-8 w-full py-3.5 rounded-xl bg-white/5 hover:bg-[#D4AF37] hover:text-black border border-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {launching ? (
          <><Loader2 size={15} className="animate-spin" /> Launching Workspace...</>
        ) : (
          <>Launch Utility <ArrowRight size={15} /></>
        )}
      </motion.button>
    </motion.div>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`border rounded-xl p-3.5 transition-colors ${highlight ? 'bg-red-500/10 border-red-500/20' : 'bg-white/[0.02] border-white/5'}`}>
      <p className={`text-[8px] font-black uppercase tracking-widest ${highlight ? 'text-red-400' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-sm font-bold font-mono mt-1 ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex items-center gap-4 mb-2">
      <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] shadow-sm">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-bold text-lg text-white">{title}</h3>
        <p className="text-xs font-semibold text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

/* =========================================================
   HEADER BUTTON
========================================================= */

function QuickHeaderButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-sm"
    >
      <Icon size={16} />
      {label}
    </motion.button>
  );
}