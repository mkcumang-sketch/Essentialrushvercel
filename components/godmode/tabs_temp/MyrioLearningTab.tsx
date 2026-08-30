"use client";

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Brain,
  TrendingUp,
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Database,
  ShieldCheck,
  Bot,
  Target,
  BarChart3,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

type ActiveSubTab = "TRENDS" | "TRAINING";

interface RadarItem {
  rank: number;
  model: string;
  brand?: string;
  demandScore: number;
  source: string;
  suggestedPrice?: string;
  reason: string;
}

interface KnowledgeRule {
  _id: string;
  triggerQuery: string;
  responseGuideline: string;
  tone: string;
  category: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  message?: string;
  rules?: KnowledgeRule[];
  radar?: RadarItem[];
  category?: string;
  metadata?: {
    provider?: string;
    model?: string;
    dataType?: string;
    liveExternalData?: boolean;
    generatedAt?: string;
  };
  rule?: KnowledgeRule;
}

interface QuickCategory {
  label: string;
  category: string;
  icon: LucideIcon;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CATEGORY = "Rolex & Luxury Sports";

const QUICK_CATEGORIES: QuickCategory[] = [
  {
    label: "Rolex Sports",
    category: "Rolex Sports",
    icon: TrendingUp,
  },
  {
    label: "Patek & AP",
    category: "Patek Philippe & Audemars Piguet",
    icon: Sparkles,
  },
  {
    label: "Vintage Gold",
    category: "Vintage Gold Luxury Watches",
    icon: Target,
  },
  {
    label: "Minimalist Dress",
    category: "Minimalist Luxury Dress Watches",
    icon: BarChart3,
  },
];

const TONES = [
  "Luxury Concierge",
  "Diplomatic",
  "Assertive",
  "Technical Horologist",
];

const RULE_CATEGORIES = [
  {
    value: "OBJECTION",
    label: "Price / Objections",
  },
  {
    value: "AUTHENTICITY",
    label: "Authenticity / Provenance",
  },
  {
    value: "PRICING",
    label: "Discounts & Wire",
  },
  {
    value: "GENERAL",
    label: "General Concierge",
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function getScoreLabel(score: number): string {
  if (score >= 90) return "Very High";
  if (score >= 75) return "High";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Emerging";
  return "Low";
}

function getScoreWidth(score: number): string {
  const safeScore = Math.max(
    0,
    Math.min(100, score)
  );

  return `${safeScore}%`;
}

function formatDate(value?: string): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function MyrioLearningTab() {
  // --------------------------------------------------------------------------
  // MAIN NAVIGATION
  // --------------------------------------------------------------------------

  const [activeSubTab, setActiveSubTab] =
    useState<ActiveSubTab>("TRENDS");

  // --------------------------------------------------------------------------
  // TREND RADAR
  // --------------------------------------------------------------------------

  const [trendCategory, setTrendCategory] =
    useState(DEFAULT_CATEGORY);

  const [trendRadar, setTrendRadar] =
    useState<RadarItem[]>([]);

  const [loadingTrends, setLoadingTrends] =
    useState(false);

  const [trendError, setTrendError] =
    useState("");

  const [radarMetadata, setRadarMetadata] =
    useState<ApiResponse["metadata"]>();

  // --------------------------------------------------------------------------
  // TRAINING
  // --------------------------------------------------------------------------

  const [rules, setRules] =
    useState<KnowledgeRule[]>([]);

  const [triggerQuery, setTriggerQuery] =
    useState("");

  const [responseGuideline, setResponseGuideline] =
    useState("");

  const [tone, setTone] =
    useState("Luxury Concierge");

  const [category, setCategory] =
    useState("OBJECTION");

  const [isSavingRule, setIsSavingRule] =
    useState(false);

  const [loadingRules, setLoadingRules] =
    useState(false);

  const [ruleError, setRuleError] =
    useState("");

  const [ruleSuccess, setRuleSuccess] =
    useState("");

  const [deletingRuleId, setDeletingRuleId] =
    useState<string | null>(null);

  // ==========================================================================
  // FETCH RULES
  // ==========================================================================

  const fetchRules = useCallback(async () => {
    setLoadingRules(true);
    setRuleError("");

    try {
      const res = await fetch(
        "/api/myrio/learning",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data =
        (await res.json()) as ApiResponse;

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to load MYRIO knowledge."
        );
      }

      setRules(
        Array.isArray(data.rules)
          ? data.rules
          : []
      );
    } catch (error) {
      console.error(
        "MYRIO Knowledge Fetch Error:",
        error
      );

      setRuleError(
        error instanceof Error
          ? error.message
          : "Unable to load learned rules."
      );
    } finally {
      setLoadingRules(false);
    }
  }, []);

  // ==========================================================================
  // TREND RADAR
  // ==========================================================================

  const runTrendRadar = useCallback(
    async (customCategory?: string) => {
      const categoryToScan = (
        customCategory ?? trendCategory
      ).trim();

      if (!categoryToScan) {
        setTrendError(
          "Please enter a category or niche."
        );
        return;
      }

      if (categoryToScan.length > 100) {
        setTrendError(
          "Category must be 100 characters or less."
        );
        return;
      }

      setLoadingTrends(true);
      setTrendError("");
      setTrendRadar([]);
      setRadarMetadata(undefined);

      try {
        const res = await fetch(
          "/api/myrio/learning",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            cache: "no-store",
            body: JSON.stringify({
              action: "TREND_RADAR",
              category: categoryToScan,
            }),
          }
        );

        const data =
          (await res.json()) as ApiResponse;

        if (!res.ok || !data.success) {
          throw new Error(
            data.error ||
              "MYRIO market scan failed."
          );
        }

        if (!Array.isArray(data.radar)) {
          throw new Error(
            "Invalid intelligence data received."
          );
        }

        setTrendRadar(
          data.radar.slice(0, 10)
        );

        setRadarMetadata(
          data.metadata
        );
      } catch (error) {
        console.error(
          "MYRIO Trend Radar Error:",
          error
        );

        setTrendRadar([]);

        setTrendError(
          error instanceof Error
            ? error.message
            : "Unable to scan the market."
        );
      } finally {
        setLoadingTrends(false);
      }
    },
    [trendCategory]
  );

  // ==========================================================================
  // INITIAL LOAD
  // ==========================================================================

  useEffect(() => {
    void fetchRules();
    void runTrendRadar(DEFAULT_CATEGORY);

    // Intentionally run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================================
  // ADD TRAINING RULE
  // ==========================================================================

  const handleAddRule = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const cleanTrigger =
      triggerQuery.trim();

    const cleanGuideline =
      responseGuideline.trim();

    if (!cleanTrigger) {
      setRuleError(
        "Please enter a trigger question."
      );
      return;
    }

    if (!cleanGuideline) {
      setRuleError(
        "Please enter a response guideline."
      );
      return;
    }

    setIsSavingRule(true);
    setRuleError("");
    setRuleSuccess("");

    try {
      const res = await fetch(
        "/api/myrio/learning",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            action: "ADD_RULE",
            triggerQuery: cleanTrigger,
            responseGuideline:
              cleanGuideline,
            tone,
            category,
          }),
        }
      );

      const data =
        (await res.json()) as ApiResponse;

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to train MYRIO."
        );
      }

      setTriggerQuery("");
      setResponseGuideline("");

      setRuleSuccess(
        "New behavioral rule successfully added to MYRIO."
      );

      await fetchRules();

      window.setTimeout(() => {
        setRuleSuccess("");
      }, 4000);
    } catch (error) {
      console.error(
        "MYRIO Rule Creation Error:",
        error
      );

      setRuleError(
        error instanceof Error
          ? error.message
          : "Unable to create training rule."
      );
    } finally {
      setIsSavingRule(false);
    }
  };

  // ==========================================================================
  // DELETE TRAINING RULE
  // ==========================================================================

  const handleDeleteRule = async (
    id: string
  ) => {
    if (!id) return;

    const confirmed =
      window.confirm(
        "Delete this MYRIO behavioral rule?"
      );

    if (!confirmed) return;

    setDeletingRuleId(id);
    setRuleError("");

    try {
      const res = await fetch(
        "/api/myrio/learning",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            action: "DELETE_RULE",
            id,
          }),
        }
      );

      const data =
        (await res.json()) as ApiResponse;

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to delete the rule."
        );
      }

      setRules((previous) =>
        previous.filter(
          (rule) => rule._id !== id
        )
      );
    } catch (error) {
      console.error(
        "MYRIO Rule Delete Error:",
        error
      );

      setRuleError(
        error instanceof Error
          ? error.message
          : "Unable to delete training rule."
      );
    } finally {
      setDeletingRuleId(null);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-8 font-sans text-white pb-24">
      {/* ================================================================== */}
      {/* HEADER                                                             */}
      {/* ================================================================== */}

      <div className="bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-3xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <Brain size={24} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                Empirical Intelligence Hub
              </span>

              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[8px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                MYRIO Active
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-serif font-black mt-1">
              MYRIO Learning Center
            </h2>

            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              Train MYRIO with behavioral knowledge and
              generate AI-based market assessments for
              luxury watch categories.
            </p>
          </div>
        </div>

        {/* SUB TABS */}

        <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl w-full xl:w-auto">
          <button
            type="button"
            onClick={() =>
              setActiveSubTab("TRENDS")
            }
            className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === "TRENDS"
                ? "bg-[#D4AF37] text-black shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <TrendingUp size={14} />
            Trend Radar
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveSubTab("TRAINING")
            }
            className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === "TRAINING"
                ? "bg-[#D4AF37] text-black shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <BookOpen size={14} />
            Training ({rules.length})
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* TREND RADAR TAB                                                    */}
      {/* ================================================================== */}

      {activeSubTab === "TRENDS" && (
        <div className="space-y-6">
          {/* INTRO */}

          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
            <div>
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <Sparkles
                  size={18}
                  className="text-[#D4AF37]"
                />
                Category Market Intelligence
              </h3>

              <p className="text-xs text-gray-400 mt-1">
                Generate a ranked AI assessment for a
                specific luxury category.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void runTrendRadar()
              }
              disabled={loadingTrends}
              className="px-4 py-2.5 bg-white/5 hover:bg-[#D4AF37] hover:text-black border border-white/15 text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                size={13}
                className={
                  loadingTrends
                    ? "animate-spin"
                    : ""
                }
              />

              {loadingTrends
                ? "Analyzing..."
                : "Re-Scan"}
            </button>
          </div>

          {/* CATEGORY SEARCH */}

          <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Search
                size={15}
                className="text-[#D4AF37]"
              />

              <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                Target Category / Niche
              </label>
            </div>

            <div className="flex flex-col lg:flex-row gap-3">
              <input
                type="text"
                value={trendCategory}
                maxLength={100}
                onChange={(e) =>
                  setTrendCategory(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !loadingTrends
                  ) {
                    void runTrendRadar();
                  }
                }}
                placeholder="e.g. Rolex, Chronographs, Dress Watches, Vintage Divers"
                className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 outline-none focus:border-[#D4AF37] transition-colors"
              />

              <button
                type="button"
                onClick={() =>
                  void runTrendRadar()
                }
                disabled={
                  loadingTrends ||
                  !trendCategory.trim()
                }
                className="px-6 py-3 bg-[#D4AF37] hover:bg-white text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search
                  size={14}
                  className={
                    loadingTrends
                      ? "animate-spin"
                      : ""
                  }
                />

                {loadingTrends
                  ? "Scanning..."
                  : "Analyze Top 10"}
              </button>
            </div>

            {/* QUICK CATEGORIES */}

            <div className="flex gap-2 flex-wrap mt-4">
              {QUICK_CATEGORIES.map(
                (item) => {
                  const Icon =
                    item.icon;

                  return (
                    <button
                      key={item.category}
                      type="button"
                      onClick={() => {
                        setTrendCategory(
                          item.category
                        );

                        void runTrendRadar(
                          item.category
                        );
                      }}
                      disabled={
                        loadingTrends
                      }
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 text-[10px] font-bold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Icon
                        size={11}
                        className="text-[#D4AF37]"
                      />

                      {item.label}
                    </button>
                  );
                }
              )}
            </div>

            {/* ERROR */}

            {trendError && (
              <div className="mt-4 flex items-start gap-2 text-[10px] text-red-400 border border-red-500/20 bg-red-500/5 rounded-xl px-3 py-3">
                <AlertTriangle
                  size={14}
                  className="shrink-0 mt-0.5"
                />

                <span>
                  {trendError}
                </span>
              </div>
            )}
          </div>

          {/* INTELLIGENCE STATUS */}

          {radarMetadata && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/[0.025] border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Bot size={13} />
                  <span className="text-[9px] uppercase tracking-widest">
                    Provider
                  </span>
                </div>

                <p className="text-xs text-white font-bold mt-2">
                  {radarMetadata.provider ||
                    "AI"}
                </p>
              </div>

              <div className="bg-white/[0.025] border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Database size={13} />
                  <span className="text-[9px] uppercase tracking-widest">
                    Data Type
                  </span>
                </div>

                <p className="text-xs text-white font-bold mt-2">
                  AI Market Assessment
                </p>
              </div>

              <div className="bg-white/[0.025] border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <ShieldCheck size={13} />
                  <span className="text-[9px] uppercase tracking-widest">
                    Live Verification
                  </span>
                </div>

                <p className="text-xs text-amber-400 font-bold mt-2">
                  External data not connected
                </p>
              </div>
            </div>
          )}

          {/* RADAR RESULTS */}

          {loadingTrends ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({
                length: 6,
              }).map((_, index) => (
                <div
                  key={index}
                  className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 animate-pulse"
                >
                  <div className="flex justify-between">
                    <div className="h-7 w-10 bg-white/10 rounded-lg" />
                    <div className="h-6 w-28 bg-white/10 rounded-full" />
                  </div>

                  <div className="h-5 w-2/3 bg-white/10 rounded mt-5" />

                  <div className="h-3 w-full bg-white/5 rounded mt-4" />
                  <div className="h-3 w-4/5 bg-white/5 rounded mt-2" />

                  <div className="h-1.5 w-full bg-white/5 rounded mt-5" />
                </div>
              ))}
            </div>
          ) : trendRadar.length === 0 ? (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-10 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                <BarChart3 size={24} />
              </div>

              <h4 className="text-sm font-bold text-white mt-4">
                No Market Intelligence Yet
              </h4>

              <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto">
                Enter a luxury category above and
                ask MYRIO to generate a market
                assessment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trendRadar.map(
                (item, idx) => {
                  const score = Math.max(
                    0,
                    Math.min(
                      100,
                      Number(
                        item.demandScore
                      ) || 0
                    )
                  );

                  return (
                    <div
                      key={`${item.model}-${idx}`}
                      className="group bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 hover:border-[#D4AF37]/40 hover:bg-[#0d0d0d] transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-3">
                          <span className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-mono font-bold">
                            #
                            {item.rank ||
                              idx + 1}
                          </span>

                          <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap">
                            {score}/100
                          </span>
                        </div>

                        <div className="mt-4">
                          <h4 className="text-base font-bold text-white font-serif">
                            {item.model}
                          </h4>

                          {item.brand && (
                            <p className="text-[10px] text-[#D4AF37] uppercase tracking-widest mt-1">
                              {item.brand}
                            </p>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                          {item.reason}
                        </p>

                        {/* SCORE */}

                        <div className="mt-5">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[8px] uppercase tracking-widest text-gray-600">
                              Estimated Demand
                            </span>

                            <span className="text-[9px] text-gray-500">
                              {getScoreLabel(
                                score
                              )}
                            </span>
                          </div>

                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#D4AF37] rounded-full transition-all duration-700"
                              style={{
                                width:
                                  getScoreWidth(
                                    score
                                  ),
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                        <div>
                          <span className="text-[8px] text-gray-600 uppercase tracking-widest block">
                            Assessment Source
                          </span>

                          <span className="text-[9px] text-gray-400 mt-1 block">
                            {item.source ||
                              "AI Market Assessment"}
                          </span>
                        </div>

                        {item.suggestedPrice && (
                          <div className="sm:text-right">
                            <span className="text-[8px] text-gray-600 uppercase tracking-widest block">
                              Indicative Price
                            </span>

                            <span className="font-mono text-[#D4AF37] font-bold text-xs mt-1 block">
                              {
                                item.suggestedPrice
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {/* DISCLAIMER */}

          {trendRadar.length > 0 && (
            <div className="flex items-start gap-2 p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/10">
              <AlertTriangle
                size={14}
                className="text-amber-400 shrink-0 mt-0.5"
              />

              <p className="text-[10px] text-gray-500 leading-relaxed">
                <span className="text-amber-400 font-bold">
                  Intelligence notice:
                </span>{" "}
                Demand scores and pricing shown here are
                AI-generated assessments, not verified
                live Google Trends, Amazon, Chrono24,
                auction, or sales-database measurements.
                Connect verified external data sources
                before using these figures for financial,
                purchasing, or pricing decisions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* TRAINING TAB                                                       */}
      {/* ================================================================== */}

      {activeSubTab === "TRAINING" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8">
          {/* ---------------------------------------------------------------- */}
          {/* TEACH MYRIO                                                      */}
          {/* ---------------------------------------------------------------- */}

          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl h-fit">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                <Zap
                  size={17}
                  className="text-[#D4AF37]"
                />
              </div>

              <div>
                <h3 className="text-base font-bold">
                  Teach MYRIO New Behavior
                </h3>

                <p className="text-[10px] text-gray-400">
                  Add durable response rules to MYRIO&apos;s
                  knowledge layer.
                </p>
              </div>
            </div>

            {/* SUCCESS */}

            {ruleSuccess && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[10px]">
                <CheckCircle2
                  size={14}
                  className="shrink-0"
                />

                <span>
                  {ruleSuccess}
                </span>
              </div>
            )}

            {/* ERROR */}

            {ruleError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 text-[10px]">
                <AlertTriangle
                  size={14}
                  className="shrink-0"
                />

                <span>
                  {ruleError}
                </span>
              </div>
            )}

            <form
              onSubmit={handleAddRule}
              className="space-y-5"
            >
              {/* TRIGGER */}

              <div>
                <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1.5 font-bold">
                  User Question / Trigger
                </label>

                <input
                  type="text"
                  value={triggerQuery}
                  maxLength={500}
                  onChange={(e) =>
                    setTriggerQuery(
                      e.target.value
                    )
                  }
                  placeholder='e.g. "Can I negotiate the price?"'
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>

              {/* GUIDELINE */}

              <div>
                <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1.5 font-bold">
                  MYRIO Response Guideline
                </label>

                <textarea
                  rows={5}
                  maxLength={2000}
                  value={
                    responseGuideline
                  }
                  onChange={(e) =>
                    setResponseGuideline(
                      e.target.value
                    )
                  }
                  placeholder="Define exactly how MYRIO should respond..."
                  className="w-full resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 outline-none focus:border-[#D4AF37] transition-colors leading-relaxed"
                />

                <div className="text-right text-[8px] text-gray-600 mt-1">
                  {
                    responseGuideline.length
                  }
                  / 2000
                </div>
              </div>

              {/* TONE + CATEGORY */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1.5 font-bold">
                    Tone
                  </label>

                  <select
                    value={tone}
                    onChange={(e) =>
                      setTone(
                        e.target.value
                      )
                    }
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                  >
                    {TONES.map(
                      (toneOption) => (
                        <option
                          key={
                            toneOption
                          }
                          value={
                            toneOption
                          }
                        >
                          {toneOption}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1.5 font-bold">
                    Category
                  </label>

                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(
                        e.target.value
                      )
                    }
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                  >
                    {RULE_CATEGORIES.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={
                  isSavingRule ||
                  !triggerQuery.trim() ||
                  !responseGuideline.trim()
                }
                className="w-full py-3.5 bg-[#D4AF37] hover:bg-white text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingRule ? (
                  <>
                    <RefreshCw
                      size={14}
                      className="animate-spin"
                    />
                    Injecting Knowledge...
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    Train MYRIO AI
                  </>
                )}
              </button>
            </form>

            {/* INFO */}

            <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/5">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={13}
                  className="text-[#D4AF37]"
                />

                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  Persistent Knowledge
                </span>
              </div>

              <p className="text-[10px] text-gray-600 leading-relaxed mt-2">
                These rules are stored in the MYRIO
                knowledge database and can be used by
                the MYRIO response system when building
                future answers.
              </p>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* RULE LIST                                                        */}
          {/* ---------------------------------------------------------------- */}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                  <BookOpen
                    size={15}
                    className="text-[#D4AF37]"
                  />
                  Learned Behavioral Rules
                </h3>

                <p className="text-[10px] text-gray-600 mt-1">
                  {rules.length} stored rule
                  {rules.length === 1
                    ? ""
                    : "s"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void fetchRules()
                }
                disabled={loadingRules}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-[#D4AF37]/40 transition-all disabled:opacity-50"
                title="Refresh rules"
              >
                <RefreshCw
                  size={14}
                  className={
                    loadingRules
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>
            </div>

            {/* LOADING */}

            {loadingRules ? (
              <div className="space-y-3">
                {Array.from({
                  length: 3,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 animate-pulse"
                  >
                    <div className="h-5 w-32 bg-white/10 rounded-full" />
                    <div className="h-4 w-4/5 bg-white/5 rounded mt-5" />
                    <div className="h-3 w-full bg-white/5 rounded mt-3" />
                    <div className="h-3 w-2/3 bg-white/5 rounded mt-2" />
                  </div>
                ))}
              </div>
            ) : rules.length === 0 ? (
              <div className="p-10 border border-white/10 rounded-3xl bg-white/[0.02] text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                  <Brain
                    size={20}
                    className="text-[#D4AF37]"
                  />
                </div>

                <h4 className="text-xs font-bold text-white mt-4">
                  MYRIO Has No Custom Rules Yet
                </h4>

                <p className="text-[10px] text-gray-600 mt-2 max-w-sm mx-auto">
                  Add your first behavioral rule to
                  teach MYRIO how your business wants
                  specific situations handled.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule._id}
                    className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 hover:border-[#D4AF37]/30 transition-all"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-[9px] font-bold uppercase tracking-wider">
                          {rule.category ||
                            "GENERAL"}
                        </span>

                        <span className="px-2.5 py-1 rounded-full bg-white/5 text-gray-400 text-[9px] font-bold">
                          {rule.tone ||
                            "Luxury Concierge"}
                        </span>

                        {rule.isActive !==
                          false && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void handleDeleteRule(
                            rule._id
                          )
                        }
                        disabled={
                          deletingRuleId ===
                          rule._id
                        }
                        className="p-1.5 shrink-0 text-gray-600 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete rule"
                      >
                        {deletingRuleId ===
                        rule._id ? (
                          <RefreshCw
                            size={14}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2
                            size={14}
                          />
                        )}
                      </button>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-bold text-white leading-relaxed">
                        <span className="text-gray-600">
                          When asked:
                        </span>{" "}
                        &quot;
                        {
                          rule.triggerQuery
                        }
                        &quot;
                      </p>

                      <div className="mt-3 p-3 rounded-xl bg-white/[0.025] border border-white/5">
                        <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1.5">
                          MYRIO Guideline
                        </p>

                        <p className="text-xs text-gray-400 leading-relaxed">
                          {
                            rule.responseGuideline
                          }
                        </p>
                      </div>
                    </div>

                    {rule.createdAt && (
                      <div className="mt-3 text-[8px] text-gray-700 font-mono">
                        Added{" "}
                        {formatDate(
                          rule.createdAt
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}