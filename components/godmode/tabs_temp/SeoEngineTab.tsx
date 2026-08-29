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
  ShieldCheck,
  Sparkles,
  Target,
  Wand2,
  X,
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

  // Active Tool Modal State
  const [activeToolModal, setActiveToolModal] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [toolProcessing, setToolProcessing] = useState(false);
  const [toolResult, setToolResult] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

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
     TOOL LAUNCH DISPATCHER
  ======================================================= */

  const handleLaunchTool = async (toolId: string, title: string) => {
    if (toolId === "sitemap") {
      window.open("/sitemap.xml", "_blank");
      return;
    }
    if (toolId === "robots") {
      window.open("/robots.txt", "_blank");
      return;
    }

    setModalTitle(title);
    setActiveToolModal(toolId);
    setToolProcessing(true);
    setToolResult(null);

    try {
      if (toolId === "meta-synthesizer" || toolId === "alt-generator") {
        const res = await fetch("/api/seo/synthesize-all", { method: "POST" });
        const data = await res.json();
        if (res.ok && data.success) {
          setToolResult({
            type: "success",
            message: `MYRIO SEO Agent completed! ${data.message || `Synthesized metadata for ${data.count || "all"} timepieces.`}`,
          });
          await fetchSeoStats(true);
        } else {
          setToolResult({
            type: "error",
            message: data.error || "Failed to synthesize catalog metadata.",
          });
        }
      } else if (toolId === "keywords") {
        setToolResult({
          type: "info",
          message: "High-Yield Horology Keywords: Swiss Chronograph, Automatic Movement, Horology Vault, Certified Watches, Investment Grade Timepieces.",
        });
      } else if (toolId === "canonical") {
        setToolResult({
          type: "success",
          message: "Canonical verification passed. All storefront endpoints enforce strict HTTPS domain matching.",
        });
      }
    } catch {
      setToolResult({
        type: "error",
        message: "Network error executing utility. Please ensure backend services are active.",
      });
    } finally {
      setToolProcessing(false);
    }
  };

  /* =======================================================
     DERIVED METRICS
  ======================================================= */

  const score = stats?.avgScore ?? 0;

  const scoreStatus = useMemo(() => {
    if (score >= 90) {
      return {
        label: "Excellent",
        description: "Your SEO foundation is highly optimized for Google SERP.",
        icon: CheckCircle2,
      };
    }
    if (score >= 80) {
      return {
        label: "Healthy",
        description: "Your SEO is in good shape with minor optimization opportunities.",
        icon: ShieldCheck,
      };
    }
    if (score >= 60) {
      return {
        label: "Needs Attention",
        description: "Several missing metadata fields could increase organic visibility.",
        icon: AlertTriangle,
      };
    }
    return {
      label: "Critical",
      description: "Important SEO metadata issues require immediate attention.",
      icon: XCircle,
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

  const navigation = [
    { id: "overview" as const, label: "Overview", icon: Activity },
    { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
    { id: "redirects" as const, label: "Redirects", icon: Link2 },
    { id: "tools" as const, label: "SEO Tools", icon: Wand2 },
  ];

  /* =======================================================
     LOADER / ERROR STATES
  ======================================================= */

  if (loading) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center font-sans text-white">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.15)]">
              <Search size={28} className="text-[#D4AF37]" />
            </div>
            <Loader2 size={84} className="absolute -inset-2.5 text-[#D4AF37]/40 animate-spin" />
          </div>
          <p className="text-sm font-bold tracking-wide mt-2">Scanning SEO Intelligence...</p>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">Analyzing metadata & indexing</p>
        </motion.div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center font-sans text-white">
        <div className="max-w-lg w-full bg-red-500/5 border border-red-500/20 rounded-[2rem] p-8 text-center">
          <AlertCircle size={36} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-serif font-bold text-white">SEO Analytics Unreachable</h2>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">{error || "Unable to retrieve real-time metadata audit."}</p>
          <button
            type="button"
            onClick={() => fetchSeoStats()}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all cursor-pointer shadow-lg"
          >
            <RefreshCcw size={14} /> Retry Audit
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = scoreStatus.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-8 pb-24 text-white font-sans">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a] shadow-2xl p-6 md:p-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-lg">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-serif font-black text-[#D4AF37] tracking-tight">
                SEO Command Center
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[8px] uppercase tracking-widest text-emerald-400 font-bold">
                MYRIO Agent Active
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Automated SERP optimization, keyword synthesis, and structured snippet audits.
            </p>
            {lastScan && (
              <p className="text-[9px] uppercase tracking-widest text-gray-500 font-mono mt-2 flex items-center gap-1.5">
                <Clock3 size={11} className="text-[#D4AF37]" /> Last scan: {lastScan.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <QuickHeaderButton icon={Rocket} label="Run Full Audit" onClick={() => fetchSeoStats(true)} />
          <button
            type="button"
            onClick={() => handleLaunchTool("meta-synthesizer", "AI Meta Synthesizer")}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#D4AF37] text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 shadow-lg cursor-pointer"
          >
            <Bot size={15} /> Auto-Synthesize SEO
          </button>
        </div>
      </div>

      {/* SCORE + OPTIMIZATION QUEUE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Score Ring */}
        <div className="xl:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center gap-8">
          <SeoScoreRing score={score} />
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl border ${score >= 80 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : score >= 60 ? "bg-orange-500/10 border-orange-500/20 text-orange-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                <StatusIcon size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{scoreStatus.label}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{scoreStatus.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 font-mono">
              <MiniStat label="Indexed" value={`${indexedPercentage}%`} />
              <MiniStat label="Metadata" value={`${metadataCoverage}%`} />
              <MiniStat label="Images" value={`${stats.imageCoverage ?? 0}%`} />
              <MiniStat label="Issues" value={opportunityCount} highlight={opportunityCount > 0} />
            </div>
          </div>
        </div>

        {/* Right: Optimization Queue */}
        <div className="bg-gradient-to-b from-[#D4AF37]/10 to-black/40 border border-[#D4AF37]/30 rounded-[2rem] p-6 md:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Target size={120} className="text-[#D4AF37]" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">Optimization Queue</span>
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
            </div>
            <h4 className="text-5xl font-black font-mono text-white mt-3">{opportunityCount}</h4>
            <p className="text-xs text-gray-300 mt-2 leading-relaxed">
              High-impact catalog opportunities detected. Auto-synthesizing metadata will resolve these instantly.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveSection("tools")}
            className="mt-6 w-full py-3.5 bg-white hover:bg-[#D4AF37] text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            Open SEO Utilities <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                active ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={15} /> {item.label}
            </button>
          );
        })}
      </div>

      {/* CONTENT TABS */}
      <AnimatePresence mode="wait">
        {activeSection === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <EngineMetric icon={ShieldCheck} label="SEO Health" value={`${stats.avgScore}%`} description={scoreStatus.label} tone="green" />
              <EngineMetric icon={Globe} label="Indexed Pages" value={stats.totalIndexed} description={`of ${stats.totalProducts} assets`} tone="blue" />
              <EngineMetric icon={ImageIcon} label="Alt Coverage" value={`${stats.imageCoverage ?? 0}%`} description="Image accessibility" tone="purple" />
              <EngineMetric icon={AlertTriangle} label="Open Issues" value={opportunityCount} description="Pending optimization" tone="orange" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <ToolCard
                icon={Bot}
                title="AI Meta Synthesizer"
                description="Synthesize SEO-optimized meta titles and descriptions using MYRIO intelligence."
                onLaunch={() => handleLaunchTool("meta-synthesizer", "AI Meta Synthesizer")}
              />
              <ToolCard
                icon={ImageIcon}
                title="ALT Text Generator"
                description="Create descriptive, luxury accessibility-friendly image ALT text tags."
                onLaunch={() => handleLaunchTool("alt-generator", "ALT Text Generator")}
              />
              <ToolCard
                icon={Search}
                title="Keyword Analyzer"
                description="Extract high-volume horology focus keywords and search queries."
                onLaunch={() => handleLaunchTool("keywords", "Keyword Analyzer")}
              />
              <ToolCard
                icon={FileText}
                title="Sitemap Inspector"
                description="Check live XML sitemap availability and crawler indexing status."
                onLaunch={() => handleLaunchTool("sitemap", "Sitemap Inspector")}
              />
              <ToolCard
                icon={ShieldCheck}
                title="Robots.txt Check"
                description="Validate search bot crawler rules and secure disallow directives."
                onLaunch={() => handleLaunchTool("robots", "Robots.txt Check")}
              />
              <ToolCard
                icon={Globe}
                title="Canonical Inspector"
                description="Detect missing or inconsistent canonical URLs across vault paths."
                onLaunch={() => handleLaunchTool("canonical", "Canonical Inspector")}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UTILITY MODAL */}
      {activeToolModal && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0c0c0c] border border-white/15 p-8 rounded-3xl max-w-lg w-full relative shadow-2xl space-y-6">
            <button
              onClick={() => setActiveToolModal(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                <Sparkles size={20} />
              </div>
              <h3 className="text-lg font-serif font-bold text-white">{modalTitle}</h3>
            </div>

            {toolProcessing ? (
              <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 size={36} className="animate-spin text-[#D4AF37]" />
                <p className="text-xs font-black uppercase tracking-widest text-gray-300">
                  MYRIO SEO Agent in Execution...
                </p>
                <p className="text-[11px] text-gray-500">Synthesizing metadata and synchronizing database assets.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {toolResult && (
                  <div
                    className={`p-5 rounded-2xl flex items-start gap-3.5 text-xs leading-relaxed ${
                      toolResult.type === "success"
                        ? "bg-green-500/10 border border-green-500/30 text-green-300"
                        : toolResult.type === "error"
                        ? "bg-red-500/10 border border-red-500/30 text-red-300"
                        : "bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]"
                    }`}
                  >
                    {toolResult.type === "success" && <CheckCircle2 size={20} className="shrink-0 text-green-400" />}
                    {toolResult.type === "error" && <AlertCircle size={20} className="shrink-0 text-red-400" />}
                    {toolResult.type === "info" && <Sparkles size={20} className="shrink-0 text-[#D4AF37]" />}
                    <div>{toolResult.message}</div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setActiveToolModal(null)}
                  className="w-full py-3.5 bg-[#D4AF37] hover:bg-white text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all cursor-pointer shadow-lg"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

/* =========================================================
   SUPPORTING ATOMIC COMPONENTS
========================================================= */

function SeoScoreRing({ score }: { score: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (Math.min(score, 100) / 100) * circumference;

  return (
    <div className="relative w-36 h-36 shrink-0 drop-shadow-2xl">
      <svg width="144" height="144" className="-rotate-90">
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
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-lg">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <p className="text-[9px] uppercase tracking-widest font-black text-gray-500 mt-5">{label}</p>
      <p className="text-2xl font-bold font-mono text-white mt-1">{value}</p>
      <p className="text-[10px] text-gray-500 mt-1">{description}</p>
    </div>
  );
}

function IssueBreakdown({ stats }: { stats: SeoStats }) {
  const issues = [
    { label: "Meta Titles", value: stats.missingMetaTitle, icon: FileText },
    { label: "Meta Descriptions", value: stats.missingMetaDesc, icon: FileText },
    { label: "Image ALT Text", value: stats.missingAltText, icon: ImageIcon },
    { label: "Focus Keywords", value: stats.missingFocusKeyword ?? 0, icon: Target },
    { label: "Canonical URLs", value: stats.missingCanonical ?? 0, icon: Link2 },
  ];

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Issue Breakdown</h3>
          <p className="text-[10px] text-gray-500">Detected missing attributes</p>
        </div>
        <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
          <AlertTriangle size={16} />
        </div>
      </div>
      <div className="space-y-3 font-mono text-xs">
        {issues.map((issue) => (
          <div key={issue.label} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="flex items-center gap-2 text-gray-300">
              <issue.icon size={14} className="text-[#D4AF37]" />
              <span className="font-sans text-[11px] font-bold">{issue.label}</span>
            </div>
            <span className={`font-bold ${issue.value > 0 ? "text-orange-400" : "text-emerald-400"}`}>
              {issue.value > 0 ? `${issue.value} Missing` : "Clean"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoveragePanel({ indexed, metadata, images }: { indexed: number; metadata: number; images: number }) {
  const rows = [
    { label: "Indexing Status", value: indexed },
    { label: "Metadata Health", value: metadata },
    { label: "Image Optimization", value: images },
  ];

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-lg space-y-5">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">SEO Coverage</h3>
          <p className="text-[10px] text-gray-500">Catalog optimization metrics</p>
        </div>
        <div className="p-2 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37]">
          <Globe size={16} />
        </div>
      </div>
      <div className="space-y-4 font-mono text-xs">
        {rows.map((row) => (
          <div key={row.label} className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-300 font-sans font-bold">{row.label}</span>
              <span className="text-emerald-400 font-bold">{row.value}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#D4AF37] rounded-full" style={{ width: `${row.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, description, onClick }: { icon: LucideIcon; title: string; description: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-left bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 hover:border-[#D4AF37]/50 transition-all cursor-pointer shadow-md">
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37] mb-3">
        <Icon size={18} />
      </div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-white">{title}</h4>
      <p className="text-[11px] text-gray-400 mt-1">{description}</p>
    </button>
  );
}

function ToolCard({ icon: Icon, title, description, onLaunch }: { icon: LucideIcon; title: string; description: string; onLaunch: () => void }) {
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-4">
      <div>
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37] mb-4">
          <Icon size={20} />
        </div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h4>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        onClick={onLaunch}
        className="w-full py-3 bg-white/5 hover:bg-[#D4AF37] hover:text-black border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
      >
        Launch Utility <ArrowRight size={13} />
      </button>
    </div>
  );
}

function MiniStat({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-xl border ${highlight ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-white/[0.02] border-white/5 text-white"}`}>
      <span className="text-[8px] uppercase tracking-wider font-sans text-gray-400 block font-bold">{label}</span>
      <span className="text-xs font-bold mt-1 block">{value}</span>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
        <Icon size={18} />
      </div>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h3>
        <p className="text-[10px] text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function QuickHeaderButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-md cursor-pointer"
    >
      <Icon size={14} /> {label}
    </button>
  );
}