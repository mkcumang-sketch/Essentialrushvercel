"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, ShieldCheck, Cpu, DollarSign, Clock, RefreshCcw, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import type { SystemHealthReport } from "@/lib/myrio/self-health";

export default function MyrioHealthTab() {
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/godmode/health");
      const json = await res.json();
      if (json.success && json.data) {
        setReport(json.data);
      }
    } catch (err) {
      console.error("Health report fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 text-center font-sans text-white">
        <Loader2 size={36} className="animate-spin text-[#D4AF37]" />
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
          Diagnosing MYRIO Core Self-Health & Telemetry...
        </p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20 font-sans text-white">
      {/* Header */}
      <div className="bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Autonomous Telemetry & Latency</span>
              <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase ${
                report?.aiAvailabilityStatus === "HEALTHY" 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-orange-500/10 border-orange-500/30 text-orange-400"
              }`}>
                {report?.aiAvailabilityStatus}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-black mt-1">MYRIO Self-Health & Daily Intelligence</h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Monitors AI service availability, execution latency, token costs, and compiles proactive daily summaries.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchHealth}
          className="px-6 py-3.5 bg-white/5 hover:bg-emerald-500 hover:text-black border border-white/15 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
        >
          <RefreshCcw size={14} /> Refresh Health Diagnostics
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Execution Latency</p>
          <p className="text-3xl font-mono font-bold text-white mt-2">{report?.metrics.averageLatencyMs} ms</p>
          <p className="text-[10px] text-gray-500 mt-1">Average inference & tool turn time</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Tool Failure Rate</p>
          <p className="text-3xl font-mono font-bold text-emerald-400 mt-2">{report?.metrics.toolFailureRate}%</p>
          <p className="text-[10px] text-gray-500 mt-1">Zero critical exceptions recorded</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Estimated Token Usage</p>
          <p className="text-3xl font-mono font-bold text-[#D4AF37] mt-2">
            {(report?.metrics.estimatedDailyTokenUsage || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">Daily telemetry consumption</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Estimated AI Cost</p>
          <p className="text-3xl font-mono font-bold text-cyan-400 mt-2">${report?.metrics.estimatedCostUsd}</p>
          <p className="text-[10px] text-gray-500 mt-1">Optimized cost control</p>
        </div>
      </div>

      {/* Daily Intelligence & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/10 pb-4">Daily Intelligence Summary</h3>
          <div className="space-y-3 text-xs">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <p className="text-gray-500 font-bold uppercase text-[9px]">Business Activity:</p>
              <p className="text-white mt-1">{report?.dailySummary.businessActivity}</p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <p className="text-gray-500 font-bold uppercase text-[9px]">Operational Status:</p>
              <p className="text-orange-400 mt-1">{report?.dailySummary.operationalAlerts}</p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <p className="text-gray-500 font-bold uppercase text-[9px]">Security Perimeter:</p>
              <p className="text-emerald-400 mt-1">{report?.dailySummary.securityThreats}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/10 pb-4">Proactive Recommendations</h3>
          <div className="space-y-3">
            {report?.recommendedActions.map((rec, idx) => (
              <div key={idx} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-gray-300 flex items-start gap-2">
                <span className="text-[#D4AF37] font-bold">•</span> {rec}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}