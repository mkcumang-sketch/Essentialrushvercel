"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  RefreshCcw,
  CheckCircle2,
  Terminal,
  Send,
  Loader2,
  Package,
  TrendingDown,
  Lock,
  ArrowRight,
  Clock,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

interface SystemMetrics {
  totalOrdersToday: number;
  pendingOrdersCount: number;
  delayedOrdersCount: number;
  failedPaymentsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  activeIncidentsCount: number;
  unresolvedAlertsCount: number;
  cartAbandonmentRate: number;
}

interface Issue {
  id: string;
  category: string;
  severity: string;
  title: string;
  possibleCause: string;
  impact: string;
  recommendedFix: string;
  actionRequired: "AUTO_SAFE" | "HUMAN_APPROVAL";
}

export default function AiCommandCenterTab() {
  const [healthScore, setHealthScore] = useState<number>(100);
  const [threatLevel, setThreatLevel] = useState<string>("LOW");
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat/Query State
  const [queryInput, setQueryInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    {
      role: "ai",
      text: "AI Operations Assistant online. Ask me about delayed orders, inventory shortages, security anomalies, or error incidents.",
    },
  ]);
  const [isQuerying, setIsQuerying] = useState(false);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/command");
      const json = await res.json();
      if (json.success && json.data) {
        setHealthScore(json.data.systemHealthScore);
        setThreatLevel(json.data.securityThreatLevel);
        setMetrics(json.data.metrics);
        setIssues(json.data.highPriorityIssues || []);
      }
    } catch (err) {
      console.error("AI Audit Fetch Error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = queryInput.trim();
    if (!clean || isQuerying) return;

    const userMessage = { role: "user" as const, text: clean };
    setChatHistory((prev) => [...prev, userMessage]);
    setQueryInput("");
    setIsQuerying(true);

    try {
      const res = await fetch("/api/ai/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "QUERY", query: clean }),
      });
      const data = await res.json();
      if (data.success && data.response) {
        setChatHistory((prev) => [...prev, { role: "ai", text: data.response }]);
      } else {
        setChatHistory((prev) => [...prev, { role: "ai", text: "Unable to process query." }]);
      }
    } catch {
      setChatHistory((prev) => [...prev, { role: "ai", text: "Network error occurred." }]);
    } finally {
      setIsQuerying(false);
    }
  };

  const resolveIssue = async (issueId: string) => {
    try {
      await fetch("/api/ai/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESOLVE_INCIDENT", incidentId: issueId }),
      });
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
        <Loader2 size={36} className="animate-spin text-[#D4AF37]" />
        <p className="text-xs uppercase font-black tracking-widest text-gray-400">
          Running Real-Time AI System Diagnostics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-white">
      {/* Top Banner */}
      <div className="bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Zap size={140} className="text-[#D4AF37]" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-lg">
              <Sparkles size={26} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight text-[#D4AF37]">
                  AI Operations & Command Intelligence
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[8px] font-black uppercase tracking-widest text-emerald-400">
                  Continuous Telemetry Active
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Autonomous monitoring of orders, inventory, cybersecurity, and runtime performance.
              </p>
            </div>
          </div>

          <button
            onClick={fetchAuditData}
            className="px-5 py-3.5 bg-white/5 hover:bg-[#D4AF37] hover:text-black border border-white/15 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <RefreshCcw size={14} /> Run Deep Diagnostic
          </button>
        </div>
      </div>

      {/* KPI Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* System Health Score */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Health Score</span>
            <ShieldCheck size={18} className={healthScore >= 80 ? "text-emerald-400" : "text-orange-400"} />
          </div>
          <p className="text-4xl font-black font-mono mt-4">{healthScore}%</p>
          <p className="text-[10px] text-gray-500 mt-1">Calculated from 12 operational vectors</p>
        </div>

        {/* Security Threat Level */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Security Threat Level</span>
            <Lock size={18} className={threatLevel === "LOW" ? "text-emerald-400" : "text-red-400"} />
          </div>
          <p className={`text-3xl font-black font-mono mt-4 ${threatLevel === "LOW" ? "text-emerald-400" : "text-red-400"}`}>
            {threatLevel}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">Zero unauthorized admin sessions</p>
        </div>

        {/* Delayed Orders */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Delayed Deliveries</span>
            <Clock size={18} className="text-orange-400" />
          </div>
          <p className="text-4xl font-black font-mono mt-4 text-orange-400">{metrics?.delayedOrdersCount || 0}</p>
          <p className="text-[10px] text-gray-500 mt-1">Orders exceeding 48h SLA</p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock Out / Depletion</span>
            <Package size={18} className="text-purple-400" />
          </div>
          <p className="text-4xl font-black font-mono mt-4 text-purple-400">{metrics?.outOfStockCount || 0}</p>
          <p className="text-[10px] text-gray-500 mt-1">{metrics?.lowStockCount || 0} items near depletion threshold</p>
        </div>
      </div>

      {/* Main Grid: AI Findings & Conversational Command Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: AI Operational Diagnoses */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-[#D4AF37]" />
              <h2 className="text-base font-bold uppercase tracking-wider">Detected Operational Issues</h2>
            </div>
            <span className="text-xs font-mono text-gray-400">{issues.length} Items</span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[420px] pr-2">
            {issues.length === 0 ? (
              <div className="py-16 text-center text-gray-500 text-xs uppercase tracking-widest flex flex-col items-center gap-2">
                <CheckCircle2 size={28} className="text-emerald-400" />
                All operational systems and orders are in optimal state.
              </div>
            ) : (
              issues.map((issue) => (
                <div
                  key={issue.id}
                  className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3 hover:border-[#D4AF37]/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        issue.severity === "CRITICAL"
                          ? "bg-red-500/20 text-red-400"
                          : issue.severity === "HIGH"
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {issue.severity} • {issue.category}
                    </span>

                    <button
                      onClick={() => resolveIssue(issue.id)}
                      className="text-[9px] text-emerald-400 hover:underline uppercase font-bold cursor-pointer"
                    >
                      Mark Resolved
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-white">{issue.title}</h3>

                  <div className="text-[11px] text-gray-400 space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                    <p><strong className="text-gray-300">Cause:</strong> {issue.possibleCause}</p>
                    <p><strong className="text-gray-300">Impact:</strong> {issue.impact}</p>
                    <p><strong className="text-[#D4AF37]">Recommendation:</strong> {issue.recommendedFix}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Interactive AI Command Assistant Terminal */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Terminal size={18} className="text-[#D4AF37]" />
              <h2 className="text-base font-bold uppercase tracking-wider">AI Operations Assistant</h2>
            </div>
            <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded font-mono text-gray-400">v2.4 Engine</span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[340px] pr-2 mb-4 font-mono text-xs">
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-2xl leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-white ml-8"
                    : "bg-white/5 border border-white/10 text-gray-300 mr-4 whitespace-pre-line"
                }`}
              >
                <div className="text-[9px] uppercase font-bold text-gray-500 mb-1">
                  {msg.role === "user" ? "Administrator" : "AI Orchestrator"}
                </div>
                {msg.text}
              </div>
            ))}
            {isQuerying && (
              <div className="p-3 bg-white/5 rounded-2xl flex items-center gap-2 text-xs text-gray-400">
                <Loader2 size={14} className="animate-spin text-[#D4AF37]" /> Querying live database...
              </div>
            )}
          </div>

          {/* Query Input Bar */}
          <form onSubmit={handleSendQuery} className="flex gap-2">
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="e.g. 'Show delayed orders', 'Find security alerts'..."
              className="flex-1 bg-black border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 outline-none focus:border-[#D4AF37]"
            />
            <button
              type="submit"
              disabled={isQuerying || !queryInput.trim()}
              className="px-5 py-3 bg-[#D4AF37] text-black font-black uppercase text-xs rounded-xl hover:bg-white transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Send size={13} /> Ask
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}