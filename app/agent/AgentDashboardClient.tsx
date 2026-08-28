"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  Clock,
  Search,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Copy,
  Zap,
  LogIn,
  LogOut,
  Share2,
  CheckCircle,
  Award,
  DollarSign,
  Send
} from "lucide-react";
import Link from "next/link";

interface AgentDashboardProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

interface Lead {
  _id: string;
  name: string;
  phone: string;
  email: string;
  cartTotal: number;
  items: Array<{ name?: string; brand?: string }>;
  status: string;
  convertedBy?: string;
  createdAt: string;
}

export default function AgentDashboardClient({ user }: AgentDashboardProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, convertedCount: 0, totalAssigned: 0 });
  const [attendance, setAttendance] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAgentData = async () => {
    try {
      const res = await fetch("/api/agent/actions");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setLeads(json.data.leads || []);
          setStats(json.data.stats || { totalSales: 0, convertedCount: 0, totalAssigned: 0 });
          setAttendance(json.data.attendance || null);
        }
      }
    } catch (err) {
      console.error("Error fetching agent data", err);
    }
  };

  useEffect(() => {
    fetchAgentData();
  }, []);

  const handleAttendance = async (type: "CLOCK_IN" | "CLOCK_OUT") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/agent/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: type }),
      });
      if (res.ok) {
        await fetchAgentData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/agent/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_LEAD_STATUS", leadId, newStatus }),
      });
      if (res.ok) {
        fetchAgentData();
      }
    } catch (err) {
      console.error("Lead update error", err);
    }
  };

  const copyShareLink = (productSlug: string, identifier: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const cleanAgent = encodeURIComponent(user.email);
    const url = `${origin}/product/${productSlug || "all"}?ref=${cleanAgent}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(identifier);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Header & Clock-In Module */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl px-6 md:px-12 py-5 sticky top-0 z-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-wide">{user.name}</h1>
              <span className="text-[8px] bg-[#D4AF37] text-black font-black uppercase px-2 py-0.5 rounded-full">
                {user.role}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">{user.email}</p>
          </div>
        </div>

        {/* Daily Attendance Controls */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          {!attendance?.clockIn ? (
            <button
              onClick={() => handleAttendance("CLOCK_IN")}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <LogIn size={13} /> Clock In (Attendance)
            </button>
          ) : !attendance?.clockOut ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-[9px] font-bold">
                In: {new Date(attendance.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <button
                onClick={() => handleAttendance("CLOCK_OUT")}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <LogOut size={13} /> Clock Out
              </button>
            </div>
          ) : (
            <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-gray-400 rounded-lg text-[9px] font-bold">
              Shift Ended ({new Date(attendance.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
            </span>
          )}

          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-white font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 ml-2"
          >
            Storefront <ExternalLink size={12} />
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 space-y-10">
        {/* Sales Performance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start text-gray-400">
              <span className="text-[10px] font-black uppercase tracking-widest">My Closed Sales</span>
              <DollarSign size={18} className="text-[#D4AF37]" />
            </div>
            <p className="text-3xl font-black font-mono text-[#D4AF37] mt-4">
              ₹{stats.totalSales.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-gray-500 mt-1">{stats.convertedCount} Confirmed Vault Orders</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start text-gray-400">
              <span className="text-[10px] font-black uppercase tracking-widest">Conversion Rate</span>
              <Award size={18} className="text-green-400" />
            </div>
            <p className="text-3xl font-black font-mono mt-4 text-green-400">
              {stats.totalAssigned > 0 ? Math.round((stats.convertedCount / stats.totalAssigned) * 100) : 0}%
            </p>
            <p className="text-[10px] text-gray-500 mt-1">Efficiency on assigned leads</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start text-gray-400">
              <span className="text-[10px] font-black uppercase tracking-widest">Personal Referral Tag</span>
              <Share2 size={18} className="text-blue-400" />
            </div>
            <p className="text-xs text-gray-300 font-mono truncate mt-4">?ref={encodeURIComponent(user.email)}</p>
            <p className="text-[10px] text-gray-500 mt-1">Automatic commission attribution</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start text-gray-400">
              <span className="text-[10px] font-black uppercase tracking-widest">Shift Status</span>
              <Clock size={18} className="text-purple-400" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  attendance?.clockIn && !attendance?.clockOut ? "bg-emerald-500 animate-pulse" : "bg-gray-500"
                }`}
              />
              <span className="text-sm font-bold">
                {attendance?.clockIn && !attendance?.clockOut ? "On Active Duty" : "Shift Inactive"}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Timestamped attendance record</p>
          </div>
        </div>

        {/* Lead Management Queue */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
            <div>
              <h2 className="text-xl font-bold font-serif">Assigned Leads & Sales Opportunities</h2>
              <p className="text-xs text-gray-400 mt-1">Engage customers, share tracked links & mark conversions.</p>
            </div>

            <div className="relative w-full md:w-72">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search client, phone..."
                className="w-full bg-black/50 border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-gray-600 outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-xs uppercase tracking-widest">
                No leads in queue.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[9px] uppercase font-black tracking-widest text-gray-500">
                    <th className="pb-3">Client</th>
                    <th className="pb-3">Interested Items</th>
                    <th className="pb-3">Cart Valuation</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Lead Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLeads.map((lead) => {
                    const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
                    const firstWatch = lead.items?.[0]?.name || "Luxury Timepiece";
                    const waText = encodeURIComponent(
                      `Hello ${lead.name}, this is ${user.name} from Essential Rush. I have reserved your ${firstWatch} in our vault. Here is your checkout link: ${typeof window !== "undefined" ? window.location.origin : ""}/checkout?ref=${encodeURIComponent(user.email)}`
                    );

                    return (
                      <tr key={lead._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 font-bold">
                          <p className="text-white">{lead.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{lead.phone || lead.email}</p>
                        </td>

                        <td className="py-4 text-gray-300">
                          {lead.items?.length > 0 ? (
                            <span className="font-semibold">{lead.items.map((i) => i.name).join(", ")}</span>
                          ) : (
                            <span className="text-gray-500 italic">Custom Vault Request</span>
                          )}
                        </td>

                        <td className="py-4 font-mono font-bold text-emerald-400">
                          ₹{lead.cartTotal?.toLocaleString("en-IN")}
                        </td>

                        <td className="py-4">
                          <span
                            className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full border ${
                              lead.status === "CONVERTED"
                                ? "bg-green-500/10 border-green-500/30 text-green-400"
                                : lead.status === "CONTACTED"
                                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                : "bg-orange-500/10 border-orange-500/30 text-orange-400"
                            }`}
                          >
                            {lead.status}
                          </span>
                        </td>

                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Copy Tracked Link Button */}
                            <button
                              onClick={() => copyShareLink(lead.items?.[0]?.name || "", lead._id)}
                              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                              title="Copy Tracked Referral Link"
                            >
                              {copiedLink === lead._id ? <CheckCircle2 size={11} className="text-green-400" /> : <Copy size={11} />}
                              Link
                            </button>

                            {/* WhatsApp Direct Pitch */}
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}?text=${waText}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => updateLeadStatus(lead._id, "CONTACTED")}
                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black rounded-lg text-[9px] font-black uppercase tracking-wider transition-all inline-flex items-center gap-1"
                              >
                                <Send size={10} /> Pitch
                              </a>
                            )}

                            {/* Mark As Converted Button */}
                            {lead.status !== "CONVERTED" && (
                              <button
                                onClick={() => updateLeadStatus(lead._id, "CONVERTED")}
                                className="px-3 py-1.5 bg-[#D4AF37] text-black font-black uppercase text-[9px] rounded-lg hover:bg-white transition-all cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle size={10} /> Sold
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}