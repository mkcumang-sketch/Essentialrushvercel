"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Sparkles,
  Layers,
  ArrowUpRight,
  Loader2,
  HelpCircle,
  Database,
} from "lucide-react";
import type { LearningCenterMetrics } from "@/lib/myrio/learning-loop";

export default function MyrioLearningTab() {
  const [metrics, setMetrics] = useState<LearningCenterMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState<string | null>(null);

  const fetchLearningTelemetry = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/myrio/learning");
      const json = await res.json();
      if (json.success && json.data) {
        setMetrics(json.data);
      }
    } catch (err) {
      console.error("Learning metrics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearningTelemetry();
  }, []);

  const triggerEvaluationCycle = async () => {
    setIsEvaluating(true);
    setEvaluationFeedback(null);
    try {
      const res = await fetch("/api/myrio/learning", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setEvaluationFeedback(json.message);
        await fetchLearningTelemetry();
      }
    } catch {
      setEvaluationFeedback("Failed to complete evaluation cycle.");
    } finally {
      setIsEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 text-center font-sans text-white">
        <Loader2 size={36} className="animate-spin text-[#D4AF37]" />
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
          Loading MYRIO Empirical Learning Matrix...
        </p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20 font-sans text-white">
      {/* Header Banner */}
      <div className="bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <Brain size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">Empirical Intelligence Layer</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[8px] font-bold text-emerald-400 uppercase">
                Continuous Learning
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-black mt-1">MYRIO Learning Center</h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Evaluates past predictions vs. verified real-world outcomes without synthetic metrics.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={triggerEvaluationCycle}
          disabled={isEvaluating}
          className="px-6 py-3.5 bg-[#D4AF37] hover:bg-white text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isEvaluating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
          {isEvaluating ? "Evaluating..." : "Run Outcome Evaluation"}
        </button>
      </div>

      {evaluationFeedback && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 size={16} /> {evaluationFeedback}
        </div>
      )}

      {/* Real Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Prediction Accuracy</p>
          <p className="text-3xl font-mono font-bold text-emerald-400 mt-2">{metrics?.accuracyRate || 0}%</p>
          <p className="text-[10px] text-gray-500 mt-1">
            {metrics?.accuratePredictions} of {metrics?.totalEvaluated} evaluated events accurate
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Predictions Recorded</p>
          <p className="text-3xl font-mono font-bold text-white mt-2">{metrics?.totalPredictionsRecorded || 0}</p>
          <p className="text-[10px] text-gray-500 mt-1">Across Orders, Inventory & Carts</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">High-Confidence Events</p>
          <p className="text-3xl font-mono font-bold text-[#D4AF37] mt-2">{metrics?.confidenceDistribution.high || 0}</p>
          <p className="text-[10px] text-gray-500 mt-1">Confidence score &ge; 80%</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Calibration Anomalies</p>
          <p className="text-3xl font-mono font-bold text-orange-400 mt-2">
            {(metrics?.falsePositives || 0) + (metrics?.falseNegatives || 0)}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">False positives & negatives under recalibration</p>
        </div>
      </div>

      {/* Domain Performance & Learning Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Domain Specific Calibration */}
        <div className="lg:col-span-5 bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Layers size={16} className="text-[#D4AF37]" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Domain Accuracy Matrix</h3>
          </div>

          <div className="space-y-4">
            {Object.keys(metrics?.domainBreakdown || {}).length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8">No domain evaluations recorded yet.</p>
            ) : (
              Object.entries(metrics?.domainBreakdown || {}).map(([domain, stat]) => (
                <div key={domain} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{domain.replace(/_/g, " ")}</span>
                    <span className="font-mono font-bold text-emerald-400">{stat.accuracyRate}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4AF37] rounded-full" style={{ width: `${stat.accuracyRate}%` }} />
                  </div>
                  <p className="text-[9px] text-gray-500">
                    {stat.accurate} of {stat.total} accurate predictions
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Evaluated Prediction Log */}
        <div className="lg:col-span-7 bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#D4AF37]" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Prediction vs Actual Outcome Log</h3>
            </div>
            <span className="text-xs font-mono text-gray-400">{metrics?.recentLearnings.length} Records</span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
            {metrics?.recentLearnings.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-12">No evaluated predictions to display.</p>
            ) : (
              metrics?.recentLearnings.map((item) => (
                <div key={item.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300 font-bold">
                      {item.domain}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        item.isAccurate ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400"
                      }`}
                    >
                      {item.isAccurate ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                      {item.isAccurate ? "Validated" : "Calibration Needed"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 font-mono">
                    <p><span className="text-gray-500">Predicted:</span> {item.predicted} ({item.confidence}%)</p>
                    <p><span className="text-gray-500">Actual:</span> {item.actual}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}