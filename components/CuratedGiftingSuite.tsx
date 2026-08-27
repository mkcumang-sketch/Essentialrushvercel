"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Sparkles, Gift, X, CheckCircle2, Type } from "lucide-react";

// =========================================================
// STRICT INTERFACES
// =========================================================
export interface WatchItem {
  id?: string;
  _id?: string;
  name?: string;
  title?: string;
  brand?: string;
  imageUrl?: string;
  image?: string;
  images?: string[];
  offerPrice?: number;
  price?: number;
}

interface CuratedGiftingSuiteProps {
  watches: WatchItem[];
  isLight?: boolean;
  onToast?: (msg: string, type?: 'success' | 'error') => void;
}

export default function CuratedGiftingSuite({
  watches = [],
  isLight = false,
  onToast,
}: CuratedGiftingSuiteProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const selectedWatches = useMemo(() => {
    const set = new Set(selectedIds);
    return watches.filter((w) => {
        const itemId = w.id || w._id || "";
        return set.has(itemId);
    });
  }, [selectedIds, watches]);

  const toggleSelect = (id: string) => {
    if (!id) return;
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      // Keep it exclusive: max 6 items in one gift bundle
      if (prev.length >= 6) {
          onToast?.("Maximum 6 timepieces allowed per bundle.", "error");
          return prev;
      }
      return [...prev, id];
    });
  };

  const confirmBundle = () => {
    if (selectedWatches.length === 0) {
        return onToast?.("Select at least one timepiece to begin.", "error");
    }
    const trimmed = note.trim();
    if (trimmed.length < 6) {
        return onToast?.("Please add a premium note (minimum 6 characters).", "error");
    }
    
    // Success State
    onToast?.("Gifting bundle prepared and secured.", "success");
    // Optional: Reset state after securing bundle
    // setSelectedIds([]);
    // setNote("");
  };

  // Dynamic Theming
  const cardBase = "rounded-[26px] border transition-all duration-700 ease-[0.16,1,0.3,1]";
  const cardBg = isLight
    ? "bg-white/80 border-black/10 hover:shadow-[0_0_0_1px_rgba(212,175,55,0.35),0_10px_40px_rgba(212,175,55,0.08)]"
    : "bg-white/5 border-white/10 hover:shadow-[0_0_0_1px_rgba(212,175,55,0.35),0_10px_40px_rgba(212,175,55,0.08)]";
  const textClass = isLight ? "text-black" : "text-white";
  const mutedText = isLight ? "text-gray-500" : "text-gray-400";

  // EMPTY STATE
  if (watches.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden w-full max-w-7xl mx-auto px-4 sm:px-6"
      >
        <div className={`${cardBg} ${cardBase} p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[300px]`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-inner ${isLight ? "bg-black/5 border border-black/10" : "bg-black/30 border border-white/10"}`}>
              <Gift size={28} className="text-[#D4AF37]" />
            </div>
            <h3 className={`text-2xl font-serif font-bold italic tracking-tight ${textClass}`}>
              The Gifting Suite
            </h3>
            <p className={`${mutedText} text-sm mt-3 max-w-md font-medium`}>
              Acquire timepieces in your collection to start building exclusive gifting bundles.
            </p>
        </div>
      </motion.section>
    );
  }

  // ACTIVE STATE
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden w-full max-w-7xl mx-auto px-4 sm:px-6"
    >
      <div className={`${cardBg} ${cardBase} p-8 md:p-12`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-500/20 pb-8">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isLight ? "bg-[#D4AF37]/10" : "bg-[#D4AF37]/20 border border-[#D4AF37]/30"}`}>
              <Sparkles size={24} className="text-[#D4AF37]" />
            </div>
            <div>
              <h3 className={`text-2xl font-serif font-bold tracking-tight ${textClass}`}>
                Curated Gifting Suite
              </h3>
              <p className={`${mutedText} text-sm mt-1 font-medium`}>
                Bundle your acquisitions with a custom premium note.
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-2 ${mutedText} text-[10px] font-black uppercase tracking-widest bg-gray-500/10 px-4 py-2 rounded-full border border-gray-500/20`}>
            <Gift size={14} className="text-[#D4AF37]" />
            {selectedWatches.length} / 6 Selected
          </div>
        </div>

        {/* Watch Selector Grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {watches.slice(0, 12).map((w) => {
            const itemId = w.id || w._id || "";
            const active = selectedIds.includes(itemId);
            const price = Number(w.offerPrice ?? w.price ?? 0);
            const cover = w.imageUrl || w.image || (w.images && w.images[0]);

            return (
              <motion.button
                key={itemId}
                type="button"
                onClick={() => toggleSelect(itemId)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`${cardBase} p-5 text-left flex flex-col justify-between h-full ${
                  active
                    ? isLight
                      ? "bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.15)]"
                      : "bg-[#D4AF37]/20 border-[#D4AF37]/60 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                    : cardBg
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white border border-gray-200">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={w.name || w.title || "Timepiece"}
                        fill
                        sizes="64px"
                        className="object-contain p-1 mix-blend-multiply"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        —
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className={`text-[9px] font-black uppercase tracking-widest truncate ${active ? 'text-[#D4AF37]' : mutedText}`}>
                      {w.brand || "Essential"}
                    </div>
                    <div className={`text-sm font-bold font-serif truncate mt-1 ${textClass}`}>
                      {w.name || w.title}
                    </div>
                    <div className={`text-xs font-mono font-bold mt-2 ${textClass}`}>
                      ₹{price.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                    {active && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-5 flex items-center justify-between pt-4 border-t border-[#D4AF37]/30"
                    >
                        <span className={`text-[9px] font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5`}>
                            <CheckCircle2 size={12}/> Added to Bundle
                        </span>
                        <div
                            className={`p-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors`}
                        >
                            <X size={14} />
                        </div>
                    </motion.div>
                    )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* Note & Preview Section */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-gray-500/20 pt-10">
          
          {/* Note Input */}
          <div className={`${cardBase} ${cardBg} p-8`}>
            <label className={`${mutedText} text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-4`} htmlFor="gift-note">
              <Type size={14}/> Premium Note
            </label>
            <textarea
              id="gift-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write a heartfelt note for the recipient..."
              className={`w-full min-h-[160px] resize-none rounded-2xl border px-5 py-5 outline-none transition-colors font-serif italic text-sm ${
                isLight ? "bg-white border-black/10 text-black focus:border-[#D4AF37]" : "bg-black/30 border-white/10 text-white focus:border-[#D4AF37]"
              }`}
            />
            <div className={`text-right ${mutedText} text-[10px] font-bold uppercase tracking-widest mt-3`}>
              {note.trim().length} / 240 Characters
            </div>
          </div>

          {/* Bundle Preview */}
          <div className={`${cardBase} ${cardBg} p-8 flex flex-col justify-between`}>
            <div>
                <div className={`${mutedText} text-[10px] font-black uppercase tracking-widest mb-6`}>
                Bundle Preview
                </div>

                <div className="flex items-center justify-between gap-4 bg-gray-500/5 p-5 rounded-2xl border border-gray-500/10 mb-6">
                <div className={`${textClass} font-bold flex items-center gap-3`}>
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-serif text-xl">
                        {selectedWatches.length}
                    </div>
                    <span className={`${mutedText} text-xs uppercase tracking-widest font-black`}>Timepieces</span>
                </div>
                <div className={`${mutedText} text-[9px] font-black uppercase tracking-[0.2em] bg-gray-500/10 px-3 py-1 rounded-md`}>
                    #EssentialRush
                </div>
                </div>

                <div className={`${mutedText} text-sm leading-relaxed font-serif italic border-l-2 border-[#D4AF37] pl-4`}>
                {note.trim()
                    ? `“${note.trim().slice(0, 180)}${note.trim().length > 180 ? "…" : ""}”`
                    : "Add your premium note to preview the gifting message..."}
                </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={confirmBundle}
              className={`mt-8 w-full py-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-xl flex items-center justify-center gap-3 ${
                isLight
                  ? "bg-black text-white hover:bg-[#D4AF37] hover:text-black"
                  : "bg-[#D4AF37] text-black hover:bg-white hover:text-black"
              }`}
            >
              <Gift size={16}/> Secure Gift Bundle
            </motion.button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}