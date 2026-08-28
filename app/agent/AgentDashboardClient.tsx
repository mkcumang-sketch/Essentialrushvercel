"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  ShoppingBag, 
  PhoneCall, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Search, 
  ShieldCheck, 
  ExternalLink,
  CheckCircle2,
  Copy,
  Zap
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
  itemsCount: number;
  status: "new" | "contacted" | "closed";
  createdAt: string;
}

export default function AgentDashboardClient({ user }: AgentDashboardProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Agent Leads / Assigned Customers
    const fetchLeads = async () => {
      try {
        const res = await fetch("/api/agent/leads");
        if (res.ok) {
          const data = await res.json();
          setLeads(data.data || []);
        }
      } catch (err) {
        console.error("Failed to load agent leads", err);
      }
    };

    fetchLeads();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl px-6 md:px-12 py-5 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-wide">Staff & Agent Portal</h1>
              <span className="text-[8px] bg-[#D4AF37] text-black font-black uppercase px-2 py-0.5 rounded-full">
                {user.role}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-white font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5"
          >
            Storefront <ExternalLink size={12} />
          </Link>
        </div>
      </header>

      {/* Metrics Row */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start text-gray-400">
              <span className="text-[10px] font-black uppercase tracking-widest">Active Pipeline</span>
              <Users size={18} className="text-[#D4AF37]" />
            </div>
            <p className="text-3xl font-black font-mono mt-4">{leads.length}</p>
            <p className="text-[10px] text-gray-500 mt-1">High-intent client inquiries</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start text-gray-400">
              <span className="text-[10px] font-black uppercase tracking-widest">Pipeline Valuation</span>
              <TrendingUp size={18} className="text-green-400" />
            </div>
            <p className="text-3xl font-black font-mono mt-4 text-green-400">
              ₹{leads.reduce((sum, l) => sum + (l.cartTotal || 0), 0).toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-gray-500 mt-1">Cart checkout potential</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start text-gray-400">
              <span className="text-[10px] font-black uppercase tracking-widest">Quick Assist</span>
              <Zap size={18} className="text-[#D4AF37]" />
            </div>
            <p className="text-xs text-gray-300 mt-4 leading-relaxed">
              Directly ping interested customers on WhatsApp with pre-filled vault order details.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start text-gray-400">
              <span className="text-[10px] font-black uppercase tracking-widest">Agent Status</span>
              <Clock size={18} className="text-blue-400" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-emerald-400">Online & Active</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Live customer sync connected</p>
          </div>
        </div>

        {/* Lead Management Queue */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
            <div>
              <h2 className="text-xl font-bold font-serif">Customer Leads & Cart Dropoffs</h2>
              <p className="text-xs text-gray-400 mt-1">Verified customers with watches in active session.</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, phone..."
                className="w-full bg-black/50 border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-gray-600 outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Leads Table */}
          <div className="overflow-x-auto">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-xs uppercase tracking-widest">
                No active customer leads in queue
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[9px] uppercase font-black tracking-widest text-gray-500">
                    <th className="pb-3">Client</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3">Cart Value</th>
                    <th className="pb-3">Items</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLeads.map((lead) => {
                    const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
                    const waLink = `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(
                      lead.name
                    )},%20this%20is%20Essential%20Rush%20Vault%20concierge.%20We%20noticed%20your%20interest%20in%20our%20timepieces.`;

                    return (
                      <tr key={lead._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 font-bold text-white">{lead.name}</td>
                        <td className="py-4 font-mono text-gray-300">
                          <div className="flex items-center gap-2">
                            <span>{lead.phone || lead.email}</span>
                            {lead.phone && (
                              <button
                                onClick={() => copyToClipboard(lead.phone, lead._id)}
                                className="text-gray-500 hover:text-white transition-colors"
                              >
                                {copiedId === lead._id ? <CheckCircle2 size={12} className="text-green-400" /> : <Copy size={12} />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-4 font-mono font-bold text-emerald-400">
                          ₹{lead.cartTotal?.toLocaleString("en-IN") || 0}
                        </td>
                        <td className="py-4 text-gray-400">{lead.itemsCount || 1} Watches</td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {lead.phone && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black rounded-lg text-[9px] font-black uppercase tracking-wider transition-all inline-flex items-center gap-1.5"
                              >
                                <MessageSquare size={11} /> WhatsApp
                              </a>
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