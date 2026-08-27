"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AnimatePresence, motion } from "framer-motion";

import {
  Landmark,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  User,
  WalletCards,
  IndianRupee,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Eye,
  X,
  ChevronDown,
  ArrowUpDown,
  CalendarDays,
  Banknote,
  Smartphone,
  AlertTriangle,
  Timer,
  CircleDollarSign,
  RotateCcw,
  FileText,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED";

type PaymentMethodType = "upi" | "bank" | string;

interface PaymentDetails {
  upiId?: string;
  accountName?: string;
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
  branch?: string;
  [key: string]: unknown;
}

interface PaymentMethod {
  type?: PaymentMethodType;
  details?: PaymentDetails;
}

interface WithdrawalRequest {
  _id: string;
  userId?: string;
  userEmail?: string;
  amount?: number;
  status: WithdrawalStatus | string;
  createdAt?: string;
  updatedAt?: string;
  paymentMethod?: PaymentMethod;
  rejectionReason?: string;
  [key: string]: unknown;
}

type SortKey = "NEWEST" | "OLDEST" | "HIGH_AMOUNT" | "LOW_AMOUNT";

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (value: number = 0) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (date?: string) => {
  if (!date) return "Unknown date";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date?: string) => {
  if (!date) return "Unknown";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getAmount = (request: WithdrawalRequest) =>
  Number(request.amount || 0);

const getPaymentType = (request: WithdrawalRequest) =>
  request.paymentMethod?.type?.toLowerCase() === "upi" ? "UPI" : "BANK";

const maskAccountNumber = (value?: string) => {
  if (!value) return "N/A";

  const clean = String(value);

  if (clean.length <= 4) {
    return clean;
  }

  return `${"•".repeat(Math.max(0, clean.length - 4))}${clean.slice(-4)}`;
};

const maskUPI = (value?: string) => {
  if (!value) return "N/A";

  const [name, domain] = value.split("@");

  if (!domain || name.length <= 2) {
    return value;
  }

  return `${name.slice(0, 2)}•••@${domain}`;
};

const getRequestAge = (createdAt?: string) => {
  if (!createdAt) return "";

  const timestamp = new Date(createdAt).getTime();

  if (Number.isNaN(timestamp)) return "";

  const diff = Date.now() - timestamp;

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  return `${days}d ago`;
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "APPROVED":
      return {
        label: "Approved",
        icon: CheckCircle,
        className:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
      };

    case "REJECTED":
      return {
        label: "Rejected",
        icon: XCircle,
        className: "border-red-500/20 bg-red-500/10 text-red-400",
      };

    default:
      return {
        label: "Pending",
        icon: Clock,
        className: "border-orange-500/20 bg-orange-500/10 text-orange-400",
      };
  }
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function WithdrawalTab() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] =
    useState<WithdrawalStatus>("PENDING");

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("NEWEST");

  const [autoRefresh, setAutoRefresh] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(
    null
  );

  const [selectedRequest, setSelectedRequest] =
    useState<WithdrawalRequest | null>(null);

  const [confirmationRequest, setConfirmationRequest] =
    useState<WithdrawalRequest | null>(null);

  const [confirmationAction, setConfirmationAction] = useState<
    "APPROVED" | "REJECTED" | null
  >(null);

  const [rejectionReason, setRejectionReason] = useState("");

  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  /* =======================================================
     TOAST
  ======================================================= */

  const notify = useCallback(
    (
      message: string,
      type: ToastState["type"] = "success"
    ) => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }

      setToast({
        message,
        type,
      });

      toastTimer.current = setTimeout(() => {
        setToast(null);
      }, 3500);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  /* =======================================================
     FETCH
  ======================================================= */

  const fetchRequests = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await fetch("/api/withdrawals", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const data: unknown = await response.json();

        if (
          typeof data !== "object" ||
          data === null ||
          !("success" in data)
        ) {
          throw new Error("Invalid API response");
        }

        const apiData = data as {
          success?: boolean;
          data?: unknown;
          error?: string;
        };

        if (!apiData.success) {
          throw new Error(
            apiData.error || "Failed to load withdrawal requests"
          );
        }

        const incoming = Array.isArray(apiData.data)
          ? apiData.data
          : [];

        setRequests(incoming as WithdrawalRequest[]);
      } catch (error) {
        console.error("Withdrawal fetch error:", error);

        notify(
          error instanceof Error
            ? error.message
            : "Unable to load withdrawal requests",
          "error"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [notify]
  );

  useEffect(() => {
    void fetchRequests(false);
  }, [fetchRequests]);

  /* =======================================================
     AUTO REFRESH
  ======================================================= */

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const interval = window.setInterval(() => {
      void fetchRequests(true);
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [autoRefresh, fetchRequests]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics = useMemo(() => {
    const pending = requests.filter(
      (item) => item.status === "PENDING"
    );

    const approved = requests.filter(
      (item) => item.status === "APPROVED"
    );

    const rejected = requests.filter(
      (item) => item.status === "REJECTED"
    );

    return {
      total: requests.length,

      pendingCount: pending.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,

      pendingAmount: pending.reduce(
        (sum, item) => sum + getAmount(item),
        0
      ),

      approvedAmount: approved.reduce(
        (sum, item) => sum + getAmount(item),
        0
      ),

      rejectedAmount: rejected.reduce(
        (sum, item) => sum + getAmount(item),
        0
      ),

      totalAmount: requests.reduce(
        (sum, item) => sum + getAmount(item),
        0
      ),
    };
  }, [requests]);

  /* =======================================================
     FILTER + SEARCH + SORT
  ======================================================= */

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = requests.filter((request) => {
      if (request.status !== activeTab) {
        return false;
      }

      if (!query) {
        return true;
      }

      const details = request.paymentMethod?.details;

      const searchableText = [
        request.userEmail,
        request.userId,
        request._id,
        details?.upiId,
        details?.accountName,
        details?.accountNumber,
        details?.ifsc,
        details?.bankName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "OLDEST":
          return (
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
          );

        case "HIGH_AMOUNT":
          return getAmount(b) - getAmount(a);

        case "LOW_AMOUNT":
          return getAmount(a) - getAmount(b);

        case "NEWEST":
        default:
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
      }
    });
  }, [requests, activeTab, search, sort]);

  /* =======================================================
     COPY
  ======================================================= */

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);

      setCopiedValue(value);

      notify(`${label} copied to clipboard`, "success");

      window.setTimeout(() => {
        setCopiedValue(null);
      }, 1500);
    } catch {
      notify(`Unable to copy ${label}`, "error");
    }
  };

  /* =======================================================
     OPEN CONFIRMATION
  ======================================================= */

  const openConfirmation = (
    request: WithdrawalRequest,
    action: "APPROVED" | "REJECTED"
  ) => {
    setConfirmationRequest(request);
    setConfirmationAction(action);
    setRejectionReason("");
  };

  /* =======================================================
     UPDATE STATUS
  ======================================================= */

  const handleUpdateStatus = async (
    id: string,
    newStatus: "APPROVED" | "REJECTED",
    reason?: string
  ) => {
    if (actionLoading) return;

    setActionLoading(id);

    try {
      const response = await fetch("/api/withdrawals", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: id,
          status: newStatus,
          ...(reason?.trim()
            ? {
                rejectionReason: reason.trim(),
              }
            : {}),
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof data.error === "string"
            ? data.error
            : "Failed to update withdrawal"
        );
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("success" in data) ||
        !(data as { success?: boolean }).success
      ) {
        throw new Error(
          typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof data.error === "string"
            ? data.error
            : "Failed to update withdrawal"
        );
      }

      setRequests((previous) =>
        previous.map((request) =>
          request._id === id
            ? {
                ...request,
                status: newStatus,
                rejectionReason:
                  newStatus === "REJECTED"
                    ? reason?.trim() || request.rejectionReason
                    : request.rejectionReason,
                updatedAt: new Date().toISOString(),
              }
            : request
        )
      );

      setConfirmationRequest(null);
      setConfirmationAction(null);
      setRejectionReason("");

      if (newStatus === "APPROVED") {
        const approvedReq = requests.find((r) => r._id === id);
        const amountStr = approvedReq ? formatCurrency(getAmount(approvedReq)) : "";
        notify(
          `${amountStr} withdrawal approved successfully.`,
          "success"
        );
      } else {
        notify("Withdrawal request rejected.", "info");
      }
    } catch (error) {
      console.error("Withdrawal update error:", error);

      notify(
        error instanceof Error
          ? error.message
          : "Network error while updating withdrawal",
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const confirmAction = async () => {
    if (!confirmationRequest || !confirmationAction) {
      return;
    }

    if (
      confirmationAction === "REJECTED" &&
      !rejectionReason.trim()
    ) {
      notify("Please enter a rejection reason.", "error");
      return;
    }

    await handleUpdateStatus(
      confirmationRequest._id,
      confirmationAction,
      rejectionReason
    );
  };

  /* =======================================================
     TAB COUNTS
  ======================================================= */

  const tabConfig: Array<{
    key: WithdrawalStatus;
    label: string;
    count: number;
    amount: number;
  }> = [
    {
      key: "PENDING",
      label: "Pending",
      count: statistics.pendingCount,
      amount: statistics.pendingAmount,
    },
    {
      key: "APPROVED",
      label: "Approved",
      count: statistics.approvedCount,
      amount: statistics.approvedAmount,
    },
    {
      key: "REJECTED",
      label: "Rejected",
      count: statistics.rejectedCount,
      amount: statistics.rejectedAmount,
    },
  ];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full space-y-7 pb-24 text-white"
    >
      {/* ===================================================
          TOAST
      =================================================== */}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{
              opacity: 0,
              y: -30,
              x: "-50%",
            }}
            animate={{
              opacity: 1,
              y: 0,
              x: "-50%",
            }}
            exit={{
              opacity: 0,
              y: -30,
              x: "-50%",
            }}
            className={`
              fixed
              left-1/2
              top-6
              z-[300]
              flex
              max-w-[calc(100vw-32px)]
              items-center
              gap-3
              rounded-2xl
              border
              px-5
              py-4
              shadow-2xl
              backdrop-blur-xl
              ${
                toast.type === "success"
                  ? "border-emerald-500/20 bg-[#101714]/95"
                  : toast.type === "error"
                    ? "border-red-500/20 bg-[#170e0e]/95"
                    : "border-[#D4AF37]/20 bg-[#141414]/95"
              }
            `}
          >
            {toast.type === "success" ? (
              <CheckCircle
                size={18}
                className="shrink-0 text-emerald-400"
              />
            ) : toast.type === "error" ? (
              <AlertTriangle
                size={18}
                className="shrink-0 text-red-400"
              />
            ) : (
              <ShieldCheck
                size={18}
                className="shrink-0 text-[#D4AF37]"
              />
            )}

            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
              {toast.message}
            </span>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 text-gray-500 transition hover:text-white"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================
          HERO
      =================================================== */}

      <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#161616] via-[#0d0d0d] to-black p-6 shadow-2xl md:p-8">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#D4AF37]/10 blur-[100px]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                <Landmark size={11} />
                Treasury Control
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live
              </span>
            </div>

            <h2 className="font-serif text-2xl font-bold tracking-tight text-white md:text-3xl">
              Financial Logistics
            </h2>

            <p className="mt-2 max-w-2xl text-xs leading-6 text-gray-400">
              Review reward withdrawals, verify payout details and control
              treasury outflows from one secure command center.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/50 px-5 py-3">
              <p className="text-[7px] font-black uppercase tracking-widest text-gray-500">
                Total Requested
              </p>

              <p className="mt-1 font-mono text-lg text-[#D4AF37]">
                {formatCurrency(statistics.totalAmount)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchRequests(true)}
              disabled={refreshing}
              className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-[8px] font-black uppercase tracking-widest text-gray-400 transition hover:border-[#D4AF37]/30 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================
          KPI GRID
      =================================================== */}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TreasuryStat
          icon={<WalletCards size={18} />}
          label="Pending"
          value={statistics.pendingCount.toLocaleString("en-IN")}
          amount={formatCurrency(statistics.pendingAmount)}
          tone="orange"
        />

        <TreasuryStat
          icon={<CheckCircle size={18} />}
          label="Approved"
          value={statistics.approvedCount.toLocaleString("en-IN")}
          amount={formatCurrency(statistics.approvedAmount)}
          tone="green"
        />

        <TreasuryStat
          icon={<XCircle size={18} />}
          label="Rejected"
          value={statistics.rejectedCount.toLocaleString("en-IN")}
          amount={formatCurrency(statistics.rejectedAmount)}
          tone="red"
        />

        <TreasuryStat
          icon={<CircleDollarSign size={18} />}
          label="Total Requests"
          value={statistics.total.toLocaleString("en-IN")}
          amount={formatCurrency(statistics.totalAmount)}
          tone="gold"
        />
      </section>

      {/* ===================================================
          TABS + SEARCH
      =================================================== */}

      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0b0b]">
        <div className="border-b border-white/10 p-4 md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            {/* Tabs */}
            <div className="flex w-full overflow-x-auto rounded-2xl border border-white/10 bg-black p-1.5 xl:w-auto">
              {tabConfig.map((tab) => {
                const active = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`
                      flex
                      min-w-[130px]
                      flex-1
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      px-4
                      py-3
                      text-[8px]
                      font-black
                      uppercase
                      tracking-widest
                      transition-all
                      ${
                        active
                          ? "bg-[#D4AF37] text-black shadow-lg"
                          : "text-gray-500 hover:bg-white/5 hover:text-white"
                      }
                    `}
                  >
                    {tab.label}

                    <span
                      className={`
                        rounded-full
                        px-2
                        py-1
                        text-[7px]
                        ${
                          active
                            ? "bg-black/10"
                            : "bg-white/5"
                        }
                      `}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Auto refresh */}
            <button
              type="button"
              onClick={() => setAutoRefresh((value) => !value)}
              className={`
                flex
                min-h-[42px]
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                px-4
                text-[8px]
                font-black
                uppercase
                tracking-widest
                transition
                ${
                  autoRefresh
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 bg-white/[0.02] text-gray-500 hover:text-white"
                }
              `}
            >
              <RefreshCw
                size={13}
                className={autoRefresh ? "animate-spin" : ""}
              />

              Auto Refresh {autoRefresh ? "ON" : "OFF"}
            </button>
          </div>

          {/* Search + Sort */}
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search email, user ID, UPI, account, IFSC..."
                className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-black pl-11 pr-11 text-xs text-white outline-none transition placeholder:text-gray-600 focus:border-[#D4AF37]/40"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative md:w-[210px]">
              <ArrowUpDown
                size={14}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as SortKey)
                }
                className="min-h-[48px] w-full appearance-none rounded-2xl border border-white/10 bg-black pl-10 pr-8 text-[9px] font-bold uppercase tracking-widest text-gray-300 outline-none focus:border-[#D4AF37]/40"
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="HIGH_AMOUNT">
                  Highest Amount
                </option>
                <option value="LOW_AMOUNT">
                  Lowest Amount
                </option>
              </select>

              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* =================================================
            REQUESTS
        ================================================= */}

        <div className="p-4 md:p-5">
          {loading ? (
            <WithdrawalSkeleton />
          ) : filteredRequests.length === 0 ? (
            <EmptyWithdrawalState
              activeTab={activeTab}
              hasSearch={Boolean(search)}
              clearSearch={() => setSearch("")}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
              {filteredRequests.map((request, index) => (
                <WithdrawalCard
                  key={request._id}
                  request={request}
                  index={index}
                  actionLoading={actionLoading}
                  copiedValue={copiedValue}
                  onPreview={() => setSelectedRequest(request)}
                  onCopy={copyText}
                  onApprove={() =>
                    openConfirmation(request, "APPROVED")
                  }
                  onReject={() =>
                    openConfirmation(request, "REJECTED")
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===================================================
          DETAILS MODAL
      =================================================== */}

      <AnimatePresence>
        {selectedRequest && (
          <WithdrawalDetailsModal
            request={selectedRequest}
            copiedValue={copiedValue}
            onCopy={copyText}
            onClose={() => setSelectedRequest(null)}
          />
        )}
      </AnimatePresence>

      {/* ===================================================
          CONFIRMATION MODAL
      =================================================== */}

      <AnimatePresence>
        {confirmationRequest && confirmationAction && (
          <ConfirmationModal
            request={confirmationRequest}
            action={confirmationAction}
            loading={
              actionLoading === confirmationRequest._id
            }
            rejectionReason={rejectionReason}
            setRejectionReason={setRejectionReason}
            onConfirm={() => void confirmAction()}
            onClose={() => {
              if (actionLoading) return;

              setConfirmationRequest(null);
              setConfirmationAction(null);
              setRejectionReason("");
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function TreasuryStat({
  icon,
  label,
  value,
  amount,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  amount: string;
  tone: "gold" | "green" | "red" | "orange";
}) {
  const styles = {
    gold: {
      icon: "bg-[#D4AF37]/10 text-[#D4AF37]",
      value: "text-[#D4AF37]",
    },
    green: {
      icon: "bg-emerald-500/10 text-emerald-400",
      value: "text-emerald-400",
    },
    red: {
      icon: "bg-red-500/10 text-red-400",
      value: "text-red-400",
    },
    orange: {
      icon: "bg-orange-500/10 text-orange-400",
      value: "text-orange-400",
    },
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#0d0d0d] p-5"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[tone].icon}`}
      >
        {icon}
      </div>

      <p className="mt-5 text-[8px] font-black uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>

      <p
        className={`mt-1 font-mono text-2xl font-bold ${styles[tone].value}`}
      >
        {value}
      </p>

      <p className="mt-1 truncate text-[8px] text-gray-500">
        {amount}
      </p>
    </motion.div>
  );
}

/* =========================================================
   WITHDRAWAL CARD
========================================================= */

function WithdrawalCard({
  request,
  index,
  actionLoading,
  copiedValue,
  onPreview,
  onCopy,
  onApprove,
  onReject,
}: {
  request: WithdrawalRequest;
  index: number;
  actionLoading: string | null;
  copiedValue: string | null;
  onPreview: () => void;
  onCopy: (value: string, label: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const amount = getAmount(request);
  const paymentType = getPaymentType(request);
  const details = request.paymentMethod?.details;

  const status = getStatusConfig(request.status);
  const StatusIcon = status.icon;

  const isActionLoading = actionLoading === request._id;

  const sensitiveValue =
    paymentType === "UPI"
      ? details?.upiId
      : details?.accountNumber;

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: Math.min(index * 0.04, 0.25),
      }}
      whileHover={{
        y: -3,
      }}
      className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-[#111] transition-all duration-300 hover:border-[#D4AF37]/30 hover:shadow-[0_20px_70px_rgba(0,0,0,0.35)]"
    >
      {/* Top Glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[#D4AF37]/5 blur-3xl transition group-hover:bg-[#D4AF37]/10" />

      <div className="relative p-5 md:p-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-gray-500">
                <CalendarDays size={11} />
                {formatDate(request.createdAt)}
              </span>

              {getRequestAge(request.createdAt) && (
                <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[7px] font-bold text-gray-500">
                  <Timer size={9} />
                  {getRequestAge(request.createdAt)}
                </span>
              )}

              <span
                className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[7px] font-black uppercase tracking-widest ${status.className}`}
              >
                <StatusIcon size={9} />
                {status.label}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-gray-400">
                <User size={15} />
              </div>

              <div className="min-w-0">
                <h4 className="truncate text-sm font-bold text-white">
                  {request.userEmail || "Unknown User"}
                </h4>

                <p className="truncate font-mono text-[8px] text-gray-600">
                  User: {request.userId || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-[7px] font-black uppercase tracking-widest text-gray-500">
              Requested
            </p>

            <h3 className="mt-1 font-serif text-2xl font-black italic text-[#D4AF37]">
              {formatCurrency(amount)}
            </h3>
          </div>
        </div>

        {/* PAYMENT DETAILS */}
        <div className="mt-5 rounded-2xl border border-white/5 bg-black/50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                {paymentType === "UPI" ? (
                  <Smartphone size={16} />
                ) : (
                  <Landmark size={16} />
                )}
              </div>

              <div>
                <p className="text-[7px] font-black uppercase tracking-widest text-gray-500">
                  Payout Method
                </p>

                <p className="mt-1 text-xs font-black uppercase tracking-widest text-white">
                  {paymentType === "UPI"
                    ? "UPI Transfer"
                    : "Bank Transfer"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onPreview}
              className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[7px] font-black uppercase tracking-widest text-gray-400 transition hover:bg-white hover:text-black"
            >
              <Eye size={12} />
              Details
            </button>
          </div>

          {paymentType === "UPI" ? (
            <PaymentField
              label="UPI ID"
              value={maskUPI(details?.upiId)}
              rawValue={details?.upiId}
              copiedValue={copiedValue}
              onCopy={onCopy}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <PaymentField
                label="Account Name"
                value={details?.accountName || "N/A"}
                rawValue={details?.accountName}
                copiedValue={copiedValue}
                onCopy={onCopy}
              />

              <PaymentField
                label="Bank"
                value={details?.bankName || "N/A"}
                rawValue={details?.bankName}
                copiedValue={copiedValue}
                onCopy={onCopy}
              />

              <PaymentField
                label="Account Number"
                value={maskAccountNumber(details?.accountNumber)}
                rawValue={details?.accountNumber}
                copiedValue={copiedValue}
                onCopy={onCopy}
              />

              <PaymentField
                label="IFSC"
                value={details?.ifsc || "N/A"}
                rawValue={details?.ifsc}
                copiedValue={copiedValue}
                onCopy={onCopy}
              />
            </div>
          )}
        </div>

        {/* FOOTER */}
        {request.status === "PENDING" ? (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onReject}
              disabled={Boolean(actionLoading)}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 text-[8px] font-black uppercase tracking-widest text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XCircle size={14} />
              Reject
            </button>

            <button
              type="button"
              onClick={onApprove}
              disabled={Boolean(actionLoading)}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#D4AF37] text-[8px] font-black uppercase tracking-widest text-black shadow-lg shadow-[#D4AF37]/10 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isActionLoading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <CheckCircle size={14} />
              )}

              Approve & Pay
            </button>
          </div>
        ) : (
          <div
            className={`mt-5 flex min-h-[46px] items-center justify-center gap-2 rounded-xl border text-[8px] font-black uppercase tracking-widest ${status.className}`}
          >
            <StatusIcon size={14} />
            Request {status.label}
          </div>
        )}
      </div>
    </motion.article>
  );
}

/* =========================================================
   PAYMENT FIELD
========================================================= */

function PaymentField({
  label,
  value,
  rawValue,
  copiedValue,
  onCopy,
}: {
  label: string;
  value: string;
  rawValue?: string;
  copiedValue: string | null;
  onCopy: (value: string, label: string) => void;
}) {
  const canCopy = Boolean(rawValue);

  return (
    <div>
      <p className="mb-1.5 text-[7px] font-black uppercase tracking-widest text-gray-500">
        {label}
      </p>

      <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#141414] px-3 py-3">
        <p className="min-w-0 truncate font-mono text-[10px] text-white">
          {value}
        </p>

        {canCopy && rawValue && (
          <button
            type="button"
            onClick={() => onCopy(rawValue, label)}
            className="shrink-0 rounded-lg p-1.5 text-gray-500 transition hover:bg-white/10 hover:text-white"
            title={`Copy ${label}`}
          >
            {copiedValue === rawValue ? (
              <Check size={12} className="text-emerald-400" />
            ) : (
              <Copy size={12} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   DETAILS MODAL
========================================================= */

function WithdrawalDetailsModal({
  request,
  copiedValue,
  onCopy,
  onClose,
}: {
  request: WithdrawalRequest;
  copiedValue: string | null;
  onCopy: (value: string, label: string) => void;
  onClose: () => void;
}) {
  const details = request.paymentMethod?.details;
  const paymentType = getPaymentType(request);
  const status = getStatusConfig(request.status);
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl"
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.96,
          y: 15,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.96,
          y: 15,
        }}
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-white/10 bg-[#0b0b0b] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 p-6 md:p-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5 text-[7px] font-black uppercase tracking-widest text-[#D4AF37]">
                Withdrawal Details
              </span>

              <span
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[7px] font-black uppercase tracking-widest ${status.className}`}
              >
                <StatusIcon size={9} />
                {status.label}
              </span>
            </div>

            <h2 className="mt-4 text-xl font-bold text-white">
              {request.userEmail || "Unknown User"}
            </h2>

            <p className="mt-1 font-mono text-[8px] text-gray-500">
              Request ID: {request._id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-gray-400 transition hover:bg-white hover:text-black"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5 p-6 md:p-7">
          {/* Amount */}
          <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-5">
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">
              Withdrawal Amount
            </p>

            <p className="mt-2 font-serif text-4xl font-black italic text-[#D4AF37]">
              {formatCurrency(getAmount(request))}
            </p>

            <div className="mt-3 flex flex-wrap gap-4 text-[8px] text-gray-500">
              <span>
                Created: {formatDateTime(request.createdAt)}
              </span>

              {request.updatedAt && (
                <span>
                  Updated: {formatDateTime(request.updatedAt)}
                </span>
              )}
            </div>
          </div>

          {/* User */}
          <DetailSection
            title="User Identity"
            icon={<User size={15} />}
          >
            <DetailRow
              label="Email"
              value={request.userEmail || "N/A"}
              copyValue={request.userEmail}
              copiedValue={copiedValue}
              onCopy={onCopy}
            />

            <DetailRow
              label="User ID"
              value={request.userId || "N/A"}
              copyValue={request.userId}
              copiedValue={copiedValue}
              onCopy={onCopy}
            />
          </DetailSection>

          {/* Payment */}
          <DetailSection
            title={
              paymentType === "UPI"
                ? "UPI Settlement"
                : "Bank Settlement"
            }
            icon={
              paymentType === "UPI" ? (
                <Smartphone size={15} />
              ) : (
                <Landmark size={15} />
              )
            }
          >
            {paymentType === "UPI" ? (
              <DetailRow
                label="UPI ID"
                value={details?.upiId || "N/A"}
                copyValue={details?.upiId}
                copiedValue={copiedValue}
                onCopy={onCopy}
              />
            ) : (
              <>
                <DetailRow
                  label="Account Name"
                  value={details?.accountName || "N/A"}
                  copyValue={details?.accountName}
                  copiedValue={copiedValue}
                  onCopy={onCopy}
                />

                <DetailRow
                  label="Account Number"
                  value={details?.accountNumber || "N/A"}
                  copyValue={details?.accountNumber}
                  copiedValue={copiedValue}
                  onCopy={onCopy}
                />

                <DetailRow
                  label="IFSC"
                  value={details?.ifsc || "N/A"}
                  copyValue={details?.ifsc}
                  copiedValue={copiedValue}
                  onCopy={onCopy}
                />

                <DetailRow
                  label="Bank"
                  value={details?.bankName || "N/A"}
                  copyValue={details?.bankName}
                  copiedValue={copiedValue}
                  onCopy={onCopy}
                />

                <DetailRow
                  label="Branch"
                  value={details?.branch || "N/A"}
                  copyValue={details?.branch}
                  copiedValue={copiedValue}
                  onCopy={onCopy}
                />
              </>
            )}
          </DetailSection>

          {/* Rejection */}
          {request.rejectionReason && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <div className="flex items-center gap-2 text-red-400">
                <FileText size={15} />

                <p className="text-[8px] font-black uppercase tracking-widest">
                  Rejection Reason
                </p>
              </div>

              <p className="mt-3 text-xs leading-6 text-gray-300">
                {request.rejectionReason}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   DETAIL SECTION
========================================================= */

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
      <div className="mb-4 flex items-center gap-2 text-[#D4AF37]">
        {icon}

        <h3 className="text-[8px] font-black uppercase tracking-widest">
          {title}
        </h3>
      </div>

      <div className="space-y-2">{children}</div>
    </section>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  label,
  value,
  copyValue,
  copiedValue,
  onCopy,
}: {
  label: string;
  value: string;
  copyValue?: string;
  copiedValue: string | null;
  onCopy: (value: string, label: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-[#111] p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[7px] font-black uppercase tracking-widest text-gray-600">
          {label}
        </p>

        <p className="mt-1 break-all font-mono text-[10px] text-white">
          {value}
        </p>
      </div>

      {copyValue && (
        <button
          type="button"
          onClick={() => onCopy(copyValue, label)}
          className="flex shrink-0 items-center gap-2 self-end rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[7px] font-black uppercase tracking-widest text-gray-400 transition hover:bg-white hover:text-black sm:self-auto"
        >
          {copiedValue === copyValue ? (
            <>
              <Check size={11} />
              Copied
            </>
          ) : (
            <>
              <Copy size={11} />
              Copy
            </>
          )}
        </button>
      )}
    </div>
  );
}

/* =========================================================
   CONFIRMATION MODAL
========================================================= */

function ConfirmationModal({
  request,
  action,
  loading,
  rejectionReason,
  setRejectionReason,
  onConfirm,
  onClose,
}: {
  request: WithdrawalRequest;
  action: "APPROVED" | "REJECTED";
  loading: boolean;
  rejectionReason: string;
  setRejectionReason: React.Dispatch<React.SetStateAction<string>>;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const isApprove = action === "APPROVED";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl"
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.96,
          y: 15,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.96,
          y: 15,
        }}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#0c0c0c] p-6 shadow-2xl md:p-7"
      >
        <div className="flex items-start gap-4">
          <div
            className={`
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-2xl
              ${
                isApprove
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }
            `}
          >
            {isApprove ? (
              <ShieldCheck size={22} />
            ) : (
              <ShieldAlert size={22} />
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              {isApprove
                ? "Approve Withdrawal?"
                : "Reject Withdrawal?"}
            </h2>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              {isApprove
                ? "This will approve the withdrawal request and trigger the configured payout workflow."
                : "Please provide a reason so the rejection can be audited later."}
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-black p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[7px] font-black uppercase tracking-widest text-gray-500">
                User
              </p>

              <p className="mt-1 max-w-[250px] truncate text-xs font-bold text-white">
                {request.userEmail || "Unknown User"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[7px] font-black uppercase tracking-widest text-gray-500">
                Amount
              </p>

              <p
                className={`mt-1 font-serif text-xl font-black italic ${
                  isApprove
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {formatCurrency(getAmount(request))}
              </p>
            </div>
          </div>
        </div>

        {/* Rejection Reason */}
        {!isApprove && (
          <div className="mt-5">
            <label className="mb-2 block text-[8px] font-black uppercase tracking-widest text-gray-400">
              Rejection Reason
            </label>

            <textarea
              value={rejectionReason}
              onChange={(event) =>
                setRejectionReason(event.target.value)
              }
              rows={4}
              maxLength={500}
              placeholder="Example: Payment details could not be verified."
              className="w-full resize-none rounded-2xl border border-white/10 bg-black p-4 text-xs leading-6 text-white outline-none placeholder:text-gray-600 focus:border-red-500/40"
            />

            <p className="mt-1 text-right text-[7px] text-gray-600">
              {rejectionReason.length}/500
            </p>
          </div>
        )}

        {/* Warning */}
        {isApprove && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
            <AlertTriangle
              size={16}
              className="mt-0.5 shrink-0 text-orange-400"
            />

            <p className="text-[9px] leading-5 text-orange-200/70">
              Verify the payout details before approving. The
              actual wallet deduction and payment behavior is
              controlled by your backend API.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="min-h-[48px] rounded-xl border border-white/10 bg-white/[0.03] text-[8px] font-black uppercase tracking-widest text-gray-400 transition hover:bg-white hover:text-black disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={
              loading ||
              (!isApprove && !rejectionReason.trim())
            }
            className={`
              flex
              min-h-[48px]
              items-center
              justify-center
              gap-2
              rounded-xl
              text-[8px]
              font-black
              uppercase
              tracking-widest
              transition
              disabled:cursor-not-allowed
              disabled:opacity-50
              ${
                isApprove
                  ? "bg-emerald-500 text-black hover:bg-white"
                  : "bg-red-500 text-white hover:bg-white hover:text-black"
              }
            `}
          >
            {loading && (
              <RefreshCw size={14} className="animate-spin" />
            )}

            {isApprove ? "Confirm & Pay" : "Confirm Reject"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   LOADING SKELETON
========================================================= */

function WithdrawalSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[26px] border border-white/10 bg-[#111] p-6"
        >
          <div className="flex justify-between gap-5">
            <div className="space-y-3">
              <div className="h-3 w-24 rounded bg-white/10" />
              <div className="h-5 w-48 rounded bg-white/10" />
              <div className="h-2 w-32 rounded bg-white/5" />
            </div>

            <div className="h-8 w-28 rounded bg-white/10" />
          </div>

          <div className="mt-6 rounded-2xl bg-black p-5">
            <div className="h-4 w-32 rounded bg-white/10" />

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="h-12 rounded-xl bg-white/5" />
              <div className="h-12 rounded-xl bg-white/5" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="h-12 rounded-xl bg-white/5" />
            <div className="h-12 rounded-xl bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyWithdrawalState({
  activeTab,
  hasSearch,
  clearSearch,
}: {
  activeTab: WithdrawalStatus;
  hasSearch: boolean;
  clearSearch: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] text-gray-600">
        {hasSearch ? (
          <Search size={28} />
        ) : activeTab === "PENDING" ? (
          <Clock size={28} />
        ) : (
          <Banknote size={28} />
        )}
      </div>

      <h4 className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-gray-400">
        No {activeTab.toLowerCase()} requests
      </h4>

      <p className="mx-auto mt-2 max-w-sm text-[9px] leading-5 text-gray-600">
        {hasSearch
          ? "No withdrawal matches your current search."
          : `There are currently no ${activeTab.toLowerCase()} withdrawal requests.`}
      </p>

      {hasSearch && (
        <button
          type="button"
          onClick={clearSearch}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-5 py-3 text-[8px] font-black uppercase tracking-widest text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black"
        >
          <RotateCcw size={12} />
          Clear Search
        </button>
      )}
    </div>
  );
}