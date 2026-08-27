"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Trash2,
  Download,
  ExternalLink,
  Package,
  Calendar,
  IndianRupee,
  User,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  ChevronRight,
  X,
  LucideIcon,
} from "lucide-react";

/* ============================================================= */
/* TYPES */
/* ============================================================= */

export interface OrderItem {
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface OrderCustomer {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

export interface OrderData {
  _id: string;
  orderId?: string;
  customer?: OrderCustomer;
  items?: OrderItem[];
  totalAmount: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  trackingNumber?: string;
  courier?: string;
  createdAt: string;
  updatedAt?: string;
}

interface OrderTrackerTabProps {
  orders: OrderData[];
  exportToCSV: () => void;
  handleUpdateOrderStatus: (orderId: string, status: string) => Promise<void>;
  handleUpdateTracking: (orderId: string, trackingNumber: string, courier: string) => Promise<void>;
  setSelectedOrder: (order: OrderData | null) => void;
  handleDeleteOrder: (orderId: string) => Promise<void>;
}

/* ============================================================= */
/* STATUS CONFIGURATION */
/* ============================================================= */

interface StatusStyle {
  label: string;
  shortLabel: string;
  wrapper: string;
  text: string;
  dot: string;
  icon: LucideIcon;
}

const STATUS_CONFIG: Record<string, StatusStyle> = {
  PENDING: {
    label: "Payment Pending",
    shortLabel: "Pending",
    wrapper: "border-amber-500/20 bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
    icon: Clock,
  },
  PROCESSING: {
    label: "In Production / Packing",
    shortLabel: "Processing",
    wrapper: "border-cyan-500/20 bg-cyan-500/10",
    text: "text-cyan-400",
    dot: "bg-cyan-400",
    icon: RefreshCw,
  },
  SHIPPED: {
    label: "Dispatched / In Transit",
    shortLabel: "Shipped",
    wrapper: "border-blue-500/20 bg-blue-500/10",
    text: "text-blue-400",
    dot: "bg-blue-400",
    icon: Truck,
  },
  DELIVERED: {
    label: "Delivered & Verified",
    shortLabel: "Delivered",
    wrapper: "border-emerald-500/20 bg-emerald-500/10",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled / Voided",
    shortLabel: "Cancelled",
    wrapper: "border-red-500/20 bg-red-500/10",
    text: "text-red-400",
    dot: "bg-red-400",
    icon: XCircle,
  },
};

function getStatusConfig(status?: string): StatusStyle {
  const normalized = (status || "PENDING").toUpperCase();
  return STATUS_CONFIG[normalized] || STATUS_CONFIG.PENDING;
}

/* ============================================================= */
/* SUB-COMPONENT: STATUS BADGE */
/* ============================================================= */

function StatusBadge({ status }: { status?: string }) {
  const config = getStatusConfig(status);
  const IconComponent = config.icon;
  const isProcessing = (status || "").toUpperCase() === "PROCESSING";

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-widest ${config.wrapper} ${config.text}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dot} ${isProcessing ? "animate-pulse" : ""}`}
      />
      <IconComponent size={11} className="shrink-0" />
      {config.shortLabel}
    </span>
  );
}

/* ============================================================= */
/* MAIN COMPONENT */
/* ============================================================= */

export default function OrderTrackerTab({
  orders,
  exportToCSV,
  handleUpdateOrderStatus,
  handleUpdateTracking,
  setSelectedOrder,
  handleDeleteOrder,
}: OrderTrackerTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeModalOrder, setActiveModalOrder] = useState<OrderData | null>(null);
  const [trackingInput, setTrackingInput] = useState({ number: "", courier: "" });
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !q ||
        (order.orderId || order._id).toLowerCase().includes(q) ||
        (order.customer?.name || "").toLowerCase().includes(q) ||
        (order.customer?.email || "").toLowerCase().includes(q) ||
        (order.trackingNumber || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        (order.status || "").toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const metrics = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const inTransit = orders.filter((o) => o.status === "SHIPPED").length;
    const processing = orders.filter((o) => o.status === "PROCESSING" || o.status === "PENDING").length;

    return { total, delivered, inTransit, processing };
  }, [orders]);

  const openOrderDetails = (order: OrderData) => {
    setActiveModalOrder(order);
    setSelectedOrder(order);
    setTrackingInput({
      number: order.trackingNumber || "",
      courier: order.courier || "BlueDart Luxury Logistics",
    });
  };

  const submitTrackingUpdate = async () => {
    if (!activeModalOrder) return;
    setIsUpdatingTracking(true);
    try {
      await handleUpdateTracking(activeModalOrder._id, trackingInput.number, trackingInput.courier);
      setActiveModalOrder((prev) =>
        prev ? { ...prev, trackingNumber: trackingInput.number, courier: trackingInput.courier } : null
      );
    } finally {
      setIsUpdatingTracking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-24"
    >
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 p-6 rounded-2xl border border-white/10 gap-4">
        <div>
          <h2 className="text-xl font-serif text-[#D4AF37]">Order Fulfilment & Logistics</h2>
          <p className="text-sm text-gray-400">Track real-time consignments, customer shipments, and update courier routing.</p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-white/10 text-white hover:bg-white hover:text-black px-5 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-colors shrink-0"
        >
          <Download size={14} /> Export Manifest
        </button>
      </div>

      {/* METRIC TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
          <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Total Consignments</p>
          <p className="text-2xl font-serif text-white mt-1">{metrics.total}</p>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
          <p className="text-[9px] text-cyan-400 uppercase font-black tracking-widest">In Processing</p>
          <p className="text-2xl font-serif text-cyan-400 mt-1">{metrics.processing}</p>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
          <p className="text-[9px] text-blue-400 uppercase font-black tracking-widest">In Transit</p>
          <p className="text-2xl font-serif text-blue-400 mt-1">{metrics.inTransit}</p>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
          <p className="text-[9px] text-emerald-400 uppercase font-black tracking-widest">Completed</p>
          <p className="text-2xl font-serif text-emerald-400 mt-1">{metrics.delivered}</p>
        </div>
      </div>

      {/* TABLE & CONTROLS */}
      <section className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
        {/* FILTERS */}
        <div className="p-5 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Order ID, Client, Tracking #..."
              className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
            {["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-colors ${
                  statusFilter === st ? "bg-[#D4AF37] text-black" : "text-gray-400 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* ORDERS TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-[9px] uppercase tracking-widest text-gray-400">
                <th className="p-4 font-bold">Order ID</th>
                <th className="p-4 font-bold">Customer Details</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Logistics Tracking</th>
                <th className="p-4 font-bold">Total Amount</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <p className="font-mono text-[#D4AF37] font-bold">
                      #{order.orderId || order._id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-[9px] text-gray-500 mt-0.5">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "Recent"}
                    </p>
                  </td>

                  <td className="p-4">
                    <p className="font-bold text-white">{order.customer?.name || "Private Client"}</p>
                    <p className="text-[10px] text-gray-400">{order.customer?.email || order.customer?.phone || "No direct contact"}</p>
                  </td>

                  <td className="p-4">
                    <StatusBadge status={order.status} />
                  </td>

                  <td className="p-4">
                    {order.trackingNumber ? (
                      <div>
                        <span className="font-mono text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                          {order.trackingNumber}
                        </span>
                        <p className="text-[9px] text-gray-500 mt-1">{order.courier || "BlueDart Express"}</p>
                      </div>
                    ) : (
                      <span className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">
                        Unassigned
                      </span>
                    )}
                  </td>

                  <td className="p-4 font-mono font-bold text-emerald-400">
                    ₹{(order.totalAmount || 0).toLocaleString("en-IN")}
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openOrderDetails(order)}
                        className="p-2 bg-white/5 hover:bg-white hover:text-black rounded-lg transition-colors text-gray-400"
                        title="View Full Consignment"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order._id)}
                        className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 text-xs uppercase font-bold tracking-widest">
                    No orders match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL: ORDER DETAILS & LOGISTICS DISPATCH */}
      <AnimatePresence>
        {activeModalOrder && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setActiveModalOrder(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0c0c0c] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl"
            >
              {/* MODAL HEADER */}
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <span className="text-[9px] font-mono text-[#D4AF37] uppercase tracking-widest">Consignment Dossier</span>
                  <h3 className="text-xl font-serif text-white">
                    Order #{activeModalOrder.orderId || activeModalOrder._id}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModalOrder(null)}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* STATUS CONTROLLER */}
              <div>
                <label className="text-[9px] text-gray-400 uppercase font-black tracking-widest block mb-2">
                  Update Fulfilment Stage
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateOrderStatus(activeModalOrder._id, st)}
                      className={`p-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                        activeModalOrder.status === st
                          ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                          : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* LOGISTICS ROUTING FORM */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                <p className="text-[9px] text-[#D4AF37] uppercase font-black tracking-widest flex items-center gap-1.5">
                  <Truck size={12} /> Assign Logistics & Tracking
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Tracking AWB Number"
                    value={trackingInput.number}
                    onChange={(e) => setTrackingInput({ ...trackingInput, number: e.target.value })}
                    className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                  <input
                    type="text"
                    placeholder="Carrier Name (e.g., BlueDart, DHL)"
                    value={trackingInput.courier}
                    onChange={(e) => setTrackingInput({ ...trackingInput, courier: e.target.value })}
                    className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <button
                  onClick={submitTrackingUpdate}
                  disabled={isUpdatingTracking}
                  className="w-full py-2 bg-white/10 hover:bg-white hover:text-black border border-white/15 rounded-lg text-[9px] font-black uppercase tracking-widest text-white transition-colors"
                >
                  {isUpdatingTracking ? "Updating Route..." : "Save Tracking Information"}
                </button>
              </div>

              {/* CLIENT DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                  <p className="text-[8px] uppercase tracking-widest text-gray-500 font-bold mb-2">Recipient</p>
                  <p className="font-bold text-white">{activeModalOrder.customer?.name || "Anonymous"}</p>
                  <p className="text-gray-400 mt-1">{activeModalOrder.customer?.email}</p>
                  <p className="text-gray-400">{activeModalOrder.customer?.phone}</p>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                  <p className="text-[8px] uppercase tracking-widest text-gray-500 font-bold mb-2">Delivery Vault</p>
                  <p className="text-gray-300 leading-relaxed">
                    {activeModalOrder.customer?.address || "Address details on file"}
                    {activeModalOrder.customer?.city && `, ${activeModalOrder.customer.city}`}
                    {activeModalOrder.customer?.postalCode && ` - ${activeModalOrder.customer.postalCode}`}
                  </p>
                </div>
              </div>

              {/* ITEMS BREAKDOWN */}
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-3">Manifest Contents</p>
                <div className="space-y-2">
                  {(activeModalOrder.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-3 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-white/10" />
                        )}
                        <div>
                          <p className="font-bold text-white">{item.name}</p>
                          <p className="text-[10px] text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}