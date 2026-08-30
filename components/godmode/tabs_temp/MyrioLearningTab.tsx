"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  TrendingUp,
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  Award,
  Zap,
  Tag,
} from "lucide-react";

export default function MyrioLearningTab() {
  const [activeSubTab, setActiveSubTab] = useState<"TRENDS" | "TRAINING">("TRENDS");
  const [trendRadar, setTrendRadar] = useState<any[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);

  // Custom Training Form
  const [rules, setRules] = useState<any[]>([]);
  const [triggerQuery, setTriggerQuery] = useState("");
  const [responseGuideline, setResponseGuideline] = useState("");
  const [tone, setTone] = useState("Luxury Concierge");
  const [category, setCategory] = useState("OBJECTION");
  const [isSavingRule, setIsSavingRule] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/myrio/learning");
      const data = await res.json();
      if (data.success && data.rules) setRules(data.rules);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const runTrendRadar = useCallback(async () => {
    setLoadingTrends(true);
    try {
      const res = await fetch("/api/myrio/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TREND_RADAR" }),
      });
      const data = await res.json();
      if (data.success && data.radar) setTrendRadar(data.radar);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTrends(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
    runTrendRadar();
  }, [fetchRules, runTrendRadar]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerQuery.trim() || !responseGuideline.trim()) return;

    setIsSavingRule(true);
    try {
      const res = await fetch("/api/myrio/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_RULE",
          triggerQuery,
          responseGuideline,
          tone,
          category,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTriggerQuery("");
        setResponseGuideline("");
        fetchRules();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await fetch("/api/myrio/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_RULE", id }),
      });
      setRules((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 font-sans text-white pb-24">
      {/* HEADER */}
      <div className="bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <Brain size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">Empirical Intelligence Hub</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[8px] font-bold text-emerald-400 uppercase">
                Active Training
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-black mt-1">MYRIO Learning Center</h2>
            <p className="text-xs text-gray-400 mt-1">
              Market Trend Radar (Competitors/Amazon/Trends) & Custom Response Training.
            </p>
          </div>
        </div>

        {/* SUB TABS SWITCHER */}
        <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
          <button
            onClick={() => setActiveSubTab("TRENDS")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "TRENDS" ? "bg-[#D4AF37] text-black shadow-lg" : "text-gray-400 hover:text-white"
            }`}
          >
            <TrendingUp size={14} /> Top 10 Trend Radar
          </button>
          <button
            onClick={() => setActiveSubTab("TRAINING")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "TRAINING" ? "bg-[#D4AF37] text-black shadow-lg" : "text-gray-400 hover:text-white"
            }`}
          >
            <BookOpen size={14} /> Response Training ({rules.length})
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: TOP 10 TREND RADAR */}
      {activeSubTab === "TRENDS" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-[#D4AF37]" /> Global Market Trend Radar
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Synthesized from Amazon Best-Sellers, Google Search surges, and Swiss auction indices.
              </p>
            </div>
            <button
              onClick={runTrendRadar}
              disabled={loadingTrends}
              className="px-4 py-2 bg-white/5 hover:bg-[#D4AF37] hover:text-black border border-white/15 text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={loadingTrends ? "animate-spin" : ""} />
              {loadingTrends ? "Analyzing Market Data..." : "Re-Scan Trends"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trendRadar.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 hover:border-[#D4AF37]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-mono font-bold">
                      #{item.rank || idx + 1}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Demand Score: {item.demandScore || 95}/100
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-3 font-serif">{item.model}</h4>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{item.reason}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px]">
                  <span className="text-gray-500 uppercase tracking-widest">{item.source || "Google Trends"}</span>
                  <span className="font-mono text-[#D4AF37] font-bold">{item.suggestedPrice || "Investment Grade"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RESPONSE TRAINING */}
      {activeSubTab === "TRAINING" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8">
          {/* Form to teach MYRIO */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Zap size={18} className="text-[#D4AF37]" />
              <div>
                <h3 className="text-base font-bold">Teach MYRIO New Behaviors</h3>
                <p className="text-[10px] text-gray-400">Define how the AI should handle objections, pricing, or VIPs.</p>
              </div>
            </div>

            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1.5 font-bold">
                  User Question / Trigger Phrase
                </label>
                <input
                  type="text"
                  placeholder='e.g., "Can I negotiate the price?" or "Is this authentic?"'
                  value={triggerQuery}
                  onChange={(e) => setTriggerQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1.5 font-bold">
                  How MYRIO Should Respond (Guideline / Rule)
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain that our prices are fixed investment appraisals, but offer complimentary insured global delivery and diplomatic certificates."
                  value={responseGuideline}
                  onChange={(e) => setResponseGuideline(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1.5 font-bold">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Luxury Concierge">Luxury Concierge</option>
                    <option value="Diplomatic">Diplomatic</option>
                    <option value="Assertive">Assertive</option>
                    <option value="Technical">Technical Horologist</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1.5 font-bold">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                  >
                    <option value="OBJECTION">Price / Objections</option>
                    <option value="AUTHENTICITY">Authenticity / Provenance</option>
                    <option value="PRICING">Discounts & Wire</option>
                    <option value="GENERAL">General Concierge</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingRule}
                className="w-full py-3.5 bg-[#D4AF37] hover:bg-white text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <Plus size={15} /> {isSavingRule ? "Injecting Rule..." : "Train MYRIO AI"}
              </button>
            </form>
          </div>

          {/* Active Training Rules List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              Active Learned Rules ({rules.length})
            </h3>

            {rules.length === 0 ? (
              <div className="p-8 border border-white/10 rounded-3xl bg-white/[0.02] text-center text-xs text-gray-500 font-mono">
                No custom behavioral rules created yet. Add rules on the left to teach MYRIO.
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule._id}
                  className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 hover:border-[#D4AF37]/30 transition-all space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-[9px] font-bold uppercase tracking-wider">
                      {rule.category} • {rule.tone}
                    </span>
                    <button
                      onClick={() => handleDeleteRule(rule._id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">When asked: "{rule.triggerQuery}"</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">Guideline: {rule.responseGuideline}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}