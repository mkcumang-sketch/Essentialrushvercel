"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, MessageSquare, Package, CreditCard, RotateCcw, Truck, Headphones, HelpCircle } from "lucide-react";

export default function AskMyrioWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(() => `sess-${Math.random().toString(36).substring(2, 9)}`);
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Welcome to Essential Rush. I am MYRIO. How may I assist your horology journey today?" },
  ]);
  const [loading, setLoading] = useState(false);

  const sendQueryToMyrio = async (queryText: string) => {
    const clean = queryText.trim();
    if (!clean || loading) return;

    setMessages((prev) => [...prev, { sender: "user", text: clean }]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await fetch("/api/myrio/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, query: clean }),
      });
      const data = await res.json();
      if (data.success && data.response) {
        setMessages((prev) => [...prev, { sender: "ai", text: data.response }]);
      } else {
        setMessages((prev) => [...prev, { sender: "ai", text: "I encountered a minor retrieval issue. Please try again." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { sender: "ai", text: "Network connection disrupted." }]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: "📦 Track Order", query: "Where is my order?" },
    { label: "🛒 Products", query: "What watches do you recommend?" },
    { label: "💳 Payment", query: "What payment methods do you accept?" },
    { label: "🔄 Returns", query: "What is your return policy?" },
    { label: "📞 Support", query: "I need human support assistance" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[999] font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setIsOpen(true)}
          className="bg-[#D4AF37] text-black px-5 py-4 rounded-full font-black uppercase text-xs tracking-widest shadow-[0_0_30px_rgba(212,175,55,0.4)] flex items-center gap-2.5 cursor-pointer"
        >
          <Sparkles size={16} /> Ask MYRIO
        </motion.button>
      )}

      {/* Chat Interface Drawer/Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-[#0b0b0b] border border-white/15 rounded-3xl w-[360px] sm:w-[400px] h-[520px] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-black/80 backdrop-blur-md p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Ask MYRIO</h3>
                  <p className="text-[9px] text-emerald-400 font-mono">● Verified Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white cursor-pointer p-1">
                <X size={16} />
              </button>
            </div>

            {/* Quick Action Chips */}
            <div className="p-2.5 bg-white/[0.02] border-b border-white/5 flex gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
              {quickActions.map((qa, i) => (
                <button
                  key={i}
                  onClick={() => sendQueryToMyrio(qa.query)}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-[#D4AF37] text-[10px] font-bold text-gray-300 uppercase tracking-wider shrink-0 transition-all cursor-pointer"
                >
                  {qa.label}
                </button>
              ))}
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto text-xs font-mono">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl leading-relaxed whitespace-pre-line ${
                    m.sender === "user"
                      ? "bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-white ml-8"
                      : "bg-white/5 border border-white/10 text-gray-300 mr-4"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {loading && (
                <div className="p-3 bg-white/5 rounded-2xl text-xs text-gray-400 animate-pulse">
                  MYRIO is retrieving verified data...
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendQueryToMyrio(inputQuery);
              }}
              className="p-3 border-t border-white/10 bg-black flex gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about orders, policies, watches..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
              />
              <button
                type="submit"
                disabled={loading || !inputQuery.trim()}
                className="px-4 py-2.5 bg-[#D4AF37] text-black rounded-xl hover:bg-white transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}