"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Trash2,
  Download,
  ExternalLink,
  Package,
  RefreshCw,
  X,
  LucideIcon,
  Send,
  ShieldAlert,
} from "lucide-react";

/* ============================================================= */
/* TYPES                                                         */
/* ============================================================= */

export interface OrderItem {
  _id?: string;
  name: string;
  price: number;
  quantity?: number;
  qty?: number;
  imageUrl?: string;
}

export interface OrderCustomer {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  pincode?: string;
}

export interface OrderData {
  _id: string;
  orderId?: string;
  customer?: OrderCustomer;
  items?: OrderItem[];
  totalAmount: number;
  status: string;
  paymentStatus?: string;
  trackingNumber?: string;
  trackingId?: string;
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
/* STATUS CONFIGURATION                                          */
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
  ORDER_CREATED: {
    label: "Order Created",
    shortLabel: "Created",
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
  PACKED: {
    label: "Vault Inspected & Packed",
    shortLabel: "Packed",
    wrapper: "border-purple-500/20 bg-purple-500/10",
    text: "text-purple-400",
    dot: "bg-purple-400",
    icon: Package,
  },
  SHIPPED: {
    label: "Dispatched / In Transit",
    shortLabel: "In Transit",
    wrapper: "border-blue-500/20 bg-blue-500/10",
    text: "text-blue-400",
    dot: "bg-blue-400",
    icon: Truck,
  },
  DISPATCHED: {
    label: "Dispatched",
    shortLabel: "Dispatched",
    wrapper: "border-blue-500/20 bg-blue-500/10",
    text: "text-blue-400",
    dot: "bg-blue-400",
    icon: Truck,
  },
  OUT_FOR_DELIVERY: {
    label: "Out For Delivery",
    shortLabel: "Out for Delivery",
    wrapper: "border-indigo-500/20 bg-indigo-500/10",
    text: "text-indigo-400",
    dot: "bg-indigo-400",
    icon: Send,
  },
  DELIVERED: {
    label: "Delivered & Verified",
    shortLabel: "Delivered",
    wrapper: "border-emerald-500/20 bg-emerald-500/10",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    icon: CheckCircle2,
  },
  DELAYED: {
    label: "Fulfillment SLA Delayed",
    shortLabel: "Delayed (>48h)",
    wrapper: "border-orange-500/30 bg-orange-500/15",
    text: "text-orange-400",
    dot: "bg-orange-400",
    icon: AlertTriangle,
  },
  CANCELLED: {
    label: "Cancelled / Voided",
    shortLabel: "Cancelled",
    wrapper: "border-red-500/20 bg-red-500/10",
    text: "text-red-400",
    dot: "bg-red-400",
    icon: XCircle,
  },
  RETURNED: {
    label: "Returned to Vault",
    shortLabel: "Returned",
    wrapper: "border-rose-500/20 bg-rose-500/10",
    text: "text-rose-400",
    dot: "bg-rose-400",
    icon: ShieldAlert,
  },
};

function getStatusConfig(status?: string, createdAt?: string): StatusStyle {
  const normalized = (status || "PENDING").toUpperCase();

  // Automatic SLA delay calculation (>48h in Processing)
  if (
    (normalized === "PROCESSING" || normalized === "PENDING" || normalized === "ORDER_CREATED") &&
    createdAt &&
    Date.now() - new Date(createdAt).getTime() > 48 * 60 * 60 * 1000
  ) {
    return STATUS_CONFIG.DELAYED;
  }

  return STATUS_CONFIG[normalized] || STATUS_CONFIG.PENDING;
}

function StatusBadge({ status, createdAt }: { status?: string; createdAt?: string }) {
  const config = getStatusConfig(status, createdAt);
  const IconComponent = config.icon;
  const isPulsing = (status || "").toUpperCase() === "PROCESSING" || config.shortLabel.includes("Delayed");

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-widest ${config.wrapper} ${config.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot} ${isPulsing ? "animate-pulse" : ""}`} />
      <IconComponent size={11} className="shrink-0" />
      {config.shortLabel}
    </span>
  );
}

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
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((order) => {
      const id = (order.orderId || order._id).toLowerCase();
      const customerName = (order.customer?.name || "").toLowerCase();
      const customerEmail = (order.customer?.email || "").toLowerCase();
      const tracking = (order.trackingNumber || order.trackingId || "").toLowerCase();

      const matchesSearch = !q || id.includes(q) || customerName.includes(q) || customerEmail.includes(q) || tracking.includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        (order.status || "").toUpperCase() === statusFilter ||
        (statusFilter === "DELAYED" &&
          Date.now() - new Date(order.createdAt).getTime() > 48 * 60 * 60 * 1000 &&
          ["PROCESSING", "PENDING"].includes((order.status || "").toUpperCase()));

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const metrics = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter((o) => (o.status || "").toUpperCase() === "DELIVERED").length;
    const inTransit = orders.filter((o) => ["SHIPPED", "DISPATCHED", "IN_TRANSIT"].includes((o.status || "").toUpperCase())).length;
    const delayed = orders.filter(
      (o) =>
        ["PROCESSING", "PENDING"].includes((o.status || "").toUpperCase()) &&
        Date.now() - new Date(o.createdAt).getTime() > 48 * 60 * 60 * 1000
    ).length;

    return { total, delivered, inTransit, delayed };
  }, [orders]);

  const openOrderDetails = (order: OrderData) => {
    setActiveModalOrder(order);
    setSelectedOrder(order);
    setTrackingInput({
      number: order.trackingNumber || order.trackingId || "",
      courier: order.courier || "BlueDart Express",
    });
  };

  const submitStatusChange = async (newStatus: string) => {
    if (!activeModalOrder) return;
    setIsUpdating(true);
    try {
      await handleUpdateOrderStatus(activeModalOrder._id, newStatus);
      setActiveModalOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    } finally {
      setIsUpdating(false);
    }
  };

  const submitTrackingUpdate = async () => {
    if (!activeModalOrder) return;
    setIsUpdating(true);
    try {
      await handleUpdateTracking(activeModalOrder._id, trackingInput.number, trackingInput.courier);
      setActiveModalOrder((prev) =>
        prev
          ? {
              ...prev,
              trackingNumber: trackingInput.number,
              trackingId: trackingInput.number,
              courier: trackingInput.courier,
              status: prev.status === "Pending" || prev.status === "Processing" ? "SHIPPED" : prev.status,
            }
          : null
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-24 font-sans">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0a0a0a] p-6 rounded-3xl border border-white/10 gap-4 shadow-xl">
        <div>
          <h2 className="text-xl font-serif text-[#D4AF37]">Order Lifecycle & Logistics Command</h2>
          <p className="text-xs text-gray-400 mt-1">
            Real-time consignment dispatching, delay mitigation, and customer notifications.
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-white/10 text-white hover:bg-[#D4AF37] hover:text-black px-5 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Download size={14} /> Export Manifest
        </button>
      </div>

      {/* METRIC TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Total Consignments</p>
          <p className="text-3xl font-mono text-white mt-2 font-bold">{metrics.total}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-[9px] text-blue-400 uppercase font-black tracking-widest">In Transit</p>
          <p className="text-3xl font-mono text-blue-400 mt-2 font-bold">{metrics.inTransit}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-[9px] text-emerald-400 uppercase font-black tracking-widest">Delivered</p>
          <p className="text-3xl font-mono text-emerald-400 mt-2 font-bold">{metrics.delivered}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-[9px] text-orange-400 uppercase font-black tracking-widest">Delayed (&gt;48h)</p>
          <p className="text-3xl font-mono text-orange-400 mt-2 font-bold">{metrics.delayed}</p>
        </div>
      </div>

      {/* TABLE SECTION */}
      <section className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        {/* FILTERS */}
        <div className="p-5 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Order ID, Client, Tracking #..."
              className="w-full bg-black border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto bg-black p-1.5 rounded-xl border border-white/10 shrink-0">
            {["ALL", "PROCESSING", "SHIPPED", "DELIVERED", "DELAYED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  statusFilter === st ? "bg-[#D4AF37] text-black shadow-md" : "text-gray-400 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* ORDERS TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/10 text-[9px] uppercase tracking-widest text-gray-400">
                <th className="p-4 font-bold">Order ID</th>
                <th className="p-4 font-bold">Customer</th>
                <th className="p-4 font-bold">Fulfilment Stage</th>
                <th className="p-4 font-bold">Tracking #</th>
                <th className="p-4 font-bold">Amount</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <p className="font-mono text-[#D4AF37] font-bold">#{order.orderId || order._id.slice(-6).toUpperCase()}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "Recent"}
                    </p>
                  </td>

                  <td className="p-4">
                    <p className="font-bold text-white">{order.customer?.name || "Private Client"}</p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {order.customer?.phone || order.customer?.email || "No contact"}
                    </p>
                  </td>

                  <td className="p-4">
                    <StatusBadge status={order.status} createdAt={order.createdAt} />
                  </td>

                  <td className="p-4">
                    {order.trackingNumber || order.trackingId ? (
                      <div>
                        <span className="font-mono text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                          {order.trackingNumber || order.trackingId}
                        </span>
                        <p className="text-[9px] text-gray-500 mt-1">{order.courier || "BlueDart Express"}</p>
                      </div>
                    ) : (
                      <span className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">Awaiting Route</span>
                    )}
                  </td>

                  <td className="p-4 font-mono font-bold text-emerald-400">
                    ₹{(order.totalAmount || 0).toLocaleString("en-IN")}
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openOrderDetails(order)}
                        className="p-2 bg-white/5 hover:bg-[#D4AF37] hover:text-black rounded-lg transition-all text-gray-400 cursor-pointer"
                        title="View Consignment"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order._id)}
                        className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                        title="Delete Order"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 text-xs uppercase font-bold tracking-widest">
                    No orders match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL: STAGE UPDATES & LOGISTICS DISPATCH */}
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
              className="bg-[#0c0c0c] border border-white/15 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl"
            >
              {/* MODAL HEADER */}
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <span className="text-[9px] font-mono text-[#D4AF37] uppercase tracking-widest">
                    Consignment Manifest
                  </span>
                  <h3 className="text-xl font-serif text-white mt-1">
                    Order #{activeModalOrder.orderId || activeModalOrder._id}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModalOrder(null)}
                  className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* FULFILMENT STAGES (FULL LIFECYCLE) */}
              <div>
                <label className="text-[9px] text-gray-400 uppercase font-black tracking-widest block mb-3">
                  Transition Lifecycle Stage
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    "PROCESSING",
                    "PACKED",
                    "DISPATCHED",
                    "OUT_FOR_DELIVERY",
                    "DELIVERED",
                    "DELAYED",
                    "RETURNED",
                    "CANCELLED",
                  ].map((st) => (
                    <button
                      key={st}
                      disabled={isUpdating}
                      onClick={() => submitStatusChange(st)}
                      className={`p-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all cursor-pointer disabled:opacity-50 ${
                        activeModalOrder.status.toUpperCase() === st
                          ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20"
                          : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {st.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* LOGISTICS FORM */}
              <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-4">
                <p className="text-[9px] text-[#D4AF37] uppercase font-black tracking-widest flex items-center gap-1.5">
                  <Truck size={13} /> Assign AWB Courier Tracking
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="AWB Tracking Number"
                    value={trackingInput.number}
                    onChange={(e) => setTrackingInput({ ...trackingInput, number: e.target.value })}
                    className="bg-black border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                  <input
                    type="text"
                    placeholder="Carrier Name (BlueDart, Delhivery, DHL)"
                    value={trackingInput.courier}
                    onChange={(e) => setTrackingInput({ ...trackingInput, courier: e.target.value })}
                    className="bg-black border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <button
                  onClick={submitTrackingUpdate}
                  disabled={isUpdating || !trackingInput.number.trim()}
                  className="w-full py-3 bg-[#D4AF37] hover:bg-white text-black font-black uppercase text-[9px] tracking-widest rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isUpdating ? "Dispatching Updates..." : "Save Tracking & Notify Customer"}
                </button>
              </div>

              {/* RECIPIENT DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold mb-2">Recipient</p>
                  <p className="font-bold text-white">{activeModalOrder.customer?.name || "Client"}</p>
                  <p className="text-gray-400 mt-1">{activeModalOrder.customer?.email}</p>
                  <p className="text-gray-400 font-mono">{activeModalOrder.customer?.phone}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold mb-2">Vault Address</p>
                  <p className="text-gray-300 leading-relaxed">
                    {activeModalOrder.customer?.address || "Address on record"}
                    {activeModalOrder.customer?.city && `, ${activeModalOrder.customer.city}`}
                    {(activeModalOrder.customer?.pincode || activeModalOrder.customer?.postalCode) &&
                      ` - ${activeModalOrder.customer.pincode || activeModalOrder.customer.postalCode}`}
                  </p>
                </div>
              </div>

              {/* ITEMS */}
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-3">Manifest Contents</p>
                <div className="space-y-2">
                  {(activeModalOrder.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-3.5 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-white/10" />
                        )}
                        <div>
                          <p className="font-bold text-white">{item.name}</p>
                          <p className="text-[10px] text-gray-500">Qty: {item.quantity || item.qty || 1}</p>
                        </div>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">
                        ₹{(item.price * (item.quantity || item.qty || 1)).toLocaleString("en-IN")}
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