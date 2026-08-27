"use client";

import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import Link from "next/link";

import {
    AlertCircle,
    AlertTriangle,
    BarChart3,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    CircleCheck,
    Clock3,
    Globe,
    Image as ImageIcon,
    Link as LinkIcon,
    RefreshCcw,
    Search,
    ShieldCheck,
    Sparkles,
    Target,
    TrendingUp,
    Type,
    X,
    Zap,
} from "lucide-react";

/* ==========================================================================
   TYPES
   ========================================================================== */

interface SeoIssues {
    title: boolean;
    desc: boolean;
    alt: boolean;
}

interface AttentionItem {
    id: string;
    name: string;
    score: number;
    issues: SeoIssues;
}

interface SeoStats {
    avgScore: number;
    totalIndexed: number;
    missingMetaTitle: number;
    missingMetaDesc: number;
    missingAltText: number;
    needsAttention: AttentionItem[];
}

type FilterType =
    | "all"
    | "critical"
    | "metadata"
    | "images"
    | "healthy";

type SortType =
    | "score"
    | "name";

interface ApiResponse {
    success?: boolean;
    data?: SeoStats;
    message?: string;
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function SeoAnalyticsDashboard() {
    const [stats, setStats] =
        useState<SeoStats | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [search, setSearch] =
        useState("");

    const [filter, setFilter] =
        useState<FilterType>("all");

    const [sort, setSort] =
        useState<SortType>("score");

    const [showAll, setShowAll] =
        useState(false);

    const [autoRefresh, setAutoRefresh] =
        useState(false);

    const [lastUpdated, setLastUpdated] =
        useState<Date | null>(null);

    /* ----------------------------------------------------------------------
       FETCH SEO DATA
       ---------------------------------------------------------------------- */

    const fetchSeoStats = useCallback(
        async (silent = false) => {
            if (!silent) {
                setLoading(true);
            }

            setRefreshing(true);
            setError(null);

            const controller =
                new AbortController();

            const timeout = setTimeout(() => {
                controller.abort();
            }, 15000);

            try {
                const response = await fetch(
                    "/api/seo/analytics",
                    {
                        method: "GET",
                        cache: "no-store",
                        signal: controller.signal,
                        headers: {
                            Accept:
                                "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `SEO API returned ${response.status}`
                    );
                }

                const json: ApiResponse =
                    await response.json();

                if (!json.success || !json.data) {
                    throw new Error(
                        json.message ||
                            "Invalid SEO analytics response"
                    );
                }

                setStats({
                    ...json.data,
                    needsAttention:
                        Array.isArray(
                            json.data.needsAttention
                        )
                            ? json.data.needsAttention
                            : [],
                });

                setLastUpdated(new Date());
            } catch (err) {
                console.error(
                    "Failed to load SEO stats:",
                    err
                );

                if (
                    err instanceof DOMException &&
                    err.name === "AbortError"
                ) {
                    setError(
                        "SEO analytics request timed out."
                    );
                } else {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load SEO analytics."
                    );
                }
            } finally {
                clearTimeout(timeout);
                setLoading(false);
                setRefreshing(false);
            }

            return () => {
                controller.abort();
            };
        },
        []
    );

    /* ----------------------------------------------------------------------
       INITIAL FETCH
       ---------------------------------------------------------------------- */

    useEffect(() => {
        fetchSeoStats();
    }, [fetchSeoStats]);

    /* ----------------------------------------------------------------------
       AUTO REFRESH
       ---------------------------------------------------------------------- */

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchSeoStats(true);
        }, 60_000);

        return () => clearInterval(interval);
    }, [autoRefresh, fetchSeoStats]);

    /* ----------------------------------------------------------------------
       DERIVED DATA
       ---------------------------------------------------------------------- */

    const attentionItems =
        stats?.needsAttention || [];

    const criticalCount = useMemo(() => {
        return attentionItems.filter(
            (item) => item.score < 50
        ).length;
    }, [attentionItems]);

    const warningCount = useMemo(() => {
        return attentionItems.filter(
            (item) =>
                item.score >= 50 &&
                item.score < 80
        ).length;
    }, [attentionItems]);

    const healthyCount = useMemo(() => {
        return attentionItems.filter(
            (item) => item.score >= 80
        ).length;
    }, [attentionItems]);

    const metadataIssues = useMemo(() => {
        return attentionItems.filter(
            (item) =>
                item.issues.title ||
                item.issues.desc
        ).length;
    }, [attentionItems]);

    const imageIssues = useMemo(() => {
        return attentionItems.filter(
            (item) => item.issues.alt
        ).length;
    }, [attentionItems]);

    /* ----------------------------------------------------------------------
       FILTER + SEARCH + SORT
       ---------------------------------------------------------------------- */

    const filteredItems = useMemo(() => {
        let items = [...attentionItems];

        if (search.trim()) {
            const query =
                search.toLowerCase();

            items = items.filter((item) =>
                item.name
                    .toLowerCase()
                    .includes(query)
            );
        }

        switch (filter) {
            case "critical":
                items = items.filter(
                    (item) => item.score < 50
                );
                break;

            case "metadata":
                items = items.filter(
                    (item) =>
                        item.issues.title ||
                        item.issues.desc
                );
                break;

            case "images":
                items = items.filter(
                    (item) => item.issues.alt
                );
                break;

            case "healthy":
                items = items.filter(
                    (item) => item.score >= 80
                );
                break;

            default:
                break;
        }

        items.sort((a, b) => {
            if (sort === "name") {
                return a.name.localeCompare(
                    b.name
                );
            }

            return a.score - b.score;
        });

        return showAll
            ? items
            : items.slice(0, 8);
    }, [
        attentionItems,
        search,
        filter,
        sort,
        showAll,
    ]);

    /* ----------------------------------------------------------------------
       HEALTH STATUS
       ---------------------------------------------------------------------- */

    const healthStatus = useMemo(() => {
        const score = stats?.avgScore || 0;

        if (score >= 90) {
            return {
                label: "Excellent",
                color: "text-green-600",
                bg: "bg-green-50",
                border:
                    "border-green-200",
            };
        }

        if (score >= 80) {
            return {
                label: "Healthy",
                color: "text-green-600",
                bg: "bg-green-50",
                border:
                    "border-green-200",
            };
        }

        if (score >= 60) {
            return {
                label: "Needs Work",
                color: "text-orange-600",
                bg: "bg-orange-50",
                border:
                    "border-orange-200",
            };
        }

        return {
            label: "Critical",
            color: "text-red-600",
            bg: "bg-red-50",
            border:
                "border-red-200",
        };
    }, [stats?.avgScore]);

    /* ----------------------------------------------------------------------
       LOADING
       ---------------------------------------------------------------------- */

    if (loading) {
        return <SeoDashboardSkeleton />;
    }

    /* ----------------------------------------------------------------------
       ERROR
       ---------------------------------------------------------------------- */

    if (error && !stats) {
        return (
            <SeoErrorState
                error={error}
                retry={() =>
                    fetchSeoStats()
                }
            />
        );
    }

    if (!stats) return null;

    /* ----------------------------------------------------------------------
       UI
       ---------------------------------------------------------------------- */

    return (
        <div className="w-full space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ==============================================================
               HEADER
               ============================================================== */}

            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">

                <div>
                    <div className="flex items-center gap-3">

                        <div className="w-11 h-11 rounded-2xl bg-black flex items-center justify-center shadow-lg">
                            <BarChart3
                                size={20}
                                className="text-white"
                            />
                        </div>

                        <div>
                            <h2 className="text-3xl md:text-4xl font-serif font-black italic tracking-tighter text-black">
                                SEO Command Center
                            </h2>

                            <p className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-[0.25em] mt-1">
                                Search visibility intelligence
                            </p>
                        </div>
                    </div>

                    {lastUpdated && (
                        <div className="flex items-center gap-2 mt-4 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                            <Clock3 size={11} />

                            Updated{" "}
                            {lastUpdated.toLocaleTimeString(
                                [],
                                {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                }
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">

                    {/* Auto refresh */}
                    <button
                        type="button"
                        onClick={() =>
                            setAutoRefresh(
                                (previous) =>
                                    !previous
                            )
                        }
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                            autoRefresh
                                ? "bg-green-50 border-green-200 text-green-600"
                                : "bg-white border-gray-200 text-gray-500"
                        }`}
                    >
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${
                                autoRefresh
                                    ? "bg-green-500 animate-pulse"
                                    : "bg-gray-300"
                            }`}
                        />

                        Auto Refresh
                    </button>

                    {/* Refresh */}
                    <button
                        type="button"
                        onClick={() =>
                            fetchSeoStats()
                        }
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-black text-white hover:bg-[#D4AF37] hover:text-black disabled:opacity-50 text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                        <RefreshCcw
                            size={13}
                            className={
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        Refresh
                    </button>
                </div>
            </div>

            {/* ==============================================================
               TOP HEALTH PANEL
               ============================================================== */}

            <div className="grid lg:grid-cols-[1fr_320px] gap-6">

                {/* Score */}
                <div className="relative overflow-hidden bg-black rounded-[2.5rem] p-7 md:p-10 text-white">

                    <div className="absolute -right-20 -top-20 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl" />

                    <div className="relative flex flex-col md:flex-row md:items-center gap-8">

                        <ScoreRing
                            score={stats.avgScore}
                        />

                        <div className="flex-1">

                            <div className="flex items-center gap-2 mb-3">
                                <ShieldCheck
                                    size={16}
                                    className="text-[#D4AF37]"
                                />

                                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-500">
                                    Overall Site Health
                                </span>
                            </div>

                            <h3 className="text-2xl md:text-3xl font-serif font-black italic">
                                {healthStatus.label}
                            </h3>

                            <p className="text-gray-500 text-xs mt-3 max-w-lg leading-relaxed">
                                Your SEO score is calculated
                                from metadata coverage,
                                image optimization and
                                indexed asset health.
                            </p>

                            <div className="grid grid-cols-3 gap-3 mt-7 max-w-lg">
                                <MiniHealth
                                    label="Critical"
                                    value={
                                        criticalCount
                                    }
                                    color="text-red-400"
                                />

                                <MiniHealth
                                    label="Warning"
                                    value={
                                        warningCount
                                    }
                                    color="text-orange-400"
                                />

                                <MiniHealth
                                    label="Healthy"
                                    value={
                                        healthyCount
                                    }
                                    color="text-green-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-7 shadow-xl shadow-gray-100/50">

                    <div className="flex items-center gap-2 mb-6">
                        <Sparkles
                            size={16}
                            className="text-[#D4AF37]"
                        />

                        <h3 className="text-sm font-black">
                            Quick Actions
                        </h3>
                    </div>

                    <div className="space-y-3">

                        <QuickAction
                            icon={<Type size={15} />}
                            title="Fix Meta Titles"
                            count={
                                stats.missingMetaTitle
                            }
                            href="/godmode/products"
                        />

                        <QuickAction
                            icon={
                                <LinkIcon size={15} />
                            }
                            title="Fix Meta Descriptions"
                            count={
                                stats.missingMetaDesc
                            }
                            href="/godmode/products"
                        />

                        <QuickAction
                            icon={
                                <ImageIcon size={15} />
                            }
                            title="Fix Image Alt Text"
                            count={
                                stats.missingAltText
                            }
                            href="/godmode/products"
                        />
                    </div>
                </div>
            </div>

            {/* ==============================================================
               KPI CARDS
               ============================================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                <SeoStatCard
                    icon={
                        <Globe size={24} />
                    }
                    label="Indexed Pages"
                    value={stats.totalIndexed}
                    status="Visible to search engines"
                    tone="green"
                />

                <SeoStatCard
                    icon={
                        <Type size={24} />
                    }
                    label="Missing Meta Titles"
                    value={
                        stats.missingMetaTitle
                    }
                    status="Priority CTR issue"
                    tone="red"
                />

                <SeoStatCard
                    icon={
                        <LinkIcon size={24} />
                    }
                    label="Missing Meta Desc"
                    value={
                        stats.missingMetaDesc
                    }
                    status="Snippet opportunity"
                    tone="orange"
                />

                <SeoStatCard
                    icon={
                        <ImageIcon size={24} />
                    }
                    label="Missing Alt Text"
                    value={
                        stats.missingAltText
                    }
                    status="Image SEO opportunity"
                    tone="blue"
                />
            </div>

            {/* ==============================================================
               COVERAGE
               ============================================================== */}

            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-gray-100/40">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">

                    <div>
                        <h3 className="text-lg font-serif font-black italic">
                            SEO Coverage
                        </h3>

                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">
                            Optimization completeness
                        </p>
                    </div>

                    <div className="text-[10px] text-gray-400 font-bold">
                        {stats.totalIndexed} indexed assets
                    </div>
                </div>

                <div className="space-y-6">

                    <CoverageBar
                        label="Meta Title Coverage"
                        value={
                            stats.totalIndexed
                                ? Math.max(
                                      0,
                                      100 -
                                          (stats.missingMetaTitle /
                                              stats.totalIndexed) *
                                              100
                                  )
                                : 0
                        }
                        icon={
                            <Type size={15} />
                        }
                    />

                    <CoverageBar
                        label="Meta Description Coverage"
                        value={
                            stats.totalIndexed
                                ? Math.max(
                                      0,
                                      100 -
                                          (stats.missingMetaDesc /
                                              stats.totalIndexed) *
                                              100
                                  )
                                : 0
                        }
                        icon={
                            <LinkIcon size={15} />
                        }
                    />

                    <CoverageBar
                        label="Image Alt Coverage"
                        value={
                            stats.totalIndexed
                                ? Math.max(
                                      0,
                                      100 -
                                          (stats.missingAltText /
                                              stats.totalIndexed) *
                                              100
                                  )
                                : 0
                        }
                        icon={
                            <ImageIcon size={15} />
                        }
                    />
                </div>
            </div>

            {/* ==============================================================
               ATTENTION HEADER
               ============================================================== */}

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                <div>
                    <h3 className="text-2xl font-serif font-black italic tracking-tighter">
                        SEO Opportunities
                    </h3>

                    <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-1">
                        {attentionItems.length} assets requiring review
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">

                    <FilterButton
                        active={
                            filter === "all"
                        }
                        onClick={() =>
                            setFilter("all")
                        }
                    >
                        All
                    </FilterButton>

                    <FilterButton
                        active={
                            filter === "critical"
                        }
                        onClick={() =>
                            setFilter(
                                "critical"
                            )
                        }
                    >
                        Critical
                    </FilterButton>

                    <FilterButton
                        active={
                            filter === "metadata"
                        }
                        onClick={() =>
                            setFilter(
                                "metadata"
                            )
                        }
                    >
                        Metadata
                    </FilterButton>

                    <FilterButton
                        active={
                            filter === "images"
                        }
                        onClick={() =>
                            setFilter("images")
                        }
                    >
                        Images
                    </FilterButton>
                </div>
            </div>

            {/* ==============================================================
               SEARCH + SORT
               ============================================================== */}

            <div className="flex flex-col md:flex-row gap-3">

                <div className="relative flex-1">
                    <Search
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                        placeholder="Search products or assets..."
                        className="w-full bg-white border border-gray-200 rounded-xl py-3.5 pl-11 pr-10 text-sm outline-none focus:border-black transition-colors"
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={() =>
                                setSearch("")
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>

                <div className="relative">
                    <select
                        value={sort}
                        onChange={(event) =>
                            setSort(
                                event.target
                                    .value as SortType
                            )
                        }
                        className="appearance-none w-full md:w-52 bg-white border border-gray-200 rounded-xl py-3.5 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                    >
                        <option value="score">
                            Worst Score First
                        </option>

                        <option value="name">
                            Name A–Z
                        </option>
                    </select>

                    <ChevronDown
                        size={14}
                        className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
                    />
                </div>
            </div>

            {/* ==============================================================
               ATTENTION LIST
               ============================================================== */}

            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-5 md:p-8 shadow-2xl shadow-gray-100/50">

                {filteredItems.length === 0 ? (
                    <EmptyState
                        search={search}
                        clear={() => {
                            setSearch("");
                            setFilter("all");
                        }}
                    />
                ) : (
                    <div className="space-y-3">

                        {filteredItems.map(
                            (item) => (
                                <AttentionRow
                                    key={item.id}
                                    item={item}
                                />
                            )
                        )}

                    </div>
                )}

                {attentionItems.length >
                    8 && (
                    <div className="flex justify-center mt-7 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() =>
                                setShowAll(
                                    (previous) =>
                                        !previous
                                )
                            }
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-50 hover:bg-black hover:text-white text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                            {showAll
                                ? "Show Less"
                                : `Load All ${attentionItems.length} Issues`}

                            <ChevronRight
                                size={13}
                            />
                        </button>
                    </div>
                )}
            </div>

            {/* ==============================================================
               FOOTER INSIGHT
               ============================================================== */}

            <div className="flex items-start gap-4 p-6 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl">

                <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                    <TrendingUp
                        size={17}
                        className="text-[#D4AF37]"
                    />
                </div>

                <div>
                    <p className="text-xs font-black text-black">
                        SEO Opportunity
                    </p>

                    <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                        Fixing your highest-priority
                        issues first will generally give
                        you a cleaner optimization workflow.
                        Start with critical metadata issues,
                        then image accessibility.
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ==========================================================================
   SCORE RING
   ========================================================================== */

function ScoreRing({
    score,
}: {
    score: number;
}) {
    const radius = 42;
    const circumference =
        2 * Math.PI * radius;

    const safeScore = Math.max(
        0,
        Math.min(100, score)
    );

    const offset =
        circumference -
        (safeScore / 100) *
            circumference;

    const color =
        safeScore >= 80
            ? "#22c55e"
            : safeScore >= 60
                ? "#f59e0b"
                : "#ef4444";

    return (
        <div className="relative w-40 h-40 shrink-0">

            <svg
                viewBox="0 0 100 100"
                className="w-full h-full -rotate-90"
            >
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="8"
                />

                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={
                        circumference
                    }
                    strokeDashoffset={
                        offset
                    }
                    className="transition-all duration-1000"
                />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                    className="text-4xl font-black font-mono"
                    style={{
                        color,
                    }}
                >
                    {Math.round(
                        safeScore
                    )}
                </span>

                <span className="text-[8px] uppercase tracking-widest text-gray-500 font-black">
                    / 100
                </span>
            </div>
        </div>
    );
}

/* ==========================================================================
   MINI HEALTH
   ========================================================================== */

function MiniHealth({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div className="bg-white/[0.04] rounded-xl px-3 py-3 border border-white/5">
            <p className="text-[8px] text-gray-600 uppercase tracking-widest font-black">
                {label}
            </p>

            <p
                className={`text-lg font-black mt-1 ${color}`}
            >
                {value}
            </p>
        </div>
    );
}

/* ==========================================================================
   STAT CARD
   ========================================================================== */

function SeoStatCard({
    icon,
    label,
    value,
    status,
    tone,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    status: string;
    tone:
        | "green"
        | "red"
        | "orange"
        | "blue";
}) {
    const styles = {
        green: {
            bg: "bg-green-50/40",
            border: "border-green-100",
            icon: "bg-green-50 text-green-500",
            value: "text-green-600",
            status: "text-green-500",
        },
        red: {
            bg: "bg-red-50/40",
            border: "border-red-100",
            icon: "bg-red-50 text-red-500",
            value: "text-red-600",
            status: "text-red-400",
        },
        orange: {
            bg: "bg-orange-50/40",
            border: "border-orange-100",
            icon: "bg-orange-50 text-orange-500",
            value: "text-orange-600",
            status: "text-orange-400",
        },
        blue: {
            bg: "bg-blue-50/40",
            border: "border-blue-100",
            icon: "bg-blue-50 text-blue-500",
            value: "text-blue-600",
            status: "text-blue-400",
        },
    }[tone];

    return (
        <div
            className={`relative overflow-hidden p-6 md:p-7 rounded-[2rem] border ${styles.bg} ${styles.border} group hover:-translate-y-1 hover:shadow-xl transition-all duration-300`}
        >
            <div className="flex items-start justify-between gap-4">

                <div>
                    <p className="text-[9px] uppercase font-black tracking-[0.18em] text-gray-400">
                        {label}
                    </p>

                    <p
                        className={`text-4xl font-serif font-black italic tracking-tighter mt-3 ${styles.value}`}
                    >
                        {value}
                    </p>
                </div>

                <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${styles.icon}`}
                >
                    {icon}
                </div>
            </div>

            <div
                className={`text-[8px] font-black uppercase tracking-widest mt-6 flex items-center gap-2 ${styles.status}`}
            >
                <CheckCircle size={10} />
                {status}
            </div>
        </div>
    );
}

/* ==========================================================================
   COVERAGE BAR
   ========================================================================== */

function CoverageBar({
    label,
    value,
    icon,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
}) {
    const safeValue = Math.round(
        Math.max(
            0,
            Math.min(100, value)
        )
    );

    const barColor =
        safeValue >= 80
            ? "bg-green-500"
            : safeValue >= 60
                ? "bg-orange-500"
                : "bg-red-500";

    return (
        <div>
            <div className="flex items-center justify-between mb-2">

                <div className="flex items-center gap-2">
                    <span className="text-gray-400">
                        {icon}
                    </span>

                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                        {label}
                    </span>
                </div>

                <span className="text-xs font-black font-mono">
                    {safeValue}%
                </span>
            </div>

            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${barColor} rounded-full transition-all duration-700`}
                    style={{
                        width: `${safeValue}%`,
                    }}
                />
            </div>
        </div>
    );
}

/* ==========================================================================
   ATTENTION ROW
   ========================================================================== */

function AttentionRow({
    item,
}: {
    item: AttentionItem;
}) {
    const scoreColor =
        item.score >= 80
            ? "text-green-500"
            : item.score >= 50
                ? "text-orange-500"
                : "text-red-500";

    return (
        <div className="group flex flex-col lg:flex-row lg:items-center gap-5 p-5 md:p-6 bg-gray-50/40 hover:bg-white border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-black/5 rounded-2xl transition-all duration-300">

            <div className="flex-1 min-w-0">

                <div className="flex items-start gap-3">

                    <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0">
                        <Target
                            size={15}
                            className="text-gray-500"
                        />
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-black text-black truncate group-hover:text-[#D4AF37] transition-colors">
                            {item.name}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-3">

                            {item.issues.title && (
                                <IssueBadge
                                    label="No Title"
                                    tone="red"
                                />
                            )}

                            {item.issues.desc && (
                                <IssueBadge
                                    label="No Description"
                                    tone="orange"
                                />
                            )}

                            {item.issues.alt && (
                                <IssueBadge
                                    label="No Alt Text"
                                    tone="blue"
                                />
                            )}

                            {!item.issues.title &&
                                !item.issues.desc &&
                                !item.issues.alt && (
                                    <IssueBadge
                                        label="Review"
                                        tone="gray"
                                    />
                                )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between lg:justify-end gap-5">

                <div className="text-center min-w-[65px]">
                    <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest">
                        Score
                    </p>

                    <p
                        className={`text-xl font-black font-mono mt-1 ${scoreColor}`}
                    >
                        {item.score}%
                    </p>
                </div>

                <Link
                    href={`/godmode/products/edit/${item.id}`}
                    className="inline-flex items-center gap-2 px-5 py-3.5 bg-black text-white hover:bg-[#D4AF37] hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg"
                >
                    Optimize
                    <ChevronRight
                        size={13}
                    />
                </Link>
            </div>
        </div>
    );
}

/* ==========================================================================
   ISSUE BADGE
   ========================================================================== */

function IssueBadge({
    label,
    tone,
}: {
    label: string;
    tone:
        | "red"
        | "orange"
        | "blue"
        | "gray";
}) {
    const styles = {
        red: "bg-red-50 text-red-600 border-red-100",
        orange:
            "bg-orange-50 text-orange-600 border-orange-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        gray: "bg-gray-100 text-gray-500 border-gray-200",
    };

    return (
        <span
            className={`px-2.5 py-1 rounded-full border text-[8px] uppercase font-black tracking-widest ${styles[tone]}`}
        >
            {label}
        </span>
    );
}

/* ==========================================================================
   FILTER BUTTON
   ========================================================================== */

function FilterButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-4 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                active
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black"
            }`}
        >
            {children}
        </button>
    );
}

/* ==========================================================================
   QUICK ACTION
   ========================================================================== */

function QuickAction({
    icon,
    title,
    count,
    href,
}: {
    icon: React.ReactNode;
    title: string;
    count: number;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-black hover:text-white group transition-all"
        >
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-500 group-hover:text-black">
                {icon}
            </div>

            <div className="flex-1">
                <p className="text-[9px] font-black uppercase tracking-wider">
                    {title}
                </p>
            </div>

            <span className="text-xs font-black font-mono">
                {count}
            </span>

            <ChevronRight
                size={13}
                className="text-gray-400 group-hover:text-white"
            />
        </Link>
    );
}

/* ==========================================================================
   EMPTY STATE
   ========================================================================== */

function EmptyState({
    search,
    clear,
}: {
    search: string;
    clear: () => void;
}) {
    return (
        <div className="py-16 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">

            <div className="w-14 h-14 mx-auto rounded-2xl bg-green-50 flex items-center justify-center">
                {search ? (
                    <Search
                        size={24}
                        className="text-gray-400"
                    />
                ) : (
                    <CircleCheck
                        size={28}
                        className="text-green-500"
                    />
                )}
            </div>

            <p className="text-gray-900 font-serif italic text-xl mt-5">
                {search
                    ? "No matching assets found"
                    : "All assets are optimized"}
            </p>

            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-2">
                {search
                    ? "Try another search or filter"
                    : "Your current SEO queue is clean"}
            </p>

            {search && (
                <button
                    type="button"
                    onClick={clear}
                    className="mt-5 px-4 py-2 rounded-lg bg-black text-white text-[9px] font-black uppercase tracking-widest"
                >
                    Clear Filters
                </button>
            )}
        </div>
    );
}

/* ==========================================================================
   ERROR STATE
   ========================================================================== */

function SeoErrorState({
    error,
    retry,
}: {
    error: string;
    retry: () => void;
}) {
    return (
        <div className="p-10 md:p-20 text-center bg-red-50 rounded-[3rem] border border-red-100">

            <AlertTriangle
                className="mx-auto mb-5 text-red-500"
                size={48}
            />

            <h3 className="text-2xl font-serif font-black italic text-red-900">
                Intelligence Offline
            </h3>

            <p className="text-red-600/60 text-xs mt-3 font-bold uppercase tracking-widest max-w-md mx-auto">
                {error}
            </p>

            <button
                type="button"
                onClick={retry}
                className="mt-7 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-black text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all"
            >
                <RefreshCcw size={13} />
                Retry Connection
            </button>
        </div>
    );
}

/* ==========================================================================
   LOADING SKELETON
   ========================================================================== */

function SeoDashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">

            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-3">
                    <div className="h-10 bg-gray-100 rounded-xl w-72" />
                    <div className="h-3 bg-gray-100 rounded-lg w-52" />
                </div>

                <div className="h-12 bg-gray-100 rounded-xl w-36" />
            </div>

            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
                <div className="h-56 bg-gray-100 rounded-[2.5rem]" />
                <div className="h-56 bg-gray-100 rounded-[2.5rem]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map(
                    (item) => (
                        <div
                            key={item}
                            className="h-40 bg-gray-100 rounded-[2rem]"
                        />
                    )
                )}
            </div>

            <div className="h-64 bg-gray-100 rounded-[2.5rem]" />

            <div className="h-12 bg-gray-100 rounded-xl" />

            <div className="h-96 bg-gray-100 rounded-[2.5rem]" />
        </div>
    );
}