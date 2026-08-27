"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ShieldCheck, Crown, Sparkles, ArrowRight } from "lucide-react";

type VaultProfile = {
  tier?: string;
  totalSpent?: number;
};

type VaultResponse = {
  success: boolean;
  data: {
    profile: VaultProfile;
  };
};

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function VaultPage() {
  const { data: session, status } = useSession();
  const [vault, setVault] = useState<VaultProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const threshold = 100000; // Gold unlock at >= ₹1,00,000

  useEffect(() => {
    if (status === "unauthenticated") {
      // Hard navigation to reset any client memory.
      window.location.href = `/login?t=${Date.now()}`;
      return;
    }

    if (status !== "authenticated" || !session?.user) return;

    setIsLoading(true);
    setIsError(false);

    fetch(`/api/user/account?t=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    })
      .then((res) => res.json() as Promise<VaultResponse>)
      .then((json) => {
        if (json?.success && json?.data?.profile) {
          setVault(json.data.profile);
        } else {
          setIsError(true);
        }
      })
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false));
  }, [status, session?.user]);

  const tier = vault?.tier || "Silver Vault";
  const totalSpent = Number(vault?.totalSpent || 0);
  const isGold = tier === "Gold Vault";

  const progressPct = useMemo(() => {
    const raw = (totalSpent / threshold) * 100;
    return isGold ? 100 : Math.max(0, Math.min(raw, 100));
  }, [totalSpent, threshold, isGold]);

  const privileges = useMemo(() => {
    return isGold
      ? [
          "See new watches first",
          "Free engraving",
          "Faster help when you need it",
        ]
      : [
          "Member prices",
          "News before everyone else",
          "Priority booking for help",
        ];
  }, [isGold]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center selection:bg-[#D4AF37] selection:text-black p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-6"
        />
        <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[5px]">
          Loading…
        </p>
      </div>
    );
  }

  if (isError || !vault) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center selection:bg-[#D4AF37] selection:text-black p-6 text-center">
        <ShieldCheck className="text-[#D4AF37] mb-6" size={60} />
        <h1 className="text-3xl font-serif mb-2">Could not load this page</h1>
        <p className="text-gray-400 max-w-md mb-8">
          We could not load your member level. Refresh the page or go back to your account.
        </p>
        <Link
          href="/account"
          className="px-10 py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-[5px] text-[11px] rounded-full hover:bg-white transition-all shadow-[0_20px_60px_rgba(212,175,55,0.18)] border border-[#D4AF37]/40"
        >
          Return to Account <ArrowRight size={14} className="inline-block ml-2" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#D4AF37] selection:text-black overflow-x-hidden">
      {/* Page background glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-[-200px] left-[10%] w-[540px] h-[540px] bg-[#D4AF37]/10 blur-[120px]" />
        <div className="absolute bottom-[-240px] right-[5%] w-[520px] h-[520px] bg-white/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10"
      >
        <header className="max-w-[1200px] mx-auto px-6 md:px-12 pt-24 pb-10">
          <nav className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[4px] text-gray-400 mb-8">
            <Link href="/" className="hover:text-white transition-colors">
              Essential
            </Link>
            <span className="text-[#D4AF37]">/</span>
            <span>Member perks</span>
          </nav>

          <h1 className="text-5xl md:text-7xl font-serif font-bold italic tracking-tight">
            Your perks
          </h1>
          <p className="mt-4 text-gray-400 max-w-2xl font-serif italic">
            Your member level, benefits, and how close you are to Gold.
          </p>
        </header>

        <main className="max-w-[1200px] mx-auto px-6 md:px-12 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tier Card */}
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-2"
            >
              <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[40px] p-8 md:p-10 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.55)]">
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
                        {isGold ? <Crown size={20} className="text-[#D4AF37]" /> : <Sparkles size={20} className="text-[#D4AF37]" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[4px] text-[#D4AF37]">
                          Your Tier
                        </p>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold mt-1">
                          {tier === "Gold Vault" ? "Gold" : tier === "Silver Vault" ? "Silver" : tier}
                        </h2>
                      </div>
                    </div>
                    <p className="text-gray-400 mt-4 font-serif italic">
                      We count money you spent on orders that went through.
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[4px] text-gray-400">
                      Total Spent
                    </p>
                    <p className="text-3xl font-serif font-bold text-[#D4AF37] mt-1">
                      ₹{totalSpent.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-[4px] text-gray-400">
                      Progress to Gold
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-[4px] text-[#D4AF37]">
                      {progressPct.toFixed(0)}%
                    </p>
                  </div>

                  <div className="h-3 rounded-full bg-white/10 overflow-hidden border border-white/10">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-[#D4AF37] rounded-full shadow-[0_0_28px_rgba(212,175,55,0.35)]"
                    />
                  </div>

                  <div className="mt-3 text-sm text-gray-400 font-serif italic">
                    {isGold
                      ? "You are a Gold member. Welcome."
                      : `Spend ₹${Math.max(0, threshold - totalSpent).toLocaleString(
                          "en-IN"
                        )} more to reach Gold.`}
                  </div>
                </div>

                {/* Privileges */}
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {privileges.map((p) => (
                    <motion.div
                      key={p}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="bg-black/40 border border-white/10 rounded-[26px] p-6 hover:scale-[1.02] hover:shadow-[0_0_26px_rgba(212,175,55,0.18)] transition-all duration-1000"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={18} className="text-[#D4AF37]" />
                        <p className="text-sm font-serif font-bold">{p}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/shop"
                    className="flex-1 px-7 py-4 bg-[#D4AF37] text-black font-black uppercase tracking-[5px] text-[11px] rounded-full hover:bg-white transition-all shadow-[0_20px_60px_rgba(212,175,55,0.18)] border border-[#D4AF37]/40 hover:scale-[1.02] duration-1000"
                  >
                    Shop new watches <ArrowRight size={14} className="inline-block ml-2" />
                  </Link>
                  <Link
                    href="/account"
                    className="flex-1 px-7 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-[5px] text-[11px] rounded-full hover:bg-white/10 transition-all duration-1000 hover:scale-[1.02]"
                  >
                    Your account <ArrowRight size={14} className="inline-block ml-2" />
                  </Link>
                </div>
              </div>
            </motion.section>

            {/* Side Card */}
            <motion.aside
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-1"
            >
              <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[40px] p-8 md:p-10 overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-[4px] text-[#D4AF37]">
                  Good to know
                </p>
                <h3 className="text-2xl font-serif font-bold mt-2">Simple and clear</h3>
                <p className="text-gray-400 mt-4 font-serif italic">
                  Your level updates after paid orders. No hidden rules.
                </p>

                <div className="mt-8 space-y-4">
                  <div className="bg-black/30 border border-white/10 rounded-[24px] p-5 hover:scale-[1.02] transition-all duration-1000 hover:shadow-[0_0_26px_rgba(212,175,55,0.14)]">
                    <p className="text-sm font-serif font-bold">Progress updates</p>
                    <p className="text-gray-400 text-sm mt-2">
                      After payment confirmation, your spending total updates automatically.
                    </p>
                  </div>
                  <div className="bg-black/30 border border-white/10 rounded-[24px] p-5 hover:scale-[1.02] transition-all duration-1000 hover:shadow-[0_0_26px_rgba(212,175,55,0.14)]">
                    <p className="text-sm font-serif font-bold">Gold benefits</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Gold members get early access and free engraving.
                    </p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </main>
      </motion.div>
    </div>
  );
}

