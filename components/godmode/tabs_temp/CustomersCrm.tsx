"use client";

import React, { useMemo, useState } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  ShoppingBag,
  Shield,
  DollarSign,
  UserCheck,
  Eye,
  Copy,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  TrendingUp,
  CalendarDays,
  X,
  Crown,
  UserRound,
  Activity,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Customer {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  totalOrders?: number;
  totalSpent?: number;
  createdAt?: string;
  lastActiveAt?: string;
  status?: "ACTIVE" | "INACTIVE" | "BLOCKED";
}

interface CustomersCrmTabProps {
  customers: Customer[];
}

type SortKey = "name" | "orders" | "spent" | "joined" | "status";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 8;
const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

const formatDate = (date?: string) => {
  if (!date) return "N/A";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const getInitials = (name?: string) => {
  if (!name) return "CL";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
};

const getRoleLabel = (role?: string) => {
  switch (role) {
    case "SUPER_ADMIN": return "Super Admin";
    case "ADMIN": return "Admin";
    case "AGENT": return "Sales Agent";
    case "STAFF": return "Staff";
    default: return "Vault Client";
  }
};

export default function CustomersCrmTab({ customers }: CustomersCrmTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const safeCustomers = Array.isArray(customers) ? customers : [];

  const stats = useMemo(() => {
    const totalUsers = safeCustomers.length;
    const activeBuyers = safeCustomers.filter((c) => (c.totalOrders || 0) > 0).length;
    const totalRevenue = safeCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const totalOrders = safeCustomers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
    const admins = safeCustomers.filter((c) => ["SUPER_ADMIN", "ADMIN", "AGENT", "STAFF"].includes(c.role || "")).length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return { totalUsers, activeBuyers, totalRevenue, totalOrders, admins, averageOrderValue };
  }, [safeCustomers]);

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const result = safeCustomers.filter((customer) => {
      const matchesSearch =
        !query ||
        customer.name?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query);

      const matchesRole = roleFilter === "ALL" || (customer.role || "USER") === roleFilter;

      return matchesSearch && matchesRole;
    });

    return [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case "name": comparison = (a.name || "").localeCompare(b.name || ""); break;
        case "orders": comparison = (a.totalOrders || 0) - (b.totalOrders || 0); break;
        case "spent": comparison = (a.totalSpent || 0) - (b.totalSpent || 0); break;
        case "joined": comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(); break;
        default: break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [safeCustomers, searchTerm, roleFilter, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const copyEmail = async (email?: string) => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 1500);
    } catch {
      // Ignore
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-7 pb-20 font-sans text-white">
      {/* HEADER */}
      <div className="bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">Customer Relationship Suite</span>
          </div>
          <h2 className="text-2xl font-serif font-black">Clients & Vault Members</h2>
          <p className="text-xs text-gray-400 mt-1">Manage purchase history, VIP tier status, and direct customer communication.</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search client, email, phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-black border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-gray-600 outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<Users size={20} />} label="Total Members" value={stats.totalUsers.toLocaleString("en-IN")} description={`${stats.activeBuyers} Active Buyers`} />
        <StatCard icon={<ShoppingBag size={20} />} label="Vault Orders" value={stats.totalOrders.toLocaleString("en-IN")} description="Total Placed Transactions" />
        <StatCard icon={<DollarSign size={20} />} label="Customer Revenue" value={formatCurrency(stats.totalRevenue)} description={`AOV: ${formatCurrency(Math.round(stats.averageOrderValue))}`} />
        <StatCard icon={<Shield size={20} />} label="Privileged Staff" value={stats.admins.toLocaleString("en-IN")} description="Super Admin & Agents" />
      </div>

      {/* TABLE */}
      <section className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/10 text-[9px] uppercase tracking-widest text-gray-400">
                <th className="p-4 font-bold cursor-pointer" onClick={() => handleSort("name")}>Client</th>
                <th className="p-4 font-bold">Role & Status</th>
                <th className="p-4 font-bold cursor-pointer" onClick={() => handleSort("orders")}>Orders</th>
                <th className="p-4 font-bold cursor-pointer" onClick={() => handleSort("spent")}>Total Valuation</th>
                <th className="p-4 font-bold cursor-pointer" onClick={() => handleSort("joined")}>Joined</th>
                <th className="p-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedCustomers.map((user) => (
                <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center font-bold text-xs text-[#D4AF37]">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="font-bold text-white">{user.name || "Anonymous Member"}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{user.email || user.phone || "No direct email"}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-white/5 border border-white/10 text-gray-300">
                      {getRoleLabel(user.role)}
                    </span>
                  </td>

                  <td className="p-4 font-mono">{user.totalOrders || 0}</td>
                  <td className="p-4 font-mono font-bold text-emerald-400">{formatCurrency(user.totalSpent || 0)}</td>
                  <td className="p-4 text-gray-400">{formatDate(user.createdAt)}</td>

                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedCustomer(user)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-[#D4AF37] hover:text-black rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredCustomers.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t border-white/10 text-xs text-gray-400">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* CUSTOMER PROFILE DRAWER */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-black/80 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)}>
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0c0c0c] border-l border-white/15 w-full max-w-md h-full p-6 md:p-8 space-y-6 overflow-y-auto"
            >
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <span className="text-[9px] font-mono text-[#D4AF37] uppercase tracking-widest">Client Dossier</span>
                  <h3 className="text-xl font-serif font-bold text-white mt-1">{selectedCustomer.name || "Member"}</h3>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                <p className="text-[9px] uppercase font-bold text-gray-400">Contact Details</p>
                <p className="text-sm font-mono text-white">{selectedCustomer.email || "No Email on file"}</p>
                <p className="text-sm font-mono text-gray-300">{selectedCustomer.phone || "No Phone on file"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-[8px] uppercase font-bold text-gray-400">Total Orders</p>
                  <p className="text-2xl font-mono font-bold mt-2">{selectedCustomer.totalOrders || 0}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-[8px] uppercase font-bold text-gray-400">Total Spent</p>
                  <p className="text-2xl font-mono font-bold text-emerald-400 mt-2">{formatCurrency(selectedCustomer.totalSpent || 0)}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                {selectedCustomer.email && (
                  <a
                    href={`mailto:${selectedCustomer.email}`}
                    className="w-full py-3 bg-[#D4AF37] text-black font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-all"
                  >
                    <Mail size={14} /> Send VIP Concierge Email
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({ icon, label, value, description }: { icon: React.ReactNode; label: string; value: string; description: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex justify-between items-start">
        <span className="text-[9px] uppercase tracking-widest font-black text-gray-400">{label}</span>
        <div className="text-[#D4AF37]">{icon}</div>
      </div>
      <p className="text-2xl font-mono font-bold text-white mt-4">{value}</p>
      <p className="text-[10px] text-gray-500 mt-1">{description}</p>
    </div>
  );
}