"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, ShieldCheck } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class AiErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("AI Error Boundary Caught:", error, errorInfo);

    // Dispatch telemetry report asynchronously
    fetch("/api/ai/telemetry-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: "Client React Runtime",
        route: typeof window !== "undefined" ? window.location.pathname : "unknown",
        errorTitle: error.message || "React Component Crash",
        errorStack: error.stack || errorInfo.componentStack || "",
        possibleCause: "Component lifecycle exception or hydration mismatch.",
        impact: "UI tree crashed and fallback displayed to user.",
        recommendedFix: "Inspect component stack trace and verify null-safe prop access.",
      }),
    }).catch(() => {});
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-[#0B0E11] text-white">
          <div className="max-w-md w-full bg-[#12161A] border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-6">
              <AlertTriangle size={28} />
            </div>

            <h3 className="text-xl font-serif font-bold text-white mb-2">
              {this.props.fallbackTitle || "Interface Exception Detected"}
            </h3>

            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              Our automated diagnostic system has captured this runtime event. The technical logs have been dispatched to the operations center.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-3.5 bg-[#D4AF37] hover:bg-white text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <RefreshCcw size={14} /> Reload Interface
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-widest text-gray-500 font-bold">
              <ShieldCheck size={12} className="text-[#D4AF37]" /> Telemetry Auto-Logged
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}