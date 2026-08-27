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
  UserX,
  MoreHorizontal,
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
  ExternalLink,
  Crown,
  UserRound,
  Activity,
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

type SortKey =
  | "name"
  | "orders"
  | "spent"
  | "joined"
  | "status";

type SortDirection = "asc" | "desc";

const PAGE_SIZE = 8;

const formatCurrency = (amount: number) =>
  `₹${amount.toLocaleString("en-IN")}`;

const formatDate = (date?: string) => {
  if (!date) return "N/A";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "N/A";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name?: string) => {
  if (!name) return "AN";

  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const getRoleLabel = (role?: string) => {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "ADMIN":
      return "Admin";
    case "STAFF":
      return "Staff";
    default:
      return "Customer";
  }
};

const getStatus = (customer: Customer) => {
  if (customer.status) return customer.status;

  return "ACTIVE";
};

export default function CustomersCrmTab({
  customers,
}: CustomersCrmTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [copiedEmail, setCopiedEmail] = useState<string | null>(
    null
  );

  const [showFilters, setShowFilters] = useState(false);

  const safeCustomers = Array.isArray(customers) ? customers : [];

  /*
   * ---------------------------------------------------------
   * CRM STATISTICS
   * ---------------------------------------------------------
   */

  const stats = useMemo(() => {
    const totalUsers = safeCustomers.length;

    const activeBuyers = safeCustomers.filter(
      (customer) => (customer.totalOrders || 0) > 0
    ).length;

    const totalRevenue = safeCustomers.reduce(
      (sum, customer) => sum + (customer.totalSpent || 0),
      0
    );

    const totalOrders = safeCustomers.reduce(
      (sum, customer) => sum + (customer.totalOrders || 0),
      0
    );

    const admins = safeCustomers.filter(
      (customer) =>
        customer.role === "SUPER_ADMIN" ||
        customer.role === "ADMIN"
    ).length;

    const activeUsers = safeCustomers.filter(
      (customer) => getStatus(customer) === "ACTIVE"
    ).length;

    const averageOrderValue =
      totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalUsers,
      activeBuyers,
      totalRevenue,
      totalOrders,
      admins,
      activeUsers,
      averageOrderValue,
    };
  }, [safeCustomers]);

  /*
   * ---------------------------------------------------------
   * FILTER + SEARCH
   * ---------------------------------------------------------
   */

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const result = safeCustomers.filter((customer) => {
      const matchesSearch =
        !query ||
        customer.name?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "ALL" ||
        (customer.role || "CUSTOMER") === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        getStatus(customer) === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });

    return [...result].sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case "name":
          comparison = (a.name || "").localeCompare(
            b.name || ""
          );
          break;

        case "orders":
          comparison =
            (a.totalOrders || 0) - (b.totalOrders || 0);
          break;

        case "spent":
          comparison =
            (a.totalSpent || 0) - (b.totalSpent || 0);
          break;

        case "joined":
          comparison =
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime();
          break;

        case "status":
          comparison = getStatus(a).localeCompare(
            getStatus(b)
          );
          break;
      }

      return sortDirection === "asc"
        ? comparison
        : -comparison;
    });
  }, [
    safeCustomers,
    searchTerm,
    roleFilter,
    statusFilter,
    sortKey,
    sortDirection,
  ]);

  /*
   * ---------------------------------------------------------
   * PAGINATION
   * ---------------------------------------------------------
   */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / PAGE_SIZE)
  );

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  /*
   * ---------------------------------------------------------
   * SORT HANDLER
   * ---------------------------------------------------------
   */

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((previous) =>
        previous === "asc" ? "desc" : "asc"
      );
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }

    setCurrentPage(1);
  };

  /*
   * ---------------------------------------------------------
   * COPY EMAIL
   * ---------------------------------------------------------
   */

  const copyEmail = async (email?: string) => {
    if (!email) return;

    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);

      setTimeout(() => {
        setCopiedEmail(null);
      }, 1500);
    } catch {
      // Ignore clipboard errors
    }
  };

  /*
   * ---------------------------------------------------------
   * RESET FILTERS
   * ---------------------------------------------------------
   */

  const resetFilters = () => {
    setSearchTerm("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-7 pb-20"
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#111111] via-black to-[#0a0a0a] p-6 shadow-2xl">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                <Users size={18} />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                CRM / Customer Management
              </span>
            </div>

            <h2 className="text-2xl font-serif text-white">
              Customers & CRM
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-gray-400">
              Manage your customer database, monitor spending,
              orders, account status and customer activity from
              one centralized dashboard.
            </p>
          </div>

          {/* Search */}
          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            <div className="flex h-12 w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/60 px-4 shadow-inner sm:w-[360px]">
              <Search
                size={17}
                className="shrink-0 text-gray-500"
              />

              <input
                type="text"
                placeholder="Search name, email or phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
              />

              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className="text-gray-500 transition hover:text-white"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className={`flex h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-xs font-bold uppercase tracking-widest transition ${
                showFilters
                  ? "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]"
                  : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
            >
              <Activity size={15} />
              Filters
            </button>
          </div>
        </div>

        {/* FILTER PANEL */}

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="relative mt-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-4 border-t border-white/10 pt-5 md:grid-cols-3">
                <FilterSelect
                  label="Role"
                  value={roleFilter}
                  onChange={(value) => {
                    setRoleFilter(value);
                    setCurrentPage(1);
                  }}
                  options={[
                    ["ALL", "All Roles"],
                    ["CUSTOMER", "Customers"],
                    ["STAFF", "Staff"],
                    ["ADMIN", "Admins"],
                    ["SUPER_ADMIN", "Super Admins"],
                  ]}
                />

                <FilterSelect
                  label="Status"
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                  options={[
                    ["ALL", "All Status"],
                    ["ACTIVE", "Active"],
                    ["INACTIVE", "Inactive"],
                    ["BLOCKED", "Blocked"],
                  ]}
                />

                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-widest text-gray-400 transition hover:bg-white/10 hover:text-white"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Users size={21} />}
          label="Total Customers"
          value={stats.totalUsers.toLocaleString("en-IN")}
          description={`${stats.activeUsers} currently active`}
          iconClass="text-[#D4AF37]"
          bgClass="bg-[#D4AF37]/10"
        />

        <StatCard
          icon={<ShoppingBag size={21} />}
          label="Total Orders"
          value={stats.totalOrders.toLocaleString("en-IN")}
          description={`${stats.activeBuyers} active buyers`}
          iconClass="text-emerald-400"
          bgClass="bg-emerald-500/10"
        />

        <StatCard
          icon={<DollarSign size={21} />}
          label="Customer Revenue"
          value={formatCurrency(stats.totalRevenue)}
          description={`AOV ${formatCurrency(
            stats.averageOrderValue
          )}`}
          iconClass="text-purple-400"
          bgClass="bg-purple-500/10"
        />

        <StatCard
          icon={<Shield size={21} />}
          label="Admin / Staff"
          value={stats.admins.toLocaleString("en-IN")}
          description="Privileged accounts"
          iconClass="text-blue-400"
          bgClass="bg-blue-500/10"
        />
      </div>

      {/* =====================================================
          MINI ANALYTICS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MiniMetric
          icon={<UserCheck size={16} />}
          label="Active Users"
          value={`${stats.activeUsers}`}
          percentage={
            stats.totalUsers
              ? Math.round(
                  (stats.activeUsers / stats.totalUsers) *
                    100
                )
              : 0
          }
        />

        <MiniMetric
          icon={<TrendingUp size={16} />}
          label="Buyer Conversion"
          value={`${stats.activeBuyers}`}
          percentage={
            stats.totalUsers
              ? Math.round(
                  (stats.activeBuyers / stats.totalUsers) *
                    100
                )
              : 0
          }
        />

        <MiniMetric
          icon={<ShoppingBag size={16} />}
          label="Avg Orders / Buyer"
          value={
            stats.activeBuyers
              ? (
                  stats.totalOrders / stats.activeBuyers
                ).toFixed(1)
              : "0.0"
          }
          percentage={null}
        />
      </div>

      {/* =====================================================
          CUSTOMER DIRECTORY
      ====================================================== */}

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
        {/* Table Header */}

        <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users
                size={18}
                className="text-[#D4AF37]"
              />

              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
                Client Directory
              </h3>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Showing {paginatedCustomers.length} of{" "}
              {filteredCustomers.length} customers
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Sort:</span>

            <button
              onClick={() => handleSort("joined")}
              className="flex items-center gap-1 text-gray-300 hover:text-[#D4AF37]"
            >
              Latest
              <ArrowUpDown size={12} />
            </button>
          </div>
        </div>

        {/* Desktop Table */}

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.025] text-[9px] uppercase tracking-[0.2em] text-gray-500">
                <SortableHeader
                  label="Customer"
                  sortKey="name"
                  activeSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />

                <SortableHeader
                  label="Role / Status"
                  sortKey="status"
                  activeSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />

                <SortableHeader
                  label="Orders"
                  sortKey="orders"
                  activeSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />

                <SortableHeader
                  label="Total Spent"
                  sortKey="spent"
                  activeSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />

                <SortableHeader
                  label="Joined"
                  sortKey="joined"
                  activeSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />

                <th className="p-4 text-right font-bold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              <AnimatePresence mode="popLayout">
                {paginatedCustomers.map((user, index) => (
                  <CustomerRow
                    key={user._id}
                    user={user}
                    index={index}
                    copiedEmail={copiedEmail}
                    onCopyEmail={copyEmail}
                    onView={() =>
                      setSelectedCustomer(user)
                    }
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}

        <div className="divide-y divide-white/5 lg:hidden">
          {paginatedCustomers.map((user, index) => (
            <MobileCustomerCard
              key={user._id}
              user={user}
              index={index}
              onView={() =>
                setSelectedCustomer(user)
              }
            />
          ))}
        </div>

        {/* Empty State */}

        {filteredCustomers.length === 0 && (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-600">
              <Users size={26} />
            </div>

            <h4 className="text-sm font-bold uppercase tracking-widest text-gray-300">
              No Customers Found
            </h4>

            <p className="mt-2 text-xs text-gray-600">
              Try changing your search query or filters.
            </p>

            <button
              onClick={resetFilters}
              className="mt-5 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Pagination */}

        {filteredCustomers.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Page{" "}
              <span className="font-bold text-gray-300">
                {currentPage}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-300">
                {totalPages}
              </span>
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(1, page - 1)
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={15} />
              </button>

              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1)
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================
          CUSTOMER DETAIL DRAWER
      ====================================================== */}

      <AnimatePresence>
        {selectedCustomer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
              }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0b0b0b] shadow-2xl"
            >
              <CustomerDrawer
                customer={selectedCustomer}
                onClose={() =>
                  setSelectedCustomer(null)
                }
                onCopyEmail={copyEmail}
                copiedEmail={copiedEmail}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

function StatCard({
  icon,
  label,
  value,
  description,
  iconClass,
  bgClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  iconClass: string;
  bgClass: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md transition hover:border-white/20"
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/[0.02] blur-2xl transition group-hover:bg-white/[0.05]" />

      <div className="relative flex items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bgClass} ${iconClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-gray-500">
            {label}
          </p>

          <p className="mt-1 truncate text-xl font-serif text-white">
            {value}
          </p>

          <p className="mt-1 truncate text-[10px] text-gray-600">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/*
|--------------------------------------------------------------------------
| MINI METRIC
|--------------------------------------------------------------------------
*/

function MiniMetric({
  icon,
  label,
  value,
  percentage,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  percentage: number | null;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-[#D4AF37]">{icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {label}
          </span>
        </div>

        <span className="font-mono text-sm font-bold text-white">
          {value}
        </span>
      </div>

      {percentage !== null && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(100, percentage)}%`,
            }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full bg-[#D4AF37]"
          />
        </div>
      )}

      {percentage !== null && (
        <p className="mt-2 text-[9px] uppercase tracking-widest text-gray-600">
          {percentage}% of total users
        </p>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| FILTER SELECT
|--------------------------------------------------------------------------
*/

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-gray-500">
        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-black px-4 pr-10 text-xs text-gray-300 outline-none transition focus:border-[#D4AF37]/40"
        >
          {options.map(([optionValue, optionLabel]) => (
            <option
              key={optionValue}
              value={optionValue}
            >
              {optionLabel}
            </option>
          ))}
        </select>

        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
        />
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SORTABLE HEADER
|--------------------------------------------------------------------------
*/

function SortableHeader({
  label,
  sortKey,
  activeSort,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeSort: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const active = activeSort === sortKey;

  return (
    <th className="p-4">
      <button
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-2 font-bold transition ${
          active
            ? "text-[#D4AF37]"
            : "text-gray-500 hover:text-gray-300"
        }`}
      >
        {label}

        <ArrowUpDown
          size={11}
          className={
            active
              ? "text-[#D4AF37]"
              : "text-gray-700"
          }
        />

        {active && (
          <span className="text-[8px]">
            {direction === "asc" ? "↑" : "↓"}
          </span>
        )}
      </button>
    </th>
  );
}

/*
|--------------------------------------------------------------------------
| CUSTOMER ROW
|--------------------------------------------------------------------------
*/

function CustomerRow({
  user,
  index,
  copiedEmail,
  onCopyEmail,
  onView,
}: {
  user: Customer;
  index: number;
  copiedEmail: string | null;
  onCopyEmail: (email?: string) => void;
  onView: () => void;
}) {
  const status = getStatus(user);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      className="group border-b border-white/5 transition hover:bg-white/[0.025]"
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Avatar user={user} />

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              {user.name || "Anonymous Member"}
            </p>

            <div className="mt-1 flex items-center gap-2">
              <Mail
                size={11}
                className="text-[#D4AF37]"
              />

              <span className="max-w-[230px] truncate text-xs text-gray-500">
                {user.email || "No email"}
              </span>

              {user.email && (
                <button
                  onClick={() =>
                    onCopyEmail(user.email)
                  }
                  className="text-gray-600 transition hover:text-[#D4AF37]"
                  title="Copy email"
                >
                  {copiedEmail === user.email ? (
                    <Check size={11} />
                  ) : (
                    <Copy size={11} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </td>

      <td className="p-4">
        <div className="flex flex-col items-start gap-1.5">
          <RoleBadge role={user.role} />
          <StatusBadge status={status} />
        </div>
      </td>

      <td className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-gray-400">
            <ShoppingBag size={14} />
          </div>

          <span className="font-mono text-xs text-gray-300">
            {user.totalOrders || 0}
          </span>
        </div>
      </td>

      <td className="p-4">
        <span className="font-mono text-sm font-bold text-[#D4AF37]">
          {formatCurrency(user.totalSpent || 0)}
        </span>
      </td>

      <td className="p-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CalendarDays size={13} />
          {formatDate(user.createdAt)}
        </div>
      </td>

      <td className="p-4 text-right">
        <button
          onClick={onView}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 transition hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
        >
          <Eye size={13} />
          View
        </button>
      </td>
    </motion.tr>
  );
}

/*
|--------------------------------------------------------------------------
| MOBILE CUSTOMER CARD
|--------------------------------------------------------------------------
*/

function MobileCustomerCard({
  user,
  index,
  onView,
}: {
  user: Customer;
  index: number;
  onView: () => void;
}) {
  const status = getStatus(user);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar user={user} />

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              {user.name || "Anonymous Member"}
            </p>

            <p className="mt-1 truncate text-xs text-gray-500">
              {user.email || "No email"}
            </p>
          </div>
        </div>

        <button
          onClick={onView}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400"
        >
          <Eye size={15} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <RoleBadge role={user.role} />
        <StatusBadge status={status} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <MobileStat
          label="Orders"
          value={String(user.totalOrders || 0)}
        />

        <MobileStat
          label="Spent"
          value={formatCurrency(
            user.totalSpent || 0
          )}
        />

        <MobileStat
          label="Joined"
          value={formatDate(user.createdAt)}
        />
      </div>
    </motion.div>
  );
}

/*
|--------------------------------------------------------------------------
| MOBILE STAT
|--------------------------------------------------------------------------
*/

function MobileStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
      <p className="text-[8px] font-bold uppercase tracking-widest text-gray-600">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-bold text-gray-300">
        {value}
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| AVATAR
|--------------------------------------------------------------------------
*/

function Avatar({ user }: { user: Customer }) {
  const isAdmin =
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN";

  return (
    <div
      className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
        isAdmin
          ? "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"
          : "border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] text-gray-300"
      }`}
    >
      <span className="text-xs font-bold">
        {getInitials(user.name)}
      </span>

      {isAdmin && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-black bg-[#D4AF37] text-black">
          <Crown size={8} />
        </span>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| ROLE BADGE
|--------------------------------------------------------------------------
*/

function RoleBadge({ role }: { role?: string }) {
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";
  const isStaff = role === "STAFF";

  let classes =
    "border-white/10 bg-white/5 text-gray-400";

  if (isSuperAdmin) {
    classes =
      "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]";
  } else if (isAdmin) {
    classes =
      "border-purple-500/20 bg-purple-500/10 text-purple-300";
  } else if (isStaff) {
    classes =
      "border-blue-500/20 bg-blue-500/10 text-blue-300";
  }

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest ${classes}`}
    >
      {getRoleLabel(role)}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const config = {
    ACTIVE: {
      label: "Active",
      className:
        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-400",
    },
    INACTIVE: {
      label: "Inactive",
      className:
        "bg-gray-500/10 text-gray-500 border-gray-500/20",
      dot: "bg-gray-500",
    },
    BLOCKED: {
      label: "Blocked",
      className:
        "bg-red-500/10 text-red-400 border-red-500/20",
      dot: "bg-red-400",
    },
  }[status as "ACTIVE" | "INACTIVE" | "BLOCKED"];

  const fallback = {
    label: status,
    className:
      "bg-white/5 text-gray-400 border-white/10",
    dot: "bg-gray-500",
  };

  const current = config || fallback;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest ${current.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${current.dot}`}
      />

      {current.label}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| CUSTOMER DRAWER
|--------------------------------------------------------------------------
*/

function CustomerDrawer({
  customer,
  onClose,
  onCopyEmail,
  copiedEmail,
}: {
  customer: Customer;
  onClose: () => void;
  onCopyEmail: (email?: string) => void;
  copiedEmail: string | null;
}) {
  const status = getStatus(customer);

  return (
    <div className="min-h-full">
      {/* Header */}

      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0b0b]/95 p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Customer Profile
            </p>

            <h3 className="mt-1 text-lg font-serif text-white">
              Customer Details
            </h3>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-6 p-5">
        {/* Profile */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-4">
            <Avatar user={customer} />

            <div className="min-w-0">
              <h4 className="truncate text-lg font-bold text-white">
                {customer.name || "Anonymous Member"}
              </h4>

              <p className="truncate text-xs text-gray-500">
                {customer.email || "No email"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <RoleBadge role={customer.role} />
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Contact */}

        <div>
          <SectionTitle title="Contact Information" />

          <div className="mt-3 space-y-2">
            <ContactItem
              icon={<Mail size={15} />}
              label="Email"
              value={customer.email || "Not available"}
              action={
                customer.email
                  ? {
                      label:
                        copiedEmail === customer.email
                          ? "Copied"
                          : "Copy",
                      onClick: () =>
                        onCopyEmail(customer.email),
                    }
                  : undefined
              }
            />

            <ContactItem
              icon={<Phone size={15} />}
              label="Phone"
              value={customer.phone || "Not available"}
            />
          </div>
        </div>

        {/* Financial */}

        <div>
          <SectionTitle title="Customer Value" />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <DetailMetric
              icon={<ShoppingBag size={16} />}
              label="Orders"
              value={String(
                customer.totalOrders || 0
              )}
            />

            <DetailMetric
              icon={<DollarSign size={16} />}
              label="Total Spent"
              value={formatCurrency(
                customer.totalSpent || 0
              )}
            />
          </div>
        </div>

        {/* Account */}

        <div>
          <SectionTitle title="Account Information" />

          <div className="mt-3 space-y-2">
            <ContactItem
              icon={<CalendarDays size={15} />}
              label="Joined"
              value={formatDate(customer.createdAt)}
            />

            <ContactItem
              icon={<UserRound size={15} />}
              label="Account Role"
              value={getRoleLabel(customer.role)}
            />

            <ContactItem
              icon={<Activity size={15} />}
              label="Status"
              value={status}
            />
          </div>
        </div>

        {/* Actions */}

        <div className="space-y-2 pt-2">
          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] text-xs font-bold uppercase tracking-widest text-black transition hover:bg-[#e4c34d]"
            >
              <Mail size={14} />
              Email Customer
            </a>
          )}

          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-widest text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              <Phone size={14} />
              Call Customer
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SECTION TITLE
|--------------------------------------------------------------------------
*/

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
      {title}
    </h4>
  );
}

/*
|--------------------------------------------------------------------------
| CONTACT ITEM
|--------------------------------------------------------------------------
*/

function ContactItem({
  icon,
  label,
  value,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.025] p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[#D4AF37]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-600">
          {label}
        </p>

        <p className="mt-0.5 truncate text-xs text-gray-300">
          {value}
        </p>
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="shrink-0 text-[9px] font-bold uppercase tracking-widest text-[#D4AF37]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| DETAIL METRIC
|--------------------------------------------------------------------------
*/

function DetailMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-center gap-2 text-[#D4AF37]">
        {icon}

        <span className="text-[8px] font-bold uppercase tracking-widest text-gray-600">
          {label}
        </span>
      </div>

      <p className="mt-3 text-xl font-serif text-white">
        {value}
      </p>
    </div>
  );
}