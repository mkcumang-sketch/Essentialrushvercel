"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Landmark,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCcw,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

export default function WithdrawalTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/affiliates/withdraw");
      const data = await res.json();
      if (data.success && data.requests) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error("Error fetching withdrawals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleUpdateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/affiliates/withdraw", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchWithdrawals();
      } else {
        alert(data.error || "Update failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 font-sans text-white pb-24">
      {/* HEADER */}
      <div className="bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-3xl flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <Landmark size={24} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white">Withdrawal Dispatches</h2>
            <p className="text-xs text-gray-400 mt-1">Affiliate payout settlements via UPI and Direct Bank Wire.</p>
          </div>
        </div>
        <button
          onClick={fetchWithdrawals}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* REQUESTS LIST */}
      {loading ? (
        <div className="py-20 text-center text-xs uppercase tracking-widest text-gray-500">Loading payout requests...</div>
      ) : requests.length === 0 ? (
        <div className="py-20 text-center text-xs uppercase tracking-widest text-gray-500 bg-[#0a0a0a] border border-white/10 rounded-3xl">
          No pending withdrawal requests found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((req) => {
            const isUpi =
              req.payoutMethod === "UPI" ||
              req.paymentDetails?.payoutMethod === "UPI" ||
              Boolean(req.paymentDetails?.upiId || req.upiId);

            const upiId = req.paymentDetails?.upiId || req.upiId || "N/A";
            const accountName = req.paymentDetails?.accountName || req.accountName || req.userName || "N/A";
            const bankName = req.paymentDetails?.bankName || req.bankName || "N/A";
            const accountNumber = req.paymentDetails?.accountNumber || req.accountNumber || "N/A";
            const ifsc = req.paymentDetails?.ifsc || req.ifsc || "N/A";

            return (
              <div
                key={req._id}
                className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-2xl relative space-y-6"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex justify-between items-start border-b border-white/10 pb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                          {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                            req.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : req.status === "REJECTED"
                              ? "bg-red-500/10 text-red-400 border border-red-500/30"
                              : "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                          }`}
                        >
                          {req.status || "PENDING"}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white">{req.userEmail || req.email || "Affiliate Partner"}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">Requested</p>
                      <p className="text-2xl font-serif font-black text-[#D4AF37]">
                        ₹{Number(req.amount || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* Payment Details Box */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mt-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      {isUpi ? (
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <Smartphone size={16} />
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                          <Landmark size={16} />
                        </div>
                      )}
                      <div>
                        <p className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">Payout Method</p>
                        <p className="text-xs font-bold text-white uppercase tracking-wider">
                          {isUpi ? "UPI Transfer" : "Direct Bank Wire"}
                        </p>
                      </div>
                    </div>

                    {isUpi ? (
                      <div>
                        <p className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">Registered UPI VPA</p>
                        <p className="text-sm font-mono font-bold text-[#D4AF37] mt-1 bg-black/60 p-3 rounded-xl border border-white/10">
                          {upiId}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-black/60 p-2.5 rounded-xl border border-white/10">
                          <p className="text-[8px] uppercase text-gray-500 font-bold">Account Name</p>
                          <p className="font-bold text-white truncate mt-0.5">{accountName}</p>
                        </div>
                        <div className="bg-black/60 p-2.5 rounded-xl border border-white/10">
                          <p className="text-[8px] uppercase text-gray-500 font-bold">Bank Name</p>
                          <p className="font-bold text-white truncate mt-0.5">{bankName}</p>
                        </div>
                        <div className="bg-black/60 p-2.5 rounded-xl border border-white/10">
                          <p className="text-[8px] uppercase text-gray-500 font-bold">Account Number</p>
                          <p className="font-mono font-bold text-white truncate mt-0.5">{accountNumber}</p>
                        </div>
                        <div className="bg-black/60 p-2.5 rounded-xl border border-white/10">
                          <p className="text-[8px] uppercase text-gray-500 font-bold">IFSC Code</p>
                          <p className="font-mono font-bold text-white truncate mt-0.5">{ifsc}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {req.status === "PENDING" && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      onClick={() => handleUpdateStatus(req._id, "REJECTED")}
                      disabled={processingId === req._id}
                      className="py-3.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 text-xs font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(req._id, "APPROVED")}
                      disabled={processingId === req._id}
                      className="py-3.5 bg-[#D4AF37] hover:bg-white text-black text-xs font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-xl disabled:opacity-50"
                    >
                      Approve & Settle
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}