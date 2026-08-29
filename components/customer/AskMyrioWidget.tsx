"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Package,
  Clock,
  CreditCard,
  RotateCcw,
  Headphones,
  User,
  Bot,
} from "lucide-react";

export default function AskMyrioWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(() => `sess-${Math.random().toString(36).substring(2, 9)}`);
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Welcome to Essential Rush. I am MYRIO, your personal horology concierge. How may I assist your acquisition today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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
        setMessages((prev) => [
          { sender: "ai", text: "I encountered a minor retrieval issue. Please try again." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        { sender: "ai", text: "Network connection disrupted. Please check your connection." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: "Track Order", query: "Where is my order?", icon: Package },
    { label: "Timepieces", query: "What watches do you recommend?", icon: Clock },
    { label: "Payment", query: "What payment methods do you accept?", icon: CreditCard },
    { label: "Returns", query: "What is your return policy?", icon: RotateCcw },
    { label: "Concierge", query: "I need human support assistance", icon: Headphones },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[999] font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-black px-5 py-3.5 rounded-full font-bold uppercase text-[11px] tracking-[2px] shadow-[0_8px_30px_rgba(212,175,55,0.35)] flex items-center gap-2.5 cursor-pointer border border-white/30"
        >
          <Sparkles size={15} className="text-black" />
          <span>Ask MYRIO</span>
        </motion.button>
      )}

      {/* Chat Drawer / Popup Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", damping: 25, stiffness: 280 }}
            className="bg-[#0B0E11] border border-white/15 rounded-[28px] w-[360px] sm:w-[390px] h-[540px] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="bg-black/60 backdrop-blur-md px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-[2px] text-white">MYRIO</h3>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[8px] font-bold tracking-wider text-emerald-400">
                      Concierge
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-serif italic">Fine Horology Intelligence</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Quick Action Chips (Scrollbar Hidden) */}
            <div className="px-4 py-2.5 bg-black/40 border-b border-white/5 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shrink-0">
              {quickActions.map((qa, i) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={i}
                    onClick={() => sendQueryToMyrio(qa.query)}
                    className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 text-[10px] font-medium text-gray-300 hover:text-white tracking-wide shrink-0 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Icon size={12} className="text-[#D4AF37]" />
                    <span>{qa.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Messages Stream */}
            <div className="flex-1 p-4 space-y-3.5 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] ${
                      m.sender === "user"
                        ? "bg-[#D4AF37] text-black font-bold"
                        : "bg-white/10 border border-white/15 text-[#D4AF37]"
                    }`}
                  >
                    {m.sender === "user" ? <User size={12} /> : <Bot size={12} />}
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl leading-relaxed max-w-[80%] whitespace-pre-line text-[12px] font-normal ${
                      m.sender === "user"
                        ? "bg-[#D4AF37] text-black font-medium rounded-tr-none shadow-md"
                        : "bg-white/[0.05] border border-white/10 text-gray-200 rounded-tl-none font-serif leading-[1.6]"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/[0.03] border border-white/5 p-3 rounded-2xl w-max">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping" />
                  <span className="font-serif italic">MYRIO is consulting the vault...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendQueryToMyrio(inputQuery);
              }}
              className="p-3 border-t border-white/10 bg-black/80 backdrop-blur-md flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Inquire about watches, provenance, orders..."
                className="flex-1 bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 placeholder:italic font-serif outline-none focus:border-[#D4AF37] transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !inputQuery.trim()}
                className="w-10 h-10 bg-[#D4AF37] hover:bg-white text-black rounded-2xl transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0 shadow-md"
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