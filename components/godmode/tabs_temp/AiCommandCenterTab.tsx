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
  Clock,
  Sparkles,
  Brain,
  Scale,
  XCircle,
  TrendingUp,
} from "lucide-react";
import type { LearningCenterMetrics } from "@/lib/myrio/learning-loop";
import type { TruthAnalysisReport } from "@/lib/myrio/truth-engine";

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
}

export default function AiCommandCenterTab() {
  const [activeSubTab, setActiveSubTab] = useState<"COMMAND" | "LEARNING" | "TRUTH">("COMMAND");

  const [healthScore, setHealthScore] = useState<number>(100);
  const [threatLevel, setThreatLevel] = useState<string>("LOW");
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  const [learningData, setLearningData] = useState<LearningCenterMetrics | null>(null);
  const [truthData, setTruthData] = useState<TruthAnalysisReport | null>(null);

  const [queryInput, setQueryInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    {
      role: "ai",
      text: "MYRIO Admin Intelligence online. Ask me about delayed orders, inventory shortages, security threats, or run deep diagnostics.",
    },
  ]);
  const [isQuerying, setIsQuerying] = useState(false);

  const fetchAllTelemetry = async () => {
    setLoading(true);
    try {
      const [cmdRes, learnRes, truthRes] = await Promise.all([
        fetch("/api/ai/command"),
        fetch("/api/myrio/learning"),
        fetch("/api/myrio/truth"),
      ]);

      const [cmdJson, learnJson, truthJson] = await Promise.all([
        cmdRes.json(),
        learnRes.json(),
        truthRes.json(),
      ]);

      if (cmdJson.success && cmdJson.data) {
        setHealthScore(cmdJson.data.systemHealthScore);
        setThreatLevel(cmdJson.data.securityThreatLevel);
        setMetrics(cmdJson.data.metrics);
        setIssues(cmdJson.data.highPriorityIssues || []);
      }
      if (learnJson.success && learnJson.data) setLearningData(learnJson.data);
      if (truthJson.success && truthJson.data) setTruthData(truthJson.data);
    } catch (err) {
      console.error("MYRIO Telemetry Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTelemetry();
  }, []);

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = queryInput.trim();
    if (!clean || isQuerying) return;

    setChatHistory((prev) => [...prev, { role: "user", text: clean }]);
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
      setChatHistory((prev) => [...prev, { role: "ai", text: "Network communication error." }]);
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
      <div className="py-28 flex flex-col items-center justify-center gap-4 text-center font-sans text-white">
        <Loader2 size={38} className="animate-spin text-[#D4AF37]" />
        <p className="text-xs uppercase font-black tracking-widest text-gray-400">
          Initializing Unified MYRIO Intelligence Core...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-white pb-24">
      {/* Top Banner & Sub-Navigation */}
      <div className="bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
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
                  MYRIO Admin Intelligence
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[8px] font-black uppercase tracking-widest text-emerald-400">
                  Unified Core Active
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Centralized operations, empirical learning loops, and neutral truth analysis.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchAllTelemetry}
            className="px-5 py-3.5 bg-white/5 hover:bg-[#D4AF37] hover:text-black border border-white/15 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <RefreshCcw size={14} /> Full Telemetry Sync
          </button>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex gap-2 mt-8 border-t border-white/10 pt-6 overflow-x-auto">
          {[
            { id: "COMMAND", label: "Operations & Command", icon: Terminal },
            { id: "LEARNING", label: "Empirical Learning Center", icon: Brain },
            { id: "TRUTH", label: "Fair Analysis & Truth Mode", icon: Scale },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  activeSubTab === tab.id
                    ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20"
                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: COMMAND & OPERATIONS CONSOLE                   */}
      {/* ========================================================= */}
      {activeSubTab === "COMMAND" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Health Score</span>
                <ShieldCheck size={18} className={healthScore >= 80 ? "text-emerald-400" : "text-orange-400"} />
              </div>
              <p className="text-4xl font-black font-mono mt-4">{healthScore}%</p>
              <p className="text-[10px] text-gray-500 mt-1">Calculated from 12 operational vectors</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Security Threat Level</span>
                <ShieldCheck size={18} className={threatLevel === "LOW" ? "text-emerald-400" : "text-red-400"} />
              </div>
              <p className={`text-3xl font-black font-mono mt-4 ${threatLevel === "LOW" ? "text-emerald-400" : "text-red-400"}`}>
                {threatLevel}
              </p>
              <p className="text-[10px] text-gray-500 mt-1">Zero unauthorized admin sessions</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Delayed Deliveries</span>
                <Clock size={18} className="text-orange-400" />
              </div>
              <p className="text-4xl font-black font-mono mt-4 text-orange-400">{metrics?.delayedOrdersCount || 0}</p>
              <p className="text-[10px] text-gray-500 mt-1">Orders exceeding 48h SLA</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock Out / Depletion</span>
                <Package size={18} className="text-purple-400" />
              </div>
              <p className="text-4xl font-black font-mono mt-4 text-purple-400">{metrics?.outOfStockCount || 0}</p>
              <p className="text-[10px] text-gray-500 mt-1">{metrics?.lowStockCount || 0} items near depletion threshold</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    <div key={issue.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                          {issue.severity} • {issue.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => resolveIssue(issue.id)}
                          className="text-[9px] text-emerald-400 hover:underline uppercase font-bold cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      </div>
                      <h3 className="text-sm font-bold text-white">{issue.title}</h3>
                      <div className="text-[11px] text-gray-400 space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                        <p><strong className="text-gray-300">Cause:</strong> {issue.possibleCause}</p>
                        <p><strong className="text-[#D4AF37]">Recommendation:</strong> {issue.recommendedFix}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-[#D4AF37]" />
                  <h2 className="text-base font-bold uppercase tracking-wider">MYRIO Command Assistant</h2>
                </div>
                <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded font-mono text-gray-400">v3.0 Engine</span>
              </div>

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
                      {msg.role === "user" ? "Administrator" : "MYRIO Core"}
                    </div>
                    {msg.text}
                  </div>
                ))}
                {isQuerying && (
                  <div className="p-3 bg-white/5 rounded-2xl flex items-center gap-2 text-xs text-gray-400">
                    <Loader2 size={14} className="animate-spin text-[#D4AF37]" /> Querying database knowledge...
                  </div>
                )}
              </div>

              <form onSubmit={handleSendQuery} className="flex gap-2">
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Ask MYRIO anything about orders, stock, or security..."
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
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: LEARNING CENTER                                */}
      {/* ========================================================= */}
      {activeSubTab === "LEARNING" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Prediction Accuracy</p>
              <p className="text-3xl font-mono font-bold text-emerald-400 mt-2">{learningData?.accuracyRate || 0}%</p>
              <p className="text-[10px] text-gray-500 mt-1">{learningData?.accuratePredictions} of {learningData?.totalEvaluated} accurate</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Total Recorded</p>
              <p className="text-3xl font-mono font-bold text-white mt-2">{learningData?.totalPredictionsRecorded || 0}</p>
              <p className="text-[10px] text-gray-500 mt-1">Evaluated prediction events</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">High Confidence</p>
              <p className="text-3xl font-mono font-bold text-[#D4AF37] mt-2">{learningData?.confidenceDistribution.high || 0}</p>
              <p className="text-[10px] text-gray-500 mt-1">Confidence &ge; 80%</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Calibration Anomalies</p>
              <p className="text-3xl font-mono font-bold text-orange-400 mt-2">
                {(learningData?.falsePositives || 0) + (learningData?.falseNegatives || 0)}
              </p>
              <p className="text-[10px] text-gray-500 mt-1">Requires loop adjustment</p>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <Sparkles size={16} className="text-[#D4AF37]" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Prediction vs Actual Outcome Log</h3>
            </div>
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
              {learningData?.recentLearnings.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-12">No evaluated predictions to display.</p>
              ) : (
                learningData?.recentLearnings.map((item: { id: string; domain: string; predicted: string; actual: string; isAccurate: boolean; confidence: number }) => (
                  <div key={item.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300 font-bold">{item.domain}</span>
                      <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${item.isAccurate ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400"}`}>
                        {item.isAccurate ? "Validated" : "Calibration Needed"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                      <p><span className="text-gray-500">Predicted:</span> {item.predicted} ({item.confidence}%)</p>
                      <p><span className="text-gray-500">Actual:</span> {item.actual}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: TRUTH MODE & FAIR ANALYSIS                     */}
      {/* ========================================================= */}
      {activeSubTab === "TRUTH" && (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-white/[0.04] to-transparent border border-white/10 p-6 md:p-8 rounded-3xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Executive Summary Verdict</span>
              <span className="text-xs font-mono font-bold text-[#D4AF37]">Confidence: {truthData?.confidence}%</span>
            </div>
            <p className="text-lg font-serif font-bold text-white">{truthData?.summaryVerdict}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={16} /> What Is Working
              </h3>
              <ul className="space-y-2 text-xs text-gray-300">
                {truthData?.positives.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5"><span className="text-emerald-400">•</span> {item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 border border-red-500/20 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <XCircle size={16} /> What Is Failing
              </h3>
              <ul className="space-y-2 text-xs text-gray-300">
                {truthData?.negatives.map((item: string, idx: number) => (
                  <span key={idx} className="flex items-start gap-1.5 text-xs text-gray-300 block"><span className="text-red-400">•</span> {item}</span>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 border border-orange-500/20 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <AlertTriangle size={16} /> Identified Risks
              </h3>
              <ul className="space-y-2 text-xs text-gray-300">
                {truthData?.risks.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5"><span className="text-orange-400">•</span> {item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 border border-blue-500/20 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <TrendingUp size={16} /> Opportunities
              </h3>
              <ul className="space-y-2 text-xs text-gray-300">
                {truthData?.opportunities.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5"><span className="text-blue-400">•</span> {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}