"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Fingerprint,
    AlertTriangle,
    ShieldCheck,
    ShieldAlert,
    Lock,
    Unlock,
    RefreshCcw,
    Database,
    Server,
    KeyRound,
    Activity,
    Eye,
    CheckCircle2,
    XCircle,
    Clock3,
    Terminal,
    Zap,
    Globe,
    UserCheck,
    X,
} from "lucide-react";

type SecurityStatus =
    | "secure"
    | "warning"
    | "critical"
    | "locked";

interface SecurityService {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    status: "operational" | "warning" | "offline";
    latency?: string;
}

interface SecurityEvent {
    id: number;
    type: "success" | "warning" | "critical";
    message: string;
    time: string;
}

export default function Security() {
    const [status, setStatus] =
        useState<SecurityStatus>("secure");

    const [showLockdown, setShowLockdown] =
        useState(false);

    const [isScanning, setIsScanning] =
        useState(false);

    const [lastScan, setLastScan] =
        useState("Just now");

    const [scanProgress, setScanProgress] =
        useState(100);

    const [events, setEvents] =
        useState<SecurityEvent[]>([
            {
                id: 1,
                type: "success",
                message: "Authentication gateway verified",
                time: "2 min ago",
            },
            {
                id: 2,
                type: "success",
                message: "Database integrity check passed",
                time: "8 min ago",
            },
            {
                id: 3,
                type: "warning",
                message: "3 inactive admin sessions detected",
                time: "14 min ago",
            },
            {
                id: 4,
                type: "success",
                message: "Firewall rules synchronized",
                time: "21 min ago",
            },
        ]);

    const services: SecurityService[] = [
        {
            id: "firewall",
            name: "Firewall",
            description: "Inbound traffic protection",
            icon: <ShieldCheck size={18} />,
            status: "operational",
            latency: "12ms",
        },
        {
            id: "database",
            name: "Database",
            description: "Data integrity & encryption",
            icon: <Database size={18} />,
            status: "operational",
            latency: "18ms",
        },
        {
            id: "authentication",
            name: "Authentication",
            description: "Identity & access control",
            icon: <KeyRound size={18} />,
            status: "operational",
            latency: "9ms",
        },
        {
            id: "api",
            name: "API Gateway",
            description: "External API protection",
            icon: <Globe size={18} />,
            status: "operational",
            latency: "24ms",
        },
    ];

    const securityScore = useMemo(() => {
        if (status === "locked") return 100;
        if (status === "critical") return 38;
        if (status === "warning") return 76;
        return 98;
    }, [status]);

    /**
     * Simulated security scan.
     *
     * Replace this function later with:
     * GET /api/admin/security/scan
     */
    const runSecurityScan = async () => {
        if (isScanning || status === "locked") return;

        setIsScanning(true);
        setScanProgress(0);

        for (let progress = 0; progress <= 100; progress += 10) {
            await new Promise((resolve) =>
                setTimeout(resolve, 80)
            );

            setScanProgress(progress);
        }

        setIsScanning(false);
        setLastScan("Just now");

        setEvents((previous) => [
            {
                id: Date.now(),
                type: "success",
                message: "Full security scan completed successfully",
                time: "Just now",
            },
            ...previous,
        ]);
    };

    /**
     * Lockdown.
     *
     * Later connect this to:
     * POST /api/admin/security/lockdown
     */
    const initiateLockdown = () => {
        setStatus("locked");
        setShowLockdown(false);

        setEvents((previous) => [
            {
                id: Date.now(),
                type: "critical",
                message: "SYSTEM LOCKDOWN manually initiated",
                time: "Just now",
            },
            ...previous,
        ]);
    };

    /**
     * Unlock system.
     */
    const releaseLockdown = () => {
        setStatus("secure");

        setEvents((previous) => [
            {
                id: Date.now(),
                type: "warning",
                message: "System lockdown manually released",
                time: "Just now",
            },
            ...previous,
        ]);
    };

    /**
     * Update page scan time.
     */
    useEffect(() => {
        if (status === "locked") return;

        const interval = setInterval(() => {
            setLastScan((previous) =>
                previous === "Just now"
                    ? "A few seconds ago"
                    : previous
            );
        }, 5000);

        return () => clearInterval(interval);
    }, [status]);

    const isLocked = status === "locked";

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10"
        >
            {/* ------------------------------------------------------------- */}
            {/* Header                                                         */}
            {/* ------------------------------------------------------------- */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <ShieldCheck
                                size={20}
                                className="text-red-400"
                            />
                        </div>

                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-white">
                                Security Center
                            </h1>

                            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-1">
                                System Integrity & Threat Monitoring
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest w-fit ${
                        isLocked
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-green-500/10 border-green-500/20 text-green-400"
                    }`}
                >
                    <span
                        className={`w-2 h-2 rounded-full ${
                            isLocked
                                ? "bg-red-500"
                                : "bg-green-400 animate-pulse"
                        }`}
                    />

                    {isLocked
                        ? "System Locked"
                        : "All Systems Operational"}
                </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Main Security Hero                                              */}
            {/* ------------------------------------------------------------- */}

            <div
                className={`relative overflow-hidden rounded-[28px] border p-6 md:p-10 mb-6 ${
                    isLocked
                        ? "border-red-500/40 bg-red-950/20"
                        : "border-white/10 bg-[#0b0b0b]"
                }`}
            >
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_-20%,rgba(239,68,68,0.16),transparent_50%)]" />

                <div className="relative grid lg:grid-cols-[1fr_260px] gap-8 items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-5">
                            <div
                                className={`p-3 rounded-2xl ${
                                    isLocked
                                        ? "bg-red-500/15"
                                        : "bg-green-500/10"
                                }`}
                            >
                                {isLocked ? (
                                    <Lock
                                        size={30}
                                        className="text-red-500"
                                    />
                                ) : (
                                    <Fingerprint
                                        size={30}
                                        className="text-green-400"
                                    />
                                )}
                            </div>

                            <div>
                                <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 font-bold">
                                    System Integrity
                                </p>

                                <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
                                    {isLocked
                                        ? "Emergency Lockdown Active"
                                        : "System Secure"}
                                </h2>
                            </div>
                        </div>

                        <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
                            {isLocked
                                ? "All protected administrative operations should be considered restricted until the lockdown is released."
                                : "Your security perimeter is currently operational. Authentication, database, firewall and API protection layers are responding normally."}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 mt-7">
                            {!isLocked ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowLockdown(true)
                                    }
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_35px_rgba(239,68,68,0.2)] transition-all hover:-translate-y-0.5"
                                >
                                    <AlertTriangle size={15} />
                                    Initiate Lockdown
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={releaseLockdown}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white text-black hover:bg-gray-200 text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    <Unlock size={15} />
                                    Release Lockdown
                                </button>
                            )}

                            <button
                                type="button"
                                disabled={
                                    isScanning || isLocked
                                }
                                onClick={runSecurityScan}
                                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
                            >
                                <RefreshCcw
                                    size={15}
                                    className={
                                        isScanning
                                            ? "animate-spin"
                                            : ""
                                    }
                                />

                                {isScanning
                                    ? `Scanning ${scanProgress}%`
                                    : "Run Security Scan"}
                            </button>
                        </div>
                    </div>

                    {/* Security Score */}
                    <div className="flex justify-center">
                        <div className="relative w-48 h-48 flex items-center justify-center">
                            <svg
                                className="absolute inset-0 w-full h-full -rotate-90"
                                viewBox="0 0 100 100"
                            >
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="7"
                                    className="text-white/5"
                                />

                                <motion.circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="7"
                                    strokeLinecap="round"
                                    className={
                                        isLocked
                                            ? "text-red-500"
                                            : "text-green-400"
                                    }
                                    initial={{
                                        pathLength: 0,
                                    }}
                                    animate={{
                                        pathLength:
                                            securityScore / 100,
                                    }}
                                    transition={{
                                        duration: 1,
                                    }}
                                />
                            </svg>

                            <div className="text-center">
                                <div
                                    className={`text-4xl font-black ${
                                        isLocked
                                            ? "text-red-400"
                                            : "text-green-400"
                                    }`}
                                >
                                    {securityScore}
                                </div>

                                <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                                    Security Score
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Metrics                                                         */}
            {/* ------------------------------------------------------------- */}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <MetricCard
                    icon={<Activity size={16} />}
                    label="Threat Level"
                    value={isLocked ? "CRITICAL" : "LOW"}
                    valueClass={
                        isLocked
                            ? "text-red-400"
                            : "text-green-400"
                    }
                />

                <MetricCard
                    icon={<UserCheck size={16} />}
                    label="Active Sessions"
                    value="12"
                />

                <MetricCard
                    icon={<Eye size={16} />}
                    label="Failed Attempts"
                    value="03"
                    valueClass="text-yellow-400"
                />

                <MetricCard
                    icon={<Clock3 size={16} />}
                    label="Last Scan"
                    value={lastScan}
                />
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Protected Services                                              */}
            {/* ------------------------------------------------------------- */}

            <section className="mb-6">
                <SectionTitle
                    icon={<Server size={16} />}
                    title="Protected Services"
                    subtitle="Real-time security layer status"
                />

                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    {services.map((service) => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            locked={isLocked}
                        />
                    ))}
                </div>
            </section>

            {/* ------------------------------------------------------------- */}
            {/* Security Events                                                 */}
            {/* ------------------------------------------------------------- */}

            <section>
                <SectionTitle
                    icon={<Terminal size={16} />}
                    title="Security Event Log"
                    subtitle="Recent system security activity"
                />

                <div className="bg-[#0b0b0b] border border-white/10 rounded-2xl overflow-hidden">
                    {events.slice(0, 6).map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{
                                opacity: 0,
                                x: -8,
                            }}
                            animate={{
                                opacity: 1,
                                x: 0,
                            }}
                            transition={{
                                delay: index * 0.03,
                            }}
                            className="flex items-center gap-4 px-4 md:px-5 py-4 border-b border-white/5 last:border-b-0"
                        >
                            <EventIcon type={event.type} />

                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-300 truncate">
                                    {event.message}
                                </p>

                                <p className="text-[9px] text-gray-600 mt-1">
                                    {event.time}
                                </p>
                            </div>

                            <Zap
                                size={13}
                                className="text-gray-700 shrink-0"
                            />
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ------------------------------------------------------------- */}
            {/* Lockdown Confirmation                                           */}
            {/* ------------------------------------------------------------- */}

            <AnimatePresence>
                {showLockdown && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() =>
                            setShowLockdown(false)
                        }
                    >
                        <motion.div
                            initial={{
                                opacity: 0,
                                scale: 0.95,
                                y: 15,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.95,
                            }}
                            transition={{
                                duration: 0.2,
                            }}
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                            className="w-full max-w-md bg-[#101010] border border-red-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_100px_rgba(239,68,68,0.15)]"
                        >
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                                    <ShieldAlert
                                        size={24}
                                        className="text-red-500"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowLockdown(false)
                                    }
                                    className="p-2 text-gray-500 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <h3 className="text-xl font-black text-white mt-6">
                                Confirm System Lockdown
                            </h3>

                            <p className="text-sm text-gray-500 leading-relaxed mt-3">
                                This action should only be used when
                                you suspect a security breach. In a
                                real production implementation, this
                                should revoke sessions and restrict
                                administrative operations.
                            </p>

                            <div className="mt-5 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle
                                        size={16}
                                        className="text-red-400"
                                    />

                                    <p className="text-[10px] text-red-300 font-bold uppercase tracking-wider">
                                        Emergency action
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowLockdown(false)
                                    }
                                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={initiateLockdown}
                                    className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-wider transition-colors"
                                >
                                    Confirm Lockdown
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ========================================================================== */
/* Components                                                                 */
/* ========================================================================== */

function SectionTitle({
    icon,
    title,
    subtitle,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
}) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                {icon}
            </div>

            <div>
                <h3 className="text-sm font-bold text-white">
                    {title}
                </h3>

                <p className="text-[9px] text-gray-600 mt-0.5">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

function MetricCard({
    icon,
    label,
    value,
    valueClass = "text-white",
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    valueClass?: string;
}) {
    return (
        <div className="bg-[#0b0b0b] border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
                <div className="text-gray-600">
                    {icon}
                </div>

                <div
                    className={`text-sm font-black ${valueClass}`}
                >
                    {value}
                </div>
            </div>

            <p className="text-[9px] uppercase tracking-widest text-gray-600 font-bold mt-3">
                {label}
            </p>
        </div>
    );
}

function ServiceCard({
    service,
    locked,
}: {
    service: SecurityService;
    locked: boolean;
}) {
    const operational =
        service.status === "operational" &&
        !locked;

    return (
        <motion.div
            whileHover={{
                y: -2,
            }}
            className="bg-[#0b0b0b] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                    {service.icon}
                </div>

                {operational ? (
                    <CheckCircle2
                        size={16}
                        className="text-green-400"
                    />
                ) : (
                    <XCircle
                        size={16}
                        className="text-red-400"
                    />
                )}
            </div>

            <h4 className="text-sm font-bold text-white mt-4">
                {service.name}
            </h4>

            <p className="text-[10px] text-gray-600 mt-1">
                {service.description}
            </p>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
                <span
                    className={`text-[9px] font-bold uppercase tracking-wider ${
                        operational
                            ? "text-green-400"
                            : "text-red-400"
                    }`}
                >
                    {operational
                        ? "Operational"
                        : "Restricted"}
                </span>

                <span className="text-[9px] text-gray-600">
                    {service.latency}
                </span>
            </div>
        </motion.div>
    );
}

function EventIcon({
    type,
}: {
    type: SecurityEvent["type"];
}) {
    if (type === "critical") {
        return (
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <ShieldAlert
                    size={15}
                    className="text-red-400"
                />
            </div>
        );
    }

    if (type === "warning") {
        return (
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle
                    size={15}
                    className="text-yellow-400"
                />
            </div>
        );
    }

    return (
        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
            <CheckCircle2
                size={15}
                className="text-green-400"
            />
        </div>
    );
}