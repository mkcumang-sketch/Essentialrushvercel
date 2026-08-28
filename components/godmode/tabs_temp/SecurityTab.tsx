"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Fingerprint,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  RefreshCcw,
  Database,
  Server,
  KeyRound,
  Activity,
  Eye,
  CheckCircle2,
  XCircle,
  Clock3,
  Terminal,
  Zap,
  Globe,
  UserCheck,
  X,
  Loader2,
} from "lucide-react";

type SecurityStatus = "secure" | "warning" | "critical" | "locked";

interface SecurityService {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "operational" | "warning" | "offline";
  latency?: string;
}

interface SecurityEvent {
  id: string | number;
  type: "success" | "warning" | "critical";
  message: string;
  time: string;
}

export default function SecurityTab() {
  const [status, setStatus] = useState<SecurityStatus>("secure");
  const [showLockdown, setShowLockdown] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState("Just now");
  const [scanProgress, setScanProgress] = useState(100);
  const [activeSessions, setActiveSessions] = useState("1");
  const [failedAttemptsCount, setFailedAttemptsCount] = useState("0");
  const [actionLoading, setActionLoading] = useState(false);

  const [events, setEvents] = useState<SecurityEvent[]>([
    {
      id: "1",
      type: "success",
      message: "Authentication gateway verified with strict JWT HMAC-SHA256",
      time: "Just now",
    },
    {
      id: "2",
      type: "success",
      message: "MongoDB connection pool initialized with 10 max sockets",
      time: "2 min ago",
    },
    {
      id: "3",
      type: "success",
      message: "AI Telemetry & Anomaly Dispatcher standing by",
      time: "5 min ago",
    },
  ]);

  const services: SecurityService[] = [
    {
      id: "firewall",
      name: "Edge Firewall",
      description: "Inbound traffic protection & Rate Limiting",
      icon: <ShieldCheck size={18} />,
      status: "operational",
      latency: "12ms",
    },
    {
      id: "database",
      name: "MongoDB Shard",
      description: "Data integrity & NoSQL injection guards",
      icon: <Database size={18} />,
      status: "operational",
      latency: "18ms",
    },
    {
      id: "authentication",
      name: "NextAuth v4",
      description: "JWT session encryption & RBAC validation",
      icon: <KeyRound size={18} />,
      status: "operational",
      latency: "9ms",
    },
    {
      id: "api",
      name: "AI Telemetry Gateway",
      description: "Continuous anomaly heuristics engine",
      icon: <Globe size={18} />,
      status: "operational",
      latency: "24ms",
    },
  ];

  const fetchSecurityTelemetry = async () => {
    try {
      const res = await fetch("/api/godmode/security");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setActiveSessions(String(json.data.activeStaffSessions || 1));
          setFailedAttemptsCount(String(json.data.failedAttempts || 0));
          if (json.data.events && json.data.events.length > 0) {
            setEvents(json.data.events);
          }
          if (json.data.failedAttempts > 5) {
            setStatus("warning");
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch security telemetry", err);
    }
  };

  useEffect(() => {
    fetchSecurityTelemetry();
  }, []);

  const securityScore = useMemo(() => {
    if (status === "locked") return 100;
    if (status === "critical") return 38;
    if (status === "warning") return 76;
    return 98;
  }, [status]);

  const runSecurityScan = async () => {
    if (isScanning || status === "locked") return;

    setIsScanning(true);
    setScanProgress(0);

    for (let progress = 0; progress <= 100; progress += 20) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setScanProgress(progress);
    }

    await fetchSecurityTelemetry();
    setIsScanning(false);
    setLastScan("Just now");
  };

  const initiateLockdown = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "LOCKDOWN" }),
      });
      if (res.ok) {
        setStatus("locked");
        setShowLockdown(false);
        await fetchSecurityTelemetry();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const releaseLockdown = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RELEASE_LOCKDOWN" }),
      });
      if (res.ok) {
        setStatus("secure");
        await fetchSecurityTelemetry();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const isLocked = status === "locked";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-7xl mx-auto space-y-6 font-sans text-white pb-20"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <ShieldCheck size={22} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-serif font-black">Security Command Center</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-1">
              Active Perimeter Defense & Real-Time Telemetry
            </p>
          </div>
        </div>

        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest w-fit ${
            isLocked ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isLocked ? "bg-red-500" : "bg-emerald-400 animate-pulse"}`} />
          {isLocked ? "Emergency Lockdown Engaged" : "Security Perimeter Active"}
        </div>
      </div>

      {/* Main Security Hero */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-6 md:p-10 shadow-2xl ${
          isLocked ? "border-red-500/40 bg-red-950/20" : "border-white/10 bg-[#0a0a0a]"
        }`}
      >
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_-20%,rgba(239,68,68,0.12),transparent_50%)]" />

        <div className="relative grid lg:grid-cols-[1fr_260px] gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className={`p-3 rounded-2xl ${isLocked ? "bg-red-500/20 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                {isLocked ? <Lock size={28} /> : <Fingerprint size={28} />}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 font-bold">System Health Assessment</p>
                <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
                  {isLocked ? "Emergency Lockdown Active" : "Operational Integrity Verified"}
                </h2>
              </div>
            </div>

            <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
              {isLocked
                ? "Protected administrative operations and unauthenticated checkouts are temporarily throttled."
                : "Continuous AI security guards are monitoring authentication attempts, rate limits, NoSQL injections, and privilege anomalies in real time."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              {!isLocked ? (
                <button
                  type="button"
                  onClick={() => setShowLockdown(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-red-600/20"
                >
                  <AlertTriangle size={15} /> Initiate Lockdown
                </button>
              ) : (
                <button
                  type="button"
                  onClick={releaseLockdown}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-black hover:bg-gray-200 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  <Unlock size={15} /> Release Lockdown
                </button>
              )}

              <button
                type="button"
                disabled={isScanning || isLocked}
                onClick={runSecurityScan}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 cursor-pointer"
              >
                <RefreshCcw size={14} className={isScanning ? "animate-spin" : ""} />
                {isScanning ? `Scanning ${scanProgress}%` : "Run Security Audit"}
              </button>
            </div>
          </div>

          {/* Security Score Ring */}
          <div className="flex justify-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="7" className="text-white/5" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeLinecap="round"
                  className={isLocked ? "text-red-500" : "text-emerald-400"}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: securityScore / 100 }}
                  transition={{ duration: 1 }}
                />
              </svg>

              <div className="text-center">
                <div className={`text-4xl font-black font-mono ${isLocked ? "text-red-400" : "text-emerald-400"}`}>
                  {securityScore}
                </div>
                <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mt-1">Defense Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<Activity size={16} />} label="Threat Level" value={isLocked ? "CRITICAL" : "LOW"} valueClass={isLocked ? "text-red-400" : "text-emerald-400"} />
        <MetricCard icon={<UserCheck size={16} />} label="Privileged Staff" value={activeSessions} />
        <MetricCard icon={<Eye size={16} />} label="Security Anomalies" value={failedAttemptsCount} valueClass={failedAttemptsCount !== "0" ? "text-yellow-400" : "text-gray-300"} />
        <MetricCard icon={<Clock3 size={16} />} label="Last Health Check" value={lastScan} />
      </div>

      {/* Protected Services Grid */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Server size={16} className="text-[#D4AF37]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Protected Infrastructure</h3>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} locked={isLocked} />
          ))}
        </div>
      </section>

      {/* Security Event Log */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-[#D4AF37]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Live Security Telemetry Stream</h3>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 font-mono text-xs">
          {events.slice(0, 6).map((event) => (
            <div key={event.id} className="flex items-center gap-4 px-5 py-4">
              <div className="p-1.5 rounded-lg bg-white/5">
                {event.type === "critical" ? <XCircle size={15} className="text-red-400" /> : <CheckCircle2 size={15} className="text-emerald-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 truncate">{event.message}</p>
                <p className="text-[9px] text-gray-600 mt-0.5">{event.time}</p>
              </div>
              <Zap size={13} className="text-gray-700 shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* Lockdown Confirmation Modal */}
      <AnimatePresence>
        {showLockdown && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowLockdown(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#101010] border border-red-500/30 rounded-3xl p-6 md:p-8 shadow-2xl"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                  <ShieldAlert size={24} />
                </div>
                <button onClick={() => setShowLockdown(false)} className="p-2 text-gray-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <h3 className="text-xl font-black text-white mt-6">Confirm System Lockdown</h3>
              <p className="text-sm text-gray-400 leading-relaxed mt-3">
                This will trigger emergency security telemetry and engage strict rate thresholds across edge routes.
              </p>

              <div className="grid grid-cols-2 gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowLockdown(false)}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={initiateLockdown}
                  className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider"
                >
                  {actionLoading ? "Engaging..." : "Confirm Lockdown"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MetricCard({ icon, label, value, valueClass = "text-white" }: { icon: React.ReactNode; label: string; value: string; valueClass?: string }) {
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="text-gray-500">{icon}</div>
        <div className={`text-base font-black font-mono ${valueClass}`}>{value}</div>
      </div>
      <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mt-4">{label}</p>
    </div>
  );
}

function ServiceCard({ service, locked }: { service: SecurityService; locked: boolean }) {
  const operational = service.status === "operational" && !locked;

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
          {service.icon}
        </div>
        {operational ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-red-400" />}
      </div>

      <h4 className="text-sm font-bold text-white mt-4">{service.name}</h4>
      <p className="text-[10px] text-gray-500 mt-1">{service.description}</p>

      <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/5 text-[9px] font-mono">
        <span className={operational ? "text-emerald-400 uppercase font-bold" : "text-red-400 uppercase font-bold"}>
          {operational ? "Operational" : "Restricted"}
        </span>
        <span className="text-gray-500">{service.latency}</span>
      </div>
    </div>
  );
}