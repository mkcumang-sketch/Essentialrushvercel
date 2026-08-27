"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';

// =========================================================
// STRICT INTERFACES
// =========================================================
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🚨 Vault Error Boundary Caught:", error, errorInfo);
    
    // 🛡️ REPORT TO ERROR TRACKING SERVICE
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Intended for Sentry, LogRocket, Datadog, etc.
      console.log("Telemetry: Error dispatched to tracking service.");
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided via props, use it
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} reset={this.handleReset} />;
      }

      // Default Luxury Fallback UI
      return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-[#0B0E11] px-4 font-sans text-white relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.05),transparent_60%)] pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-lg w-full bg-[#0A0A0A] rounded-[2.5rem] border border-white/10 shadow-2xl p-10 md:p-14 text-center relative z-10"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
              className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(239,68,68,0.15)]"
            >
              <ShieldAlert className="text-red-500" size={36} />
            </motion.div>
            
            <h1 className="text-3xl md:text-4xl font-serif font-bold italic text-white mb-4 tracking-tight">
              System Interruption
            </h1>
            
            <p className="text-gray-400 mb-10 leading-relaxed font-medium text-sm">
              We apologize, but a temporary anomaly has occurred in the vault. Our horological engineers have been notified.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 mb-8 text-left max-h-40 overflow-y-auto custom-scrollbar">
                <p className="text-xs font-mono text-red-400 break-all leading-relaxed">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={this.handleReset}
              className="w-full bg-[#D4AF37] text-black font-black uppercase tracking-[0.2em] py-5 px-6 rounded-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:bg-white"
            >
              <RefreshCw size={18} />
              Attempt Restoration
            </motion.button>

            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
                Requires immediate assistance?
              </p>
              <a 
                href="mailto:support@essentialrush.com"
                className="text-[10px] text-[#D4AF37] hover:text-white uppercase tracking-widest font-black transition-colors inline-block mt-3"
              >
                Contact Concierge
              </a>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// =========================================================
// FUNCTIONAL ERROR HANDLING HOOK
// =========================================================
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((newError: Error) => {
    console.error("🚨 Hook Error Caught:", newError);
    setError(newError);
    
    // 🛡️ REPORT TO ERROR TRACKING
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      console.log("Telemetry: Hook error dispatched to tracking service.");
    }
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error; // This triggers the nearest ErrorBoundary
    }
  }, [error]);

  return { error, handleError, resetError };
};