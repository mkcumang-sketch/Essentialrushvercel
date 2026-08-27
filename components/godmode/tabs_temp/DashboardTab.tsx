"use client";

import React, {
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";

import { AnimatePresence, motion } from "framer-motion";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Filter,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Package,
  RefreshCw,
  Search,
   ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Terminal,
  Trash2,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";

/* ============================================================= */
/* TYPES */
/* ============================================================= */

export interface AnalyticsMetrics {
  totalRevenue?: number;
  totalOrders?: number;
  [key: string]: unknown;
}

export interface Lead {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  cartTotal?: number;
  [key: string]: unknown;
}

export interface OrderBasic {
  _id?: string;
  orderId?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  totalAmount?: number;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

interface DashboardProps {
  fullAnalytics: {
    metrics?: AnalyticsMetrics;
  };
  dashboardView: "orders" | "abandoned";
  setDashboardView: (view: "orders" | "abandoned") => void;
  leads: Lead[];
  orders: OrderBasic[];
  dispatchVIPRecovery: (channel: "email" | "sms" | "whatsapp", lead: Lead) => void;
  vipDispatchingKey: string | null;
  handleDeleteLead: (id: string) => void;
  systemLogs: string[];
}

/* ============================================================= */
/* HELPERS */
/* ============================================================= */

const formatCurrency = (value: number = 0) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

const formatNumber = (value: number = 0) => {
  return Number(value || 0).toLocaleString("en-IN");
};

const getOrderId = (order: OrderBasic, index: number) => {
  return order.orderId || order._id || `order-${index}`;
};

const getLeadId = (lead: Lead, index: number) => {
  return lead._id || `lead-${index}`;
};

const getCustomerName = (order: OrderBasic) => {
  return order.customer?.name || "Guest Customer";
};

const normalizeStatus = (status?: string) => {
  return (status || "pending").toLowerCase().replace(/[_-]/g, " ");
};

const getStatusClasses = (status?: string) => {
  const normalized = normalizeStatus(status);

  if (normalized.includes("delivered") || normalized.includes("completed") || normalized.includes("paid")) {
    return { wrapper: "border-emerald-500/20 bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" };
  }
  if (normalized.includes("cancel") || normalized.includes("failed")) {
    return { wrapper: "border-red-500/20 bg-red-500/10", text: "text-red-400", dot: "bg-red-400" };
  }
  if (normalized.includes("ship") || normalized.includes("process")) {
    return { wrapper: "border-cyan-500/20 bg-cyan-500/10", text: "text-cyan-400", dot: "bg-cyan-400" };
  }
  return { wrapper: "border-amber-500/20 bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" };
};

const formatTime = () => {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

/* ============================================================= */
/* MAIN DASHBOARD */
/* ============================================================= */

export default function DashboardTab({
  fullAnalytics,
  dashboardView,
  setDashboardView,
  leads,
  orders,
  dispatchVIPRecovery,
  vipDispatchingKey,
  handleDeleteLead,
  systemLogs,
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortMode, setSortMode] = useState<"recent" | "value">("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [showLogs, setShowLogs] = useState(true);

  const revenue = fullAnalytics?.metrics?.totalRevenue || 0;
  const totalOrders = fullAnalytics?.metrics?.totalOrders || orders.length;

  const abandonedValue = useMemo(
    () => leads.reduce((total, lead) => total + Number(lead.cartTotal || 0), 0),
    [leads]
  );

  const averageOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;
  const recoveryRate = abandonedValue > 0 ? Math.min(100, (revenue / (revenue + abandonedValue)) * 100) : 100;

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    let result = [...orders];

    if (query) {
      result = result.filter(
        (order) =>
          getOrderId(order, 0).toLowerCase().includes(query) ||
          getCustomerName(order).toLowerCase().includes(query) ||
          order.customer?.email?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((order) => normalizeStatus(order.status) === statusFilter);
    }

    if (sortMode === "value") {
      result.sort((a, b) => Number(b.totalAmount || 0) - Number(a.totalAmount || 0));
    }

    return result.slice(0, 12);
  }, [orders, searchTerm, statusFilter, sortMode]);

  const filteredLeads = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    let result = [...leads];

    if (query) {
      result = result.filter(
        (lead) =>
          lead.name?.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.phone?.toLowerCase().includes(query)
      );
    }

    if (sortMode === "value") {
      result.sort((a, b) => Number(b.cartTotal || 0) - Number(a.cartTotal || 0));
    }

    return result;
  }, [leads, searchTerm, sortMode]);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("all");
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="min-h-full space-y-7 pb-24">
      
      {/* TOP COMMAND BAR */}
      <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#151515] via-[#0d0d0d] to-black p-5 shadow-2xl md:p-7">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#D4AF37]/10 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-cyan-500/5 blur-[100px]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                <Sparkles size={11} /> GodMode Command Center
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Executive Dashboard</h1>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-gray-400 md:text-sm">
              Monitor revenue, orders, abandoned carts and high-value recovery opportunities from one command center.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniMetric label="Revenue" value={formatCurrency(revenue)} icon={<Wallet size={14} />} />
            <MiniMetric label="Orders" value={formatNumber(totalOrders)} icon={<Package size={14} />} />
            <MiniMetric label="Recovery" value={`${recoveryRate.toFixed(0)}%`} icon={<RefreshCw size={14} />} />
            <MiniMetric label="AOV" value={formatCurrency(averageOrderValue)} icon={<TrendingUp size={14} />} />
          </div>
        </div>
      </section>

      {/* KPI GRID */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Gross Revenue" value={formatCurrency(revenue)} icon={<DollarSign size={20} />} accent="gold" trend="+12.8%" subtitle="vs previous period" />
        <KpiCard label="Total Orders" value={formatNumber(totalOrders)} icon={<ShoppingCart size={20} />} accent="cyan" trend="+8.4%" subtitle="completed + active" onClick={() => setDashboardView("orders")} active={dashboardView === "orders"} />
        <KpiCard label="Recovery Pipeline" value={formatCurrency(abandonedValue)} icon={<AlertTriangle size={20} />} accent="red" trend={`${leads.length} leads`} subtitle="potential revenue" onClick={() => setDashboardView("abandoned")} active={dashboardView === "abandoned"} />
        <KpiCard label="Average Order" value={formatCurrency(averageOrderValue)} icon={<BarChart3 size={20} />} accent="purple" trend="AOV" subtitle="per transaction" />
      </section>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
        
        {/* TRANSACTIONS SECTION */}
        <section className="min-w-0 overflow-hidden rounded-[28px] border border-white/10 bg-[#0d0d0d] shadow-2xl">
          <div className="border-b border-white/10 p-5 md:p-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                    {dashboardView === "orders" ? <Package size={18} className="text-cyan-400" /> : <AlertTriangle size={18} className="text-red-400" />}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white md:text-lg">
                      {dashboardView === "orders" ? "Order Intelligence" : "Recovery Intelligence"}
                    </h2>
                    <p className="mt-1 text-[10px] text-gray-400">
                      {dashboardView === "orders" ? `${filteredOrders.length} transactions displayed` : `${filteredLeads.length} recovery opportunities`}
                    </p>
                  </div>
                </div>

                {/* VIEW SWITCH */}
                <div className="flex rounded-xl border border-white/10 bg-black/50 p-1">
                  <ViewButton active={dashboardView === "orders"} onClick={() => setDashboardView("orders")} icon={<Package size={13} />} label="Orders" />
                  <ViewButton active={dashboardView === "abandoned"} onClick={() => setDashboardView("abandoned")} icon={<AlertTriangle size={13} />} label="Recovery" />
                </div>
              </div>

              {/* TOOLBAR */}
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={dashboardView === "orders" ? "Search orders, customers or email..." : "Search recovery leads..."}
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-9 pr-10 text-xs text-white outline-none transition placeholder:text-gray-500 focus:border-[#D4AF37]/40"
                  />
                  {searchTerm && (
                    <button type="button" onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-white">
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowFilters((value) => !value)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[9px] font-black uppercase tracking-widest transition ${
                    showFilters ? "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]" : "border-white/10 bg-black/40 text-gray-400 hover:text-white"
                  }`}
                >
                  <Filter size={13} /> Filters
                </button>

                <button
                  type="button"
                  onClick={() => setSortMode((current) => (current === "recent" ? "value" : "recent"))}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 transition hover:text-white"
                >
                  <TrendingUp size={13} /> {sortMode === "recent" ? "Recent" : "Highest Value"}
                </button>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-4 md:p-6">
            <AnimatePresence mode="wait">
              {dashboardView === "orders" ? (
                <motion.div key="orders" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-3">
                  {filteredOrders.length === 0 ? (
                    <EmptyState
                      icon={<Package size={26} />}
                      title="No orders found"
                      description="There are no transactions matching your current filters."
                      action={searchTerm || statusFilter !== "all" ? (
                        <button type="button" onClick={clearSearch} className="rounded-xl border border-white/10 px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 transition hover:text-white">
                          Clear Filters
                        </button>
                      ) : undefined}
                    />
                  ) : (
                    filteredOrders.map((order, index) => (
                      <OrderRow key={`order-${getOrderId(order, index)}-${index}`} order={order} index={index} />
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div key="recovery" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-3">
                  {filteredLeads.length === 0 ? (
                    <EmptyState icon={<CheckCircle2 size={26} />} title="Recovery pipeline clear" description="There are currently no abandoned carts requiring attention." />
                  ) : (
                    filteredLeads.map((lead, index) => (
                      <RecoveryRow
                        key={`lead-${getLeadId(lead, index)}-${index}`}
                        lead={lead}
                        index={index}
                        dispatchVIPRecovery={dispatchVIPRecovery}
                        vipDispatchingKey={vipDispatchingKey}
                        handleDeleteLead={handleDeleteLead}
                      />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-6">
          <RecoveryScore value={recoveryRate} opportunity={abandonedValue} />
          <SystemHealth />

          {/* SYSTEM LOGS */}
          <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0d0d0d]">
            <button type="button" onClick={() => setShowLogs((value) => !value)} className="flex w-full items-center justify-between border-b border-white/10 p-5 text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03]">
                  <Terminal size={15} className="text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">System Activity</p>
                  <p className="mt-1 text-[9px] text-gray-400">{systemLogs.length} events</p>
                </div>
              </div>
              <ChevronDown size={15} className={`text-gray-400 transition-transform ${showLogs ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showLogs && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="max-h-[300px] space-y-3 overflow-y-auto p-5">
                    {systemLogs.length === 0 ? (
                      <p className="py-8 text-center text-[9px] font-bold uppercase tracking-widest text-gray-500">No system events</p>
                    ) : (
                      systemLogs.slice(-12).reverse().map((log, index) => (
                        <div key={`system-log-${index}-${log.slice(0, 12)}`} className="flex gap-3">
                          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4AF37]" />
                          <p className="text-[9px] leading-5 text-gray-400">
                            <span className="mr-2 font-mono text-[#D4AF37]/70">{formatTime()}</span>
                            {log}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </aside>
      </div>
    </motion.div>
  );
}

/* ============================================================= */
/* SUB COMPONENTS */
/* ============================================================= */

function KpiCard({ label, value, icon, accent, trend, subtitle, onClick, active }: { label: string; value: string; icon: ReactNode; accent: "gold" | "cyan" | "red" | "purple"; trend: string; subtitle: string; onClick?: () => void; active?: boolean }) {
  const accents = {
    gold: { icon: "bg-[#D4AF37]/10 text-[#D4AF37]", border: "hover:border-[#D4AF37]/30", value: "text-[#D4AF37]" },
    cyan: { icon: "bg-cyan-500/10 text-cyan-400", border: "hover:border-cyan-500/30", value: "text-cyan-400" },
    red: { icon: "bg-red-500/10 text-red-400", border: "hover:border-red-500/30", value: "text-red-400" },
    purple: { icon: "bg-purple-500/10 text-purple-400", border: "hover:border-purple-500/30", value: "text-purple-400" },
  };
  const theme = accents[accent];

  return (
    <motion.button type="button" whileHover={{ y: -3 }} whileTap={{ scale: 0.99 }} onClick={onClick} className={`group relative overflow-hidden rounded-[24px] border bg-[#0d0d0d] p-5 text-left transition-all ${active ? "border-[#D4AF37]/40" : "border-white/10"} ${theme.border}`}>
      <div className="relative flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.icon}`}>{icon}</div>
        {onClick && <ChevronRight size={15} className="text-gray-500 transition group-hover:text-gray-300" />}
      </div>
      <p className="relative mt-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</p>
      <p className={`relative mt-2 text-2xl font-bold tracking-tight ${theme.value}`}>{value}</p>
      <div className="relative mt-3 flex items-center justify-between">
        <span className="text-[9px] text-gray-400">{subtitle}</span>
        <span className={`text-[9px] font-bold ${accent === "red" ? "text-red-400" : "text-emerald-400"}`}>{trend}</span>
      </div>
    </motion.button>
  );
}

function MiniMetric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="min-w-[110px] rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
      <div className="flex items-center gap-2 text-[#D4AF37]">
        {icon}
        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      </div>
      <p className="mt-2 truncate text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function ViewButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-[9px] font-black uppercase tracking-widest transition ${active ? "bg-white/[0.08] text-white" : "text-gray-400 hover:text-gray-200"}`}>
      {icon} {label}
    </button>
  );
}

function OrderRow({ order, index }: { order: OrderBasic; index: number }) {
  const customer = getCustomerName(order);
  const statusTheme = getStatusClasses(order.status);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.025 }} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-4 transition-all hover:border-white/15 hover:bg-white/[0.025] md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/10 bg-cyan-500/5">
            <span className="text-[9px] font-black text-cyan-400">#{(order.orderId || "UKN").slice(-4)}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold text-white">{customer}</p>
            </div>
            <p className="mt-1 truncate text-[10px] text-gray-400">{order.customer?.email || order.customer?.phone || "No contact info"}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 md:justify-end">
          <div className="text-left md:text-right">
            <p className="text-base font-bold text-emerald-400">{formatCurrency(Number(order.totalAmount || 0))}</p>
            <p className="mt-1 text-[8px] uppercase tracking-widest text-gray-500">Order value</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>
    </motion.div>
  );
}

function RecoveryRow({ lead, index, dispatchVIPRecovery, vipDispatchingKey, handleDeleteLead }: { lead: Lead; index: number; dispatchVIPRecovery: (channel: "email" | "sms" | "whatsapp", lead: Lead) => void; vipDispatchingKey: string | null; handleDeleteLead: (id: string) => void }) {
  const leadId = lead._id || `fallback-${index}`;
  const contact = lead.phone || lead.email || "No contact";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.025 }} className="group relative overflow-hidden rounded-2xl border border-[#D4AF37]/10 bg-[#D4AF37]/[0.015] p-4 transition-all hover:border-[#D4AF37]/30 md:p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-500/10 bg-red-500/5">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold text-white md:text-base">{lead.name || "Anonymous Client"}</p>
            </div>
            <p className="mt-1 truncate text-[10px] text-gray-400">{contact}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-widest text-gray-500">Potential:</span>
              <span className="font-mono text-xs font-bold text-[#D4AF37]">{formatCurrency(Number(lead.cartTotal || 0))}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          <div className="grid grid-cols-3 gap-2">
            <RecoveryButton icon={<Mail size={13} />} label="Email" loading={vipDispatchingKey === `email:${leadId}`} onClick={() => dispatchVIPRecovery("email", lead)} />
            <RecoveryButton icon={<Smartphone size={13} />} label="SMS" loading={vipDispatchingKey === `sms:${leadId}`} onClick={() => dispatchVIPRecovery("sms", lead)} />
            <RecoveryButton icon={<MessageCircle size={13} />} label="WhatsApp" loading={vipDispatchingKey === `whatsapp:${leadId}`} gold onClick={() => dispatchVIPRecovery("whatsapp", lead)} />
          </div>
          <button type="button" onClick={() => handleDeleteLead(leadId)} className="flex items-center justify-end gap-1.5 text-[8px] font-bold uppercase tracking-widest text-gray-500 transition hover:text-red-400">
            <Trash2 size={11} /> Remove from pipeline
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function RecoveryButton({ icon, label, loading, onClick, gold = false }: { icon: ReactNode; label: string; loading: boolean; onClick: () => void; gold?: boolean }) {
  return (
    <button type="button" disabled={loading} onClick={onClick} className={`flex min-w-[76px] items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[8px] font-black uppercase tracking-widest transition disabled:cursor-wait ${gold ? "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20" : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/20 hover:text-white"}`}>
      {loading ? <RefreshCw size={12} className="animate-spin" /> : icon}
      <span>{loading ? "Sending" : label}</span>
    </button>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const theme = getStatusClasses(status);
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[7px] font-black uppercase tracking-widest ${theme.wrapper} ${theme.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
      {normalizeStatus(status)}
    </span>
  );
}

function RecoveryScore({ value, opportunity }: { value: number; opportunity: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0d0d0d] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Recovery Health</p>
          <h3 className="mt-2 text-base font-bold text-white">Revenue Protection</h3>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
          <ShieldCheck size={17} className="text-emerald-400" />
        </div>
      </div>
      <div className="mt-7 flex items-center justify-center">
        <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/5">
          <div className="absolute inset-3 rounded-full border-[8px] border-white/5" />
          <div className="absolute inset-3 rounded-full border-[8px] border-transparent border-t-[#D4AF37] border-r-[#D4AF37]" style={{ transform: `rotate(${safeValue * 3.6}deg)` }} />
          <div className="relative text-center">
            <p className="text-3xl font-bold text-white">{safeValue.toFixed(0)}%</p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-widest text-gray-400">Health Score</p>
          </div>
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-[#D4AF37]/10 bg-[#D4AF37]/5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-gray-400">Recovery Opportunity</span>
          <span className="text-sm font-bold text-[#D4AF37]">{formatCurrency(opportunity)}</span>
        </div>
      </div>
    </section>
  );
}

function SystemHealth() {
  const systems = [
    { name: "Database", status: "Operational", icon: <Activity size={13} /> },
    { name: "Order Engine", status: "Operational", icon: <Package size={13} /> },
    { name: "Recovery Engine", status: "Operational", icon: <Zap size={13} /> },
    { name: "Notifications", status: "Operational", icon: <Bell size={13} /> },
  ];
  return (
    <section className="rounded-[28px] border border-white/10 bg-[#0d0d0d] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Infrastructure</p>
          <h3 className="mt-2 text-base font-bold text-white">System Health</h3>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
          <Check size={16} className="text-emerald-400" />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {systems.map((system, index) => (
          <div key={`system-health-${system.name}-${index}`} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 p-3">
            <div className="flex items-center gap-3">
              <div className="text-gray-400">{system.icon}</div>
              <span className="text-[10px] font-semibold text-gray-300">{system.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400">{system.status}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-[330px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-gray-500">{icon}</div>
      <h3 className="mt-5 text-sm font-bold text-gray-300">{title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-5 text-gray-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}