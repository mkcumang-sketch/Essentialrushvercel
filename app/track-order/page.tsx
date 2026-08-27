"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Package, Truck, CheckCircle2, Clock, XCircle, RefreshCw, ArrowLeft,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  PENDING:    { label: "Pending",    icon: <Clock size={18} />,        color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  PROCESSING: { label: "Processing", icon: <RefreshCw size={18} />,    color: "text-blue-600",   bg: "bg-blue-50 border-blue-200" },
  DISPATCHED: { label: "Dispatched", icon: <Truck size={18} />,        color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  DELIVERED:  { label: "Delivered",  icon: <CheckCircle2 size={18} />, color: "text-green-600",  bg: "bg-green-50 border-green-200" },
  CANCELLED:  { label: "Cancelled",  icon: <XCircle size={18} />,      color: "text-red-600",    bg: "bg-red-50 border-red-200" },
};

const STEPS = ["PENDING", "PROCESSING", "DISPATCHED", "DELIVERED"];

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  
  // 🚀 SMART PRE-FILL: URL param se uthao agar dashboard se aaya hai
  const initialOrderId = searchParams?.get("orderId") || "";
  const initialEmail = searchParams?.get("email") || "";

  const [orderId, setOrderId] = useState(initialOrderId);
  const [email, setEmail]     = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [result, setResult]   = useState<any>(null);

  // 🚀 AUTO-TRACK LOGIC: Agar URL mein dono cheezein hain, toh form bharna nahi padega
  useEffect(() => {
    if (initialOrderId && initialEmail) {
      executeTrack(initialOrderId, initialEmail);
    }
  }, [initialOrderId, initialEmail]);

  const executeTrack = async (trackOrderId: string, trackEmail: string) => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      // API call same rahegi, backend khud dhoondega
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: trackOrderId.trim(), email: trackEmail.trim() }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setResult(data.order);
      } else {
        setError(data.message || "Order not found. Please verify details.");
      }
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !email.trim()) {
      setError("Please enter both your Order ID and billing email.");
      return;
    }
    executeTrack(orderId, email);
  };

  const statusInfo = result ? (STATUS_CONFIG[result.status] ?? STATUS_CONFIG.PENDING) : null;
  const stepIndex  = result ? STEPS.indexOf(result.status) : -1;

  // 🚀 Agar result mil gaya, toh form hide kar do (clean UI)
  if (result && statusInfo) {
      return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans flex flex-col items-center justify-center py-16 px-4">
            <div className="w-full max-w-lg space-y-6">
                
                <div className="text-center space-y-2 mb-10">
                    <div className="w-14 h-14 bg-black text-[#D4AF37] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Package size={26} />
                    </div>
                    <h1 className="text-4xl font-serif font-black italic tracking-tighter">Asset Located</h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">
                    Live Tracking Feed
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden"
                >
                    {/* Status header */}
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">
                        Order Key
                        </p>
                        <p className="text-lg font-black tracking-tight">{result.orderId}</p>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-black ${statusInfo.color} ${statusInfo.bg}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                    </div>
                    </div>

                    {/* Progress bar */}
                    {result.status !== "CANCELLED" && (
                    <div className="px-8 py-10 border-b border-gray-50">
                        <div className="relative">
                        <div className="absolute top-4 left-0 w-full h-[2px] bg-gray-100" />
                        <div
                            className="absolute top-4 left-0 h-[2px] bg-black transition-all duration-700"
                            style={{ width: stepIndex >= 0 ? `${(stepIndex / (STEPS.length - 1)) * 100}%` : "0%" }}
                        />
                        <div className="relative flex justify-between">
                            {STEPS.map((step, i) => {
                            const done = i <= stepIndex;
                            const icons = [<Package key={1} size={14} />, <RefreshCw key={2} size={14} />, <Truck key={3} size={14} />, <CheckCircle2 key={4} size={14} />];
                            return (
                                <div key={step} className="flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white transition-all ${done ? "border-black text-black" : "border-gray-200 text-gray-300"}`}>
                                    {icons[i]}
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest ${done ? "text-black" : "text-gray-300"}`}>
                                    {STATUS_CONFIG[step]?.label}
                                </span>
                                </div>
                            );
                            })}
                        </div>
                        </div>
                    </div>
                    )}

                    {/* Details */}
                    <div className="p-8 space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Item</span>
                        <span className="text-sm font-black text-right max-w-[60%] truncate">{result.firstItemName || "Luxury Asset"}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total</span>
                        <span className="text-sm font-black">₹{Number(result.totalAmount).toLocaleString()}</span>
                    </div>
                    
                    {/* 🚀 THE TRACKING ID FIELD: Jo Admin Panel se aayega */}
                    <div className={`flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 py-4 rounded-xl px-5 mt-4 ${result.trackingId ? "bg-[#0A0A0A] text-white border border-[#D4AF37]/30" : "bg-gray-50 border border-gray-100"}`}>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${result.trackingId ? "text-[#D4AF37]" : "text-gray-400"}`}>Courier Tracking ID</span>
                        {result.trackingId ? (
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <span className="text-sm font-black tracking-widest font-mono">{result.trackingId}</span>
                            <button onClick={() => { navigator.clipboard.writeText(result.trackingId); }} className="p-2 bg-white/10 hover:bg-[#D4AF37] hover:text-black rounded-lg transition-colors" title="Copy tracking ID">
                                <CheckCircle2 size={14} />
                            </button>
                        </div>
                        ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Awaiting Dispatch
                        </span>
                        )}
                    </div>
                    </div>

                    <div className="px-8 pb-8">
                    <Link href="/account" className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-gray-200 hover:border-black text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-all">
                        <ArrowLeft size={14} /> Return to Vault
                    </Link>
                    </div>
                </motion.div>
            </div>
        </div>
      )
  }

  // 🚀 FALLBACK FORM: Agar URL param nahi hai (Guest User), toh form dikhao
  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans flex flex-col">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-black text-[#D4AF37] rounded-xl flex items-center justify-center font-black text-sm group-hover:bg-[#D4AF37] group-hover:text-black transition-colors">♞</div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] hidden sm:block">Essential Rush</span>
        </Link>
        <span className="text-gray-200 text-lg">|</span>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Order Tracking</span>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-16">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-black text-[#D4AF37] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Package size={26} />
            </div>
            <h1 className="text-4xl font-serif font-black italic tracking-tighter">Track Your Order</h1>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">
              Enter your order ID and billing email
            </p>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50 p-8 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Order ID</label>
                <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="e.g. ER-2024-XXXXXX" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none text-sm font-bold focus:bg-white focus:border-[#D4AF37] focus:shadow-md transition-all placeholder:text-gray-300" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Billing Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email used at checkout" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none text-sm font-bold focus:bg-white focus:border-[#D4AF37] focus:shadow-md transition-all placeholder:text-gray-300" />
              </div>
              <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading} className="w-full py-4 bg-black hover:bg-[#D4AF37] text-white hover:text-black rounded-xl text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all shadow-lg disabled:opacity-60 mt-2">
                {loading ? <><RefreshCw size={16} className="animate-spin" /> Searching...</> : <><Search size={16} /> Track Now</>}
              </motion.button>
            </form>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold">
                <XCircle size={16} className="shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}