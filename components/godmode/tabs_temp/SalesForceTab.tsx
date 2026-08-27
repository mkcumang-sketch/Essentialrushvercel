"use client";

import React, { useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Link as LinkIcon,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  MousePointerClick,
  BarChart3,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  Mail,
  ShieldCheck,
  Award,
  Wallet,
  ShoppingCart,
  Percent,
  Activity,
  X,
  AlertTriangle,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

/* =========================================================
   TYPES
========================================================= */

interface AffiliateAgent {
  _id: string;
  name?: string;
  email?: string;
  code?: string;
  tier?: string;
  commissionRate?: number;
  clicks?: number;
  totalSales?: number;
  totalEarned?: number;
  totalOrders?: number;
  conversions?: number;
  status?: string;
  createdAt?: string;
  lastActiveAt?: string;
}

interface SalesForceTabProps {
  agents: AffiliateAgent[];
  setIsAgentModalOpen: (val: boolean) => void;
  handleDeleteAffiliate: (id: string) => void;
}

type SortField =
  | "name"
  | "sales"
  | "clicks"
  | "commission"
  | "conversion";

type SortDirection = "asc" | "desc";

const PAGE_SIZE = 8;

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatNumber = (value: number) =>
  Number(value || 0).toLocaleString("en-IN");

const formatCompact = (value: number) => {
  const number = Number(value || 0);

  if (number >= 10000000) {
    return `${(number / 10000000).toFixed(1)}Cr`;
  }

  if (number >= 100000) {
    return `${(number / 100000).toFixed(1)}L`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }

  return String(number);
};

const getInitials = (name?: string) => {
  if (!name) return "AP";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
};

const getTierStyle = (tier?: string) => {
  const normalized = String(tier || "Standard").toLowerCase();

  if (normalized === "vip") {
    return {
      wrapper:
        "border-purple-400/20 bg-purple-500/10 text-purple-300",
      icon: "text-purple-300",
    };
  }

  if (normalized === "master") {
    return {
      wrapper:
        "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]",
      icon: "text-[#D4AF37]",
    };
  }

  return {
    wrapper:
      "border-blue-400/20 bg-blue-500/10 text-blue-300",
    icon: "text-blue-300",
  };
};

const getStatusStyle = (status?: string) => {
  const normalized = String(status || "ACTIVE").toUpperCase();

  if (normalized === "BLOCKED") {
    return "border-red-500/20 bg-red-500/10 text-red-400";
  }

  if (normalized === "INACTIVE") {
    return "border-gray-500/20 bg-gray-500/10 text-gray-400";
  }

  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function SalesForceTab({
  agents,
  setIsAgentModalOpen,
  handleDeleteAffiliate,
}: SalesForceTabProps) {
  const safeAgents = Array.isArray(agents) ? agents : [];

  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [sortField, setSortField] =
    useState<SortField>("sales");

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");

  const [currentPage, setCurrentPage] = useState(1);

  const [copiedId, setCopiedId] =
    useState<string | null>(null);

  const [selectedAgent, setSelectedAgent] =
    useState<AffiliateAgent | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<AffiliateAgent | null>(null);

  const [showFilters, setShowFilters] =
    useState(false);

  const [chartMode, setChartMode] =
    useState<"revenue" | "traffic">("revenue");

  /* =======================================================
     BASE URL
  ======================================================= */

  const BASE_URL =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://essentialrush.com";

  /* =======================================================
     DERIVED METRICS
  ======================================================= */

  const metrics = useMemo(() => {
    const totalPartners = safeAgents.length;

    const totalRevenue = safeAgents.reduce(
      (sum, agent) => sum + Number(agent.totalSales || 0),
      0
    );

    const totalPayouts = safeAgents.reduce(
      (sum, agent) => sum + Number(agent.totalEarned || 0),
      0
    );

    const totalClicks = safeAgents.reduce(
      (sum, agent) => sum + Number(agent.clicks || 0),
      0
    );

    const totalOrders = safeAgents.reduce(
      (sum, agent) =>
        sum +
        Number(
          agent.totalOrders ??
            agent.conversions ??
            0
        ),
      0
    );

    const conversionRate =
      totalClicks > 0
        ? (totalOrders / totalClicks) * 100
        : 0;

    const averageRevenue =
      totalPartners > 0
        ? totalRevenue / totalPartners
        : 0;

    const activePartners = safeAgents.filter(
      (agent) =>
        String(agent.status || "ACTIVE").toUpperCase() ===
        "ACTIVE"
    ).length;

    return {
      totalPartners,
      totalRevenue,
      totalPayouts,
      totalClicks,
      totalOrders,
      conversionRate,
      averageRevenue,
      activePartners,
    };
  }, [safeAgents]);

  /* =======================================================
     FILTERED + SORTED DATA
  ======================================================= */

  const filteredAgents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const result = safeAgents.filter((agent) => {
      const matchesSearch =
        !query ||
        agent.name?.toLowerCase().includes(query) ||
        agent.email?.toLowerCase().includes(query) ||
        agent.code?.toLowerCase().includes(query);

      const matchesTier =
        tierFilter === "ALL" ||
        String(agent.tier || "Standard") === tierFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        String(agent.status || "ACTIVE").toUpperCase() ===
          statusFilter;

      return (
        matchesSearch &&
        matchesTier &&
        matchesStatus
      );
    });

    return [...result].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = (a.name || "").localeCompare(
            b.name || ""
          );
          break;

        case "sales":
          comparison =
            Number(a.totalSales || 0) -
            Number(b.totalSales || 0);
          break;

        case "clicks":
          comparison =
            Number(a.clicks || 0) -
            Number(b.clicks || 0);
          break;

        case "commission":
          comparison =
            Number(a.totalEarned || 0) -
            Number(b.totalEarned || 0);
          break;

        case "conversion": {
          const aClicks = Number(a.clicks || 0);
          const bClicks = Number(b.clicks || 0);

          const aOrders = Number(
            a.totalOrders ?? a.conversions ?? 0
          );

          const bOrders = Number(
            b.totalOrders ?? b.conversions ?? 0
          );

          const aRate =
            aClicks > 0
              ? aOrders / aClicks
              : 0;

          const bRate =
            bClicks > 0
              ? bOrders / bClicks
              : 0;

          comparison = aRate - bRate;
          break;
        }
      }

      return sortDirection === "asc"
        ? comparison
        : -comparison;
    });
  }, [
    safeAgents,
    searchTerm,
    tierFilter,
    statusFilter,
    sortField,
    sortDirection,
  ]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAgents.length / PAGE_SIZE)
  );

  const paginatedAgents = filteredAgents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  /* =======================================================
     CHART DATA
  ======================================================= */

  const chartData = useMemo(() => {
    return [...safeAgents]
      .sort(
        (a, b) =>
          Number(b.totalSales || 0) -
          Number(a.totalSales || 0)
      )
      .slice(0, 8)
      .map((agent) => {
        const clicks = Number(agent.clicks || 0);

        const orders = Number(
          agent.totalOrders ??
            agent.conversions ??
            0
        );

        return {
          name:
            agent.name?.split(" ")[0] ||
            "Partner",
          revenue: Number(agent.totalSales || 0),
          traffic: clicks,
          orders,
          conversion:
            clicks > 0
              ? Number(
                  ((orders / clicks) * 100).toFixed(2)
                )
              : 0,
        };
      });
  }, [safeAgents]);

  /* =======================================================
     TOP PARTNERS
  ======================================================= */

  const topPartners = useMemo(() => {
    return [...safeAgents]
      .sort(
        (a, b) =>
          Number(b.totalSales || 0) -
          Number(a.totalSales || 0)
      )
      .slice(0, 5);
  }, [safeAgents]);

  /* =======================================================
     COPY LINK
  ======================================================= */

  const copyToClipboard = async (
    code: string,
    id: string
  ) => {
    if (!code) return;

    const link = `${BASE_URL}?ref=${encodeURIComponent(
      code
    )}`;

    try {
      await navigator.clipboard.writeText(link);

      setCopiedId(id);

      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch {
      // Clipboard unavailable.
    }
  };

  /* =======================================================
     SORT
  ======================================================= */

  const changeSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((previous) =>
        previous === "asc" ? "desc" : "asc"
      );
    } else {
      setSortField(field);
      setSortDirection("desc");
    }

    setCurrentPage(1);
  };

  /* =======================================================
     RESET
  ======================================================= */

  const resetFilters = () => {
    setSearchTerm("");
    setTierFilter("ALL");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-7 pb-24"
    >
      {/* =====================================================
          COMMAND HEADER
      ====================================================== */}

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#121212] via-[#080808] to-black p-6 shadow-2xl">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-purple-500/5 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
                <Users size={19} />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
                  Partner Intelligence
                </p>

                <p className="text-[9px] uppercase tracking-widest text-gray-600">
                  Affiliate Command Center
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-serif text-white">
              Affiliates & Partners
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Manage referral partners, monitor traffic,
              measure conversions and track partner-generated
              revenue from one premium dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => setShowFilters((value) => !value)}
              className={`flex h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-[10px] font-bold uppercase tracking-[0.18em] transition ${
                showFilters
                  ? "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"
                  : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Filter size={15} />
              Filters
            </button>

            <button
              onClick={() =>
                setIsAgentModalOpen(true)
              }
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] px-6 text-[10px] font-bold uppercase tracking-[0.18em] text-black shadow-lg shadow-[#D4AF37]/10 transition hover:bg-white"
            >
              <UserPlus size={16} />
              Add Partner
            </button>
          </div>
        </div>

        {/* ===================================================
            FILTER BAR
        ==================================================== */}

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              className="relative mt-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-3 border-t border-white/10 pt-5 md:grid-cols-3">
                <FilterSelect
                  label="Partner Tier"
                  value={tierFilter}
                  onChange={(value) => {
                    setTierFilter(value);
                    setCurrentPage(1);
                  }}
                  options={[
                    ["ALL", "All Tiers"],
                    ["Standard", "Standard"],
                    ["Master", "Master"],
                    ["VIP", "VIP"],
                  ]}
                />

                <FilterSelect
                  label="Partner Status"
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                  options={[
                    ["ALL", "All Status"],
                    ["ACTIVE", "Active"],
                    ["INACTIVE", "Inactive"],
                    ["BLOCKED", "Blocked"],
                  ]}
                />

                <button
                  onClick={resetFilters}
                  className="mt-auto h-11 rounded-xl border border-white/10 bg-white/5 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400 transition hover:bg-white/10 hover:text-white"
                >
                  Reset Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* =====================================================
          KPI CARDS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Users size={20} />}
          title="Total Partners"
          value={formatNumber(metrics.totalPartners)}
          subtitle={`${metrics.activePartners} active partners`}
          iconClass="text-[#D4AF37]"
          bgClass="bg-[#D4AF37]/10"
        />

        <MetricCard
          icon={<TrendingUp size={20} />}
          title="Revenue Generated"
          value={formatCurrency(metrics.totalRevenue)}
          subtitle={`Avg ${formatCurrency(
            metrics.averageRevenue
          )} / partner`}
          iconClass="text-emerald-400"
          bgClass="bg-emerald-500/10"
        />

        <MetricCard
          icon={<Wallet size={20} />}
          title="Partner Earnings"
          value={formatCurrency(metrics.totalPayouts)}
          subtitle="Total commission liability"
          iconClass="text-purple-400"
          bgClass="bg-purple-500/10"
        />

        <MetricCard
          icon={<MousePointerClick size={20} />}
          title="Conversion Rate"
          value={`${metrics.conversionRate.toFixed(
            2
          )}%`}
          subtitle={`${formatNumber(
            metrics.totalClicks
          )} tracked clicks`}
          iconClass="text-cyan-400"
          bgClass="bg-cyan-500/10"
        />
      </div>

      {/* =====================================================
          SECONDARY KPI STRIP
      ====================================================== */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniMetric
          icon={<MousePointerClick size={15} />}
          label="Clicks"
          value={formatCompact(metrics.totalClicks)}
        />

        <MiniMetric
          icon={<ShoppingCart size={15} />}
          label="Conversions"
          value={formatCompact(metrics.totalOrders)}
        />

        <MiniMetric
          icon={<Percent size={15} />}
          label="Avg Commission"
          value={
            safeAgents.length
              ? `${(
                  safeAgents.reduce(
                    (sum, agent) =>
                      sum +
                      Number(
                        agent.commissionRate || 0
                      ),
                    0
                  ) / safeAgents.length
                ).toFixed(1)}%`
              : "0%"
          }
        />

        <MiniMetric
          icon={<Activity size={15} />}
          label="Avg Revenue"
          value={formatCompact(
            metrics.averageRevenue
          )}
        />
      </div>

      {/* =====================================================
          ANALYTICS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3
                  size={18}
                  className="text-[#D4AF37]"
                />

                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
                  Performance Analytics
                </h3>
              </div>

              <p className="mt-1 text-[10px] text-gray-600">
                Top partner performance based on available
                tracked data.
              </p>
            </div>

            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setChartMode("revenue")}
                className={`rounded-lg px-3 py-2 text-[9px] font-bold uppercase tracking-widest transition ${
                  chartMode === "revenue"
                    ? "bg-[#D4AF37] text-black"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                Revenue
              </button>

              <button
                onClick={() => setChartMode("traffic")}
                className={`rounded-lg px-3 py-2 text-[9px] font-bold uppercase tracking-widest transition ${
                  chartMode === "traffic"
                    ? "bg-[#D4AF37] text-black"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                Traffic
              </button>
            </div>
          </div>

          <div className="h-[330px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                {chartMode === "revenue" ? (
                  <AreaChart
                    data={chartData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -15,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="revenueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#D4AF37"
                          stopOpacity={0.35}
                        />

                        <stop
                          offset="100%"
                          stopColor="#D4AF37"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#222"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="name"
                      stroke="#555"
                      tick={{
                        fill: "#777",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      stroke="#555"
                      tick={{
                        fill: "#777",
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) =>
                        `₹${formatCompact(value)}`
                      }
                    />

                    <Tooltip
                      cursor={{
                        stroke: "#444",
                      }}
                      contentStyle={{
                        background:
                          "#080808",
                        border:
                          "1px solid #333",
                        borderRadius:
                          "12px",
                        color: "#fff",
                      }}
                      formatter={(value) => [
                        formatCurrency(
                          Number(value || 0)
                        ),
                        "Revenue",
                      ]}
                    />

                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#D4AF37"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -15,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#222"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="name"
                      stroke="#555"
                      tick={{
                        fill: "#777",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      stroke="#555"
                      tick={{
                        fill: "#777",
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      cursor={{
                        fill: "rgba(255,255,255,0.03)",
                      }}
                      contentStyle={{
                        background:
                          "#080808",
                        border:
                          "1px solid #333",
                        borderRadius:
                          "12px",
                      }}
                    />

                    <Bar
                      dataKey="traffic"
                      name="Clicks"
                      fill="#D4AF37"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </section>

        {/* ===================================================
            LEADERBOARD
        ==================================================== */}

        <section className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Award
                  size={18}
                  className="text-[#D4AF37]"
                />

                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
                  Top Partners
                </h3>
              </div>

              <p className="mt-1 text-[10px] text-gray-600">
                Revenue leaderboard
              </p>
            </div>

            <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-[#D4AF37]">
              LIVE
            </span>
          </div>

          <div className="space-y-3">
            {topPartners.length > 0 ? (
              topPartners.map((agent, index) => (
                <motion.div
                  key={agent._id}
                  initial={{
                    opacity: 0,
                    x: 10,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    delay: index * 0.05,
                  }}
                  className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.025] p-3 transition hover:border-white/10 hover:bg-white/[0.04]"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${
                      index === 0
                        ? "bg-[#D4AF37]/15 text-[#D4AF37]"
                        : "bg-white/5 text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[10px] font-bold text-gray-300">
                    {getInitials(agent.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">
                      {agent.name || "Partner"}
                    </p>

                    <p className="mt-0.5 text-[9px] uppercase tracking-widest text-gray-600">
                      {agent.tier || "Standard"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-xs font-bold text-[#D4AF37]">
                      {formatCurrency(
                        Number(agent.totalSales || 0)
                      )}
                    </p>

                    <p className="mt-0.5 text-[8px] text-gray-600">
                      revenue
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="py-10 text-center text-xs text-gray-600">
                No partner data available.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* =====================================================
          PARTNER DIRECTORY
      ====================================================== */}

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="border-b border-white/10 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <LinkIcon
                  size={18}
                  className="text-[#D4AF37]"
                />

                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
                  Partner Directory
                </h3>
              </div>

              <p className="mt-1 text-[10px] text-gray-600">
                {filteredAgents.length} partners matching current
                filters.
              </p>
            </div>

            <div className="flex h-11 w-full items-center gap-3 rounded-xl border border-white/10 bg-black/50 px-4 xl:w-[360px]">
              <Search
                size={15}
                className="text-gray-600"
              />

              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search partner, email or code..."
                className="w-full bg-transparent text-xs text-white outline-none placeholder:text-gray-600"
              />

              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className="text-gray-600 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ===================================================
            DESKTOP TABLE
        ==================================================== */}

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.025] text-[9px] uppercase tracking-[0.18em] text-gray-600">
                <SortHeader
                  label="Partner"
                  field="name"
                  active={sortField}
                  direction={sortDirection}
                  onSort={changeSort}
                />

                <th className="p-4 font-bold">
                  Tier / Commission
                </th>

                <th className="p-4 font-bold">
                  Referral Link
                </th>

                <SortHeader
                  label="Clicks"
                  field="clicks"
                  active={sortField}
                  direction={sortDirection}
                  onSort={changeSort}
                />

                <SortHeader
                  label="Conversion"
                  field="conversion"
                  active={sortField}
                  direction={sortDirection}
                  onSort={changeSort}
                />

                <SortHeader
                  label="Revenue"
                  field="sales"
                  active={sortField}
                  direction={sortDirection}
                  onSort={changeSort}
                />

                <SortHeader
                  label="Commission"
                  field="commission"
                  active={sortField}
                  direction={sortDirection}
                  onSort={changeSort}
                />

                <th className="p-4 text-right font-bold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              <AnimatePresence mode="popLayout">
                {paginatedAgents.map(
                  (agent, index) => (
                    <PartnerRow
                      key={agent._id}
                      agent={agent}
                      index={index}
                      baseUrl={BASE_URL}
                      copiedId={copiedId}
                      onCopy={copyToClipboard}
                      onView={() =>
                        setSelectedAgent(agent)
                      }
                      onDelete={() =>
                        setDeleteTarget(agent)
                      }
                    />
                  )
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* ===================================================
            MOBILE CARDS
        ==================================================== */}

        <div className="divide-y divide-white/5 lg:hidden">
          {paginatedAgents.map((agent, index) => (
            <MobilePartnerCard
              key={agent._id}
              agent={agent}
              index={index}
              baseUrl={BASE_URL}
              copiedId={copiedId}
              onCopy={copyToClipboard}
              onView={() =>
                setSelectedAgent(agent)
              }
              onDelete={() =>
                setDeleteTarget(agent)
              }
            />
          ))}
        </div>

        {/* ===================================================
            EMPTY
        ==================================================== */}

        {filteredAgents.length === 0 && (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-600">
              <Users size={25} />
            </div>

            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-gray-300">
              No Partners Found
            </h4>

            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-gray-600">
              No affiliate partners match your current
              search and filter configuration.
            </p>

            <button
              onClick={resetFilters}
              className="mt-5 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-5 py-2.5 text-[9px] font-bold uppercase tracking-widest text-[#D4AF37]"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* ===================================================
            PAGINATION
        ==================================================== */}

        {filteredAgents.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-gray-600">
              Showing{" "}
              <span className="font-bold text-gray-400">
                {(currentPage - 1) * PAGE_SIZE + 1}
              </span>{" "}
              –
              <span className="font-bold text-gray-400">
                {" "}
                {Math.min(
                  currentPage * PAGE_SIZE,
                  filteredAgents.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-400">
                {filteredAgents.length}
              </span>
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(1, page - 1)
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-500 transition hover:text-white disabled:opacity-30"
              >
                <ChevronLeft size={15} />
              </button>

              <div className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-[#D4AF37]/10 px-3 text-[10px] font-bold text-[#D4AF37]">
                {currentPage} / {totalPages}
              </div>

              <button
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(
                      totalPages,
                      page + 1
                    )
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-500 transition hover:text-white disabled:opacity-30"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================
          PARTNER DRAWER
      ====================================================== */}

      <AnimatePresence>
        {selectedAgent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAgent(null)}
              className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
              }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#090909] shadow-2xl"
            >
              <PartnerDrawer
                agent={selectedAgent}
                baseUrl={BASE_URL}
                copiedId={copiedId}
                onCopy={copyToClipboard}
                onClose={() =>
                  setSelectedAgent(null)
                }
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* =====================================================
          DELETE CONFIRMATION
      ====================================================== */}

      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              className="fixed left-1/2 top-1/2 z-[70] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-[#0d0d0d] p-6 shadow-2xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                <AlertTriangle size={21} />
              </div>

              <h3 className="mt-5 text-lg font-serif text-white">
                Remove Partner?
              </h3>

              <p className="mt-2 text-xs leading-6 text-gray-500">
                You are about to remove{" "}
                <span className="font-bold text-gray-300">
                  {deleteTarget.name ||
                    "this partner"}
                </span>{" "}
                from the affiliate directory. This action
                should only be performed if you are sure.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() =>
                    setDeleteTarget(null)
                  }
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    handleDeleteAffiliate(
                      deleteTarget._id
                    );
                    setDeleteTarget(null);
                  }}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-[9px] font-bold uppercase tracking-widest text-white transition hover:bg-red-400"
                >
                  Remove Partner
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  icon,
  title,
  value,
  subtitle,
  iconClass,
  bgClass,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  iconClass: string;
  bgClass: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl"
    >
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/[0.02] blur-2xl" />

      <div className="relative flex items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bgClass} ${iconClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-600">
            {title}
          </p>

          <p className="mt-1 truncate text-xl font-serif text-white">
            {value}
          </p>

          <p className="mt-1 truncate text-[9px] text-gray-600">
            {subtitle}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   MINI METRIC
========================================================= */

function MiniMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[#D4AF37]">
            {icon}
          </span>

          <span className="text-[8px] font-bold uppercase tracking-widest text-gray-600">
            {label}
          </span>
        </div>

        <span className="font-mono text-xs font-bold text-gray-300">
          {value}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   FILTER SELECT
========================================================= */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="mb-2 block text-[8px] font-bold uppercase tracking-widest text-gray-600">
        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-black px-4 pr-10 text-xs text-gray-300 outline-none focus:border-[#D4AF37]/30"
        >
          {options.map(
            ([optionValue, optionLabel]) => (
              <option
                key={optionValue}
                value={optionValue}
              >
                {optionLabel}
              </option>
            )
          )}
        </select>

        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
        />
      </div>
    </div>
  );
}

/* =========================================================
   SORT HEADER
========================================================= */

function SortHeader({
  label,
  field,
  active,
  direction,
  onSort,
}: {
  label: string;
  field: SortField;
  active: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = active === field;

  return (
    <th className="p-4">
      <button
        onClick={() => onSort(field)}
        className={`flex items-center gap-1.5 font-bold transition ${
          isActive
            ? "text-[#D4AF37]"
            : "text-gray-600 hover:text-gray-300"
        }`}
      >
        {label}

        {isActive ? (
          direction === "asc" ? (
            <ChevronUp size={11} />
          ) : (
            <ChevronDown size={11} />
          )
        ) : (
          <ChevronDown
            size={10}
            className="opacity-30"
          />
        )}
      </button>
    </th>
  );
}

/* =========================================================
   PARTNER ROW
========================================================= */

function PartnerRow({
  agent,
  index,
  baseUrl,
  copiedId,
  onCopy,
  onView,
  onDelete,
}: {
  agent: AffiliateAgent;
  index: number;
  baseUrl: string;
  copiedId: string | null;
  onCopy: (code: string, id: string) => void;
  onView: () => void;
  onDelete: () => void;
}) {
  const tierStyle = getTierStyle(agent.tier);

  const clicks = Number(agent.clicks || 0);

  const orders = Number(
    agent.totalOrders ??
      agent.conversions ??
      0
  );

  const conversion =
    clicks > 0
      ? (orders / clicks) * 100
      : 0;

  const referralLink = agent.code
    ? `${baseUrl}?ref=${encodeURIComponent(
        agent.code
      )}`
    : "";

  return (
    <motion.tr
      initial={{
        opacity: 0,
        y: 5,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.025,
      }}
      className="group border-b border-white/5 transition hover:bg-white/[0.025]"
    >
      {/* Partner */}

      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold text-gray-300">
            {getInitials(agent.name)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">
              {agent.name || "Unnamed Partner"}
            </p>

            <div className="mt-1 flex items-center gap-1.5">
              <Mail
                size={10}
                className="text-gray-600"
              />

              <span className="max-w-[150px] truncate text-[9px] text-gray-600">
                {agent.email || "No email"}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Tier */}

      <td className="p-4">
        <div className="flex flex-col items-start gap-1.5">
          <span
            className={`rounded-full border px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest ${tierStyle.wrapper}`}
          >
            {agent.tier || "Standard"}
          </span>

          <span className="text-[9px] text-gray-600">
            {Number(
              agent.commissionRate || 0
            )}
            % commission
          </span>
        </div>
      </td>

      {/* Link */}

      <td className="p-4">
        <div className="flex max-w-[260px] items-center gap-2 rounded-xl border border-white/10 bg-black/50 p-2">
          <LinkIcon
            size={12}
            className="shrink-0 text-[#D4AF37]"
          />

          <span
            className="flex-1 truncate text-[9px] text-gray-600"
            title={referralLink}
          >
            {agent.code ? (
              <>
                ...?ref=
                <span className="font-bold text-[#D4AF37]">
                  {agent.code}
                </span>
              </>
            ) : (
              "No referral code"
            )}
          </span>

          {agent.code && (
            <button
              onClick={() =>
                onCopy(agent.code!, agent._id)
              }
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 transition hover:bg-[#D4AF37]/10"
              title="Copy referral link"
            >
              {copiedId === agent._id ? (
                <Check
                  size={12}
                  className="text-emerald-400"
                />
              ) : (
                <Copy
                  size={12}
                  className="text-gray-500"
                />
              )}
            </button>
          )}
        </div>
      </td>

      {/* Clicks */}

      <td className="p-4">
        <div className="flex items-center gap-2">
          <MousePointerClick
            size={13}
            className="text-cyan-400"
          />

          <span className="font-mono text-xs text-gray-300">
            {formatNumber(clicks)}
          </span>
        </div>
      </td>

      {/* Conversion */}

      <td className="p-4">
        <div className="min-w-[80px]">
          <p className="font-mono text-xs font-bold text-white">
            {conversion.toFixed(2)}%
          </p>

          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-[#D4AF37]"
              style={{
                width: `${Math.min(
                  100,
                  conversion * 5
                )}%`,
              }}
            />
          </div>
        </div>
      </td>

      {/* Revenue */}

      <td className="p-4">
        <span className="font-mono text-xs font-bold text-[#D4AF37]">
          {formatCurrency(
            Number(agent.totalSales || 0)
          )}
        </span>
      </td>

      {/* Commission */}

      <td className="p-4">
        <span className="font-mono text-xs text-gray-300">
          {formatCurrency(
            Number(agent.totalEarned || 0)
          )}
        </span>
      </td>

      {/* Actions */}

      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onView}
            title="View partner"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white/5 hover:text-[#D4AF37]"
          >
            <Eye size={14} />
          </button>

          <button
            onClick={onDelete}
            title="Delete partner"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

/* =========================================================
   MOBILE PARTNER CARD
========================================================= */

function MobilePartnerCard({
  agent,
  index,
  baseUrl,
  copiedId,
  onCopy,
  onView,
  onDelete,
}: {
  agent: AffiliateAgent;
  index: number;
  baseUrl: string;
  copiedId: string | null;
  onCopy: (code: string, id: string) => void;
  onView: () => void;
  onDelete: () => void;
}) {
  const clicks = Number(agent.clicks || 0);

  const orders = Number(
    agent.totalOrders ??
      agent.conversions ??
      0
  );

  const conversion =
    clicks > 0
      ? (orders / clicks) * 100
      : 0;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.04,
      }}
      className="p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-gray-300">
            {getInitials(agent.name)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              {agent.name || "Unnamed Partner"}
            </p>

            <p className="mt-1 truncate text-[10px] text-gray-600">
              {agent.email || "No email"}
            </p>
          </div>
        </div>

        <button
          onClick={onView}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-500"
        >
          <Eye size={14} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest text-[#D4AF37]">
          {agent.tier || "Standard"}
        </span>

        <span
          className={`rounded-full border px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest ${getStatusStyle(
            agent.status
          )}`}
        >
          {agent.status || "ACTIVE"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MobileMetric
          label="Revenue"
          value={formatCurrency(
            Number(agent.totalSales || 0)
          )}
        />

        <MobileMetric
          label="Commission"
          value={formatCurrency(
            Number(agent.totalEarned || 0)
          )}
        />

        <MobileMetric
          label="Clicks"
          value={formatNumber(clicks)}
        />

        <MobileMetric
          label="Conversion"
          value={`${conversion.toFixed(2)}%`}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2.5">
          <LinkIcon
            size={12}
            className="shrink-0 text-[#D4AF37]"
          />

          <span className="truncate text-[9px] text-gray-600">
            {agent.code
              ? `${baseUrl}?ref=${agent.code}`
              : "No referral link"}
          </span>
        </div>

        {agent.code && (
          <button
            onClick={() =>
              onCopy(agent.code!, agent._id)
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5"
          >
            {copiedId === agent._id ? (
              <Check
                size={14}
                className="text-emerald-400"
              />
            ) : (
              <Copy
                size={14}
                className="text-gray-500"
              />
            )}
          </button>
        )}

        <button
          onClick={onDelete}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/10 bg-red-500/5 text-red-400"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}

/* =========================================================
   MOBILE METRIC
========================================================= */

function MobileMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
      <p className="text-[8px] font-bold uppercase tracking-widest text-gray-600">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-bold text-gray-300">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   PARTNER DRAWER
========================================================= */

function PartnerDrawer({
  agent,
  baseUrl,
  copiedId,
  onCopy,
  onClose,
}: {
  agent: AffiliateAgent;
  baseUrl: string;
  copiedId: string | null;
  onCopy: (code: string, id: string) => void;
  onClose: () => void;
}) {
  const clicks = Number(agent.clicks || 0);

  const orders = Number(
    agent.totalOrders ??
      agent.conversions ??
      0
  );

  const conversion =
    clicks > 0
      ? (orders / clicks) * 100
      : 0;

  const referralLink = agent.code
    ? `${baseUrl}?ref=${encodeURIComponent(
        agent.code
      )}`
    : "";

  return (
    <div className="min-h-full">
      {/* Header */}

      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#090909]/95 p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
              Partner Intelligence
            </p>

            <h3 className="mt-1 text-lg font-serif text-white">
              Partner Profile
            </h3>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-500 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="space-y-6 p-5">
        {/* Profile */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-sm font-bold text-[#D4AF37]">
              {getInitials(agent.name)}
            </div>

            <div className="min-w-0">
              <h4 className="truncate text-lg font-bold text-white">
                {agent.name || "Unnamed Partner"}
              </h4>

              <p className="truncate text-xs text-gray-600">
                {agent.email || "No email"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest text-[#D4AF37]">
              {agent.tier || "Standard"}
            </span>

            <span
              className={`rounded-full border px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest ${getStatusStyle(
                agent.status
              )}`}
            >
              {agent.status || "ACTIVE"}
            </span>
          </div>
        </div>

        {/* KPI */}

        <div className="grid grid-cols-2 gap-3">
          <DrawerMetric
            icon={<TrendingUp size={15} />}
            label="Revenue"
            value={formatCurrency(
              Number(agent.totalSales || 0)
            )}
          />

          <DrawerMetric
            icon={<Wallet size={15} />}
            label="Commission"
            value={formatCurrency(
              Number(agent.totalEarned || 0)
            )}
          />

          <DrawerMetric
            icon={<MousePointerClick size={15} />}
            label="Clicks"
            value={formatNumber(clicks)}
          />

          <DrawerMetric
            icon={<Percent size={15} />}
            label="Conversion"
            value={`${conversion.toFixed(2)}%`}
          />
        </div>

        {/* Referral */}

        <div>
          <SectionHeading title="Referral Infrastructure" />

          <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-[8px] font-bold uppercase tracking-widest text-gray-600">
              Referral Code
            </p>

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="font-mono text-sm font-bold text-[#D4AF37]">
                {agent.code || "N/A"}
              </span>

              {agent.code && (
                <button
                  onClick={() =>
                    onCopy(agent.code!, agent._id)
                  }
                  className="flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-[8px] font-bold uppercase tracking-widest text-gray-400"
                >
                  {copiedId === agent._id ? (
                    <>
                      <Check size={12} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.025] p-3">
              <p className="break-all text-[9px] leading-5 text-gray-600">
                {referralLink ||
                  "No referral link available"}
              </p>
            </div>
          </div>
        </div>

        {/* Commission */}

        <div>
          <SectionHeading title="Commission Structure" />

          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Commission Rate
              </span>

              <span className="font-mono text-sm font-bold text-[#D4AF37]">
                {Number(
                  agent.commissionRate || 0
                )}
                %
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-[#D4AF37]"
                style={{
                  width: `${Math.min(
                    100,
                    Number(
                      agent.commissionRate || 0
                    ) * 5
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}

        <div className="space-y-2">
          {agent.email && (
            <a
              href={`mailto:${agent.email}`}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] text-[9px] font-bold uppercase tracking-widest text-black transition hover:bg-white"
            >
              <Mail size={14} />
              Contact Partner
            </a>
          )}

          {referralLink && (
            <a
              href={referralLink}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-[9px] font-bold uppercase tracking-widest text-gray-400 transition hover:bg-white/10 hover:text-white"
            >
              <ExternalLink size={14} />
              Open Referral Link
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DRAWER METRIC
========================================================= */

function DrawerMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-center gap-2 text-[#D4AF37]">
        {icon}

        <span className="text-[8px] font-bold uppercase tracking-widest text-gray-600">
          {label}
        </span>
      </div>

      <p className="mt-3 truncate text-lg font-serif text-white">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  title,
}: {
  title: string;
}) {
  return (
    <h4 className="text-[8px] font-bold uppercase tracking-[0.22em] text-gray-600">
      {title}
    </h4>
  );
}

/* =========================================================
   EMPTY CHART
========================================================= */

function EmptyChart() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-700">
        <BarChart3 size={22} />
      </div>

      <p className="mt-4 text-[9px] font-bold uppercase tracking-widest text-gray-500">
        No Analytics Data
      </p>

      <p className="mt-1 text-[9px] text-gray-700">
        Partner performance will appear here.
      </p>
    </div>
  );
}