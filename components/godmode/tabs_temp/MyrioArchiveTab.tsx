"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Archive, ShieldCheck, Database, Trash2, RefreshCcw, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import type { MonthlyArchiveReport } from "@/lib/myrio/data-lifecycle";

export default function MyrioArchiveTab() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<MonthlyArchiveReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const executeArchiveCycle = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/godmode/archive", { method: "POST" });
      const json = await res.json();
      if (json.success && json.data) {
        setReport(json.data);
      } else {
        setErrorMsg(json.error || "Archive execution encountered a validation check failure.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network communication error during archive execution.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20 font-sans text-white">
      {/* Header */}
      <div className="bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Archive size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">Data Governance & Retention</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[8px] font-bold text-purple-300 uppercase">
                Monthly Lifecycle Engine
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-black mt-1">Monthly Data Archive & Cleanup</h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Deterministic archival of closed orders and old telemetry records with SHA-256 integrity verification before server pruning.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={executeArchiveCycle}
          disabled={loading}
          className="px-6 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
          {loading ? "Verifying & Archiving..." : "Execute Monthly Archive Run"}
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle size={16} /> {errorMsg}
        </div>
      )}

      {/* Report View */}
      {report && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Archive Identifier</p>
              <p className="text-xl font-mono font-bold text-[#D4AF37] mt-2">{report.archiveId}</p>
              <p className="text-[10px] text-gray-500 mt-1">Checksum Verified</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Records Archived</p>
              <p className="text-3xl font-mono font-bold text-white mt-2">
                {report.recordsArchived.orders + report.recordsArchived.auditLogs + report.recordsArchived.learningEvents}
              </p>
              <p className="text-[10px] text-gray-500 mt-1">Orders, Audit Logs & Events</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Server Records Pruned</p>
              <p className="text-3xl font-mono font-bold text-emerald-400 mt-2">{report.recordsDeleted}</p>
              <p className="text-[10px] text-gray-500 mt-1">Safely purged after validation</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Integrity Checksum</p>
              <p className="text-xs font-mono text-cyan-300 mt-3 truncate">{report.checksumHash}</p>
              <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-bold">
                <CheckCircle2 size={11} /> SHA-256 Validated
              </p>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Archival Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <p className="text-gray-500">Orders Archived:</p>
                <p className="text-lg font-bold text-white mt-1">{report.recordsArchived.orders}</p>
              </div>
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <p className="text-gray-500">Audit Logs Archived:</p>
                <p className="text-lg font-bold text-white mt-1">{report.recordsArchived.auditLogs}</p>
              </div>
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <p className="text-gray-500">Learning Events Archived:</p>
                <p className="text-lg font-bold text-white mt-1">{report.recordsArchived.learningEvents}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}