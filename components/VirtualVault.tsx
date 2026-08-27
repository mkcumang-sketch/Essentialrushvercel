"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Heart, Sparkles, ArrowRight, Trash2 } from "lucide-react";

type VaultItem = {
  _id?: string;
  id?: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  image?: string;
  images?: string[];
  offerPrice?: number;
  price?: number;
};

export default function VirtualVault({ isLight }: { isLight: boolean }) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("luxury_wishlist") || "[]";
      const parsed = JSON.parse(raw);
      const next = Array.isArray(parsed) ? parsed : [];
      setItems(next);
      window.dispatchEvent(new CustomEvent("vaultCountChanged", { detail: { count: next.length } }));
    } catch {
      setItems([]);
      window.dispatchEvent(new CustomEvent("vaultCountChanged", { detail: { count: 0 } }));
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const textClass = isLight ? "text-black" : "text-white";
  const mutedText = isLight ? "text-gray-600" : "text-gray-400";
  const surfaceBg = isLight ? "bg-white/85" : "bg-white/5";
  const surfaceBorder = isLight ? "border-black/10" : "border-white/10";

  const countLabel = useMemo(() => `${items.length}`, [items.length]);

  const removeFromVault = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((x) => String(x._id || x.id) !== id);
      localStorage.setItem("luxury_wishlist", JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("vaultCountChanged", { detail: { count: next.length } }));
      return next;
    });
  };

  return (
    <section className="relative">
      <div
        aria-hidden
        className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[#D4AF37]/15 blur-[70px] pointer-events-none"
      />

      <div className={`${surfaceBg} ${surfaceBorder} border rounded-[34px] p-8 md:p-10 overflow-hidden`}>
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                isLight ? "bg-black/5 border-black/10" : "bg-black/30 border-white/10"
              }`}
            >
              <Heart size={22} className="text-[#D4AF37]" />
            </div>
            <div>
              <h3 className={`text-2xl md:text-3xl font-serif font-bold ${textClass} uppercase tracking-[6px]`}>
                Saved watches
              </h3>
              <p className={`${mutedText} text-sm mt-2`}>
                Your saved assets, rendered with luxury motion.
              </p>
            </div>
          </div>

          <div className={`${mutedText} text-[10px] font-black uppercase tracking-[5px]`}>
            Saved: <span className={textClass}>{countLabel}</span>
          </div>
        </div>

        {!isLoaded ? (
          <div className="mt-10 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-12 text-center">
            <div className="flex items-center justify-center gap-3">
              <Sparkles size={18} className="text-[#D4AF37]" />
              <p className={`${mutedText} text-[10px] font-black uppercase tracking-[4px]`}>
                Nothing saved yet
              </p>
            </div>
            <h4 className={`text-xl font-serif font-bold mt-4 ${textClass}`}>
              Save your favorite watches
            </h4>
            <p className={`${mutedText} text-sm mt-2 max-w-md mx-auto`}>
              Tap “Wishlist” on a watch to save it here.
            </p>
            <Link
              href="/shop"
              className={`mt-8 inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full text-[11px] font-black uppercase tracking-[5px] shadow-lg transition-all duration-500 ${
                isLight
                  ? "bg-black text-white hover:bg-[#D4AF37] hover:text-black"
                  : "bg-[#D4AF37] text-black hover:bg-white hover:text-black"
              }`}
            >
              Browse watches <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {items.map((item, idx) => {
                const id = String(item._id || item.id || idx);
                const cover = item.imageUrl || item.image || (item.images && item.images[0]);
                const price = Number(item.offerPrice ?? item.price ?? 0);

                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 12, scale: 0.99 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    whileHover={{ scale: 1.02 }}
                    className={`relative ${surfaceBg} ${surfaceBorder} rounded-[26px] border p-5 overflow-hidden group transition-all transition-transform duration-1000 hover:border-[#D4AF37]/60 hover:shadow-[0_0_0_1px_rgba(212,175,55,0.30),0_0_30px_rgba(212,175,55,0.20)]`}
                  >
                    <div
                      aria-hidden
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    >
                      <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#D4AF37]/15 blur-[60px]" />
                      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-white/5 blur-[60px]" />
                    </div>

                    <div className="relative">
                      <div className="relative w-full h-40 rounded-[18px] overflow-hidden border border-white/10">
                        {cover ? (
                          <Image
                            src={cover}
                            alt={item.name}
                            fill
                            sizes="(max-width:1024px) 80vw, 28vw"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            —
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className={`text-[10px] font-black uppercase tracking-[4px] truncate ${mutedText}`}>
                          {item.brand || "Essential"}
                        </div>
                        <div className={`text-sm font-bold font-serif mt-1 truncate ${textClass}`}>
                          {item.name}
                        </div>
                        <div className={`${mutedText} text-[11px] font-black mt-2`}>
                          ₹{price.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div className={`${mutedText} text-[10px] font-black uppercase tracking-[4px]`}>
                        Saved watch
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromVault(id)}
                        className="p-2 rounded-full border border-white/10 bg-black/10 hover:bg-red-500/10 transition-all duration-500"
                        aria-label="Remove from vault"
                      >
                        <Trash2 size={16} className={isLight ? "text-red-600" : "text-red-400"} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}

