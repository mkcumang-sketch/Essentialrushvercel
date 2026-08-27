"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, AlertTriangle, Info, Loader2, ShoppingBag, Heart, Trash2, Copy, ShieldCheck } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  icon?: React.ReactNode;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  hideToast: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={20} className="text-green-500" />,
  error: <X size={20} className="text-red-500" />,
  warning: <AlertTriangle size={20} className="text-amber-500" />,
  info: <Info size={20} className="text-blue-500" />,
  loading: <Loader2 size={20} className="text-[#D4AF37] animate-spin" />,
};

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; iconBg: string }> = {
  success: {
    bg: 'bg-white/95',
    border: 'border-green-200',
    iconBg: 'bg-green-50'
  },
  error: {
    bg: 'bg-white/95',
    border: 'border-red-200',
    iconBg: 'bg-red-50'
  },
  warning: {
    bg: 'bg-white/95',
    border: 'border-amber-200',
    iconBg: 'bg-amber-50'
  },
  info: {
    bg: 'bg-white/95',
    border: 'border-blue-200',
    iconBg: 'bg-blue-50'
  },
  loading: {
    bg: 'bg-white/95',
    border: 'border-[#D4AF37]/30',
    iconBg: 'bg-[#D4AF37]/10'
  },
};

const TOAST_LABELS: Record<ToastType, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Attention',
  info: 'Information',
  loading: 'Processing',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { id, type, message, duration };
    
    setToasts(prev => [...prev, newToast]);

    if (duration > 0 && type !== 'loading') {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} hideToast={hideToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, hideToast }: { toasts: Toast[]; hideToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[5000] flex flex-col gap-3 items-center w-full max-w-md px-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              duration: 0.4
            }}
            className="pointer-events-auto w-full"
          >
            <div className={`${TOAST_STYLES[toast.type].bg} backdrop-blur-xl ${TOAST_STYLES[toast.type].border} border rounded-2xl shadow-2xl p-4 flex items-center gap-4`}>
              <div className={`${TOAST_STYLES[toast.type].iconBg} w-10 h-10 rounded-full flex items-center justify-center shrink-0`}>
                {toast.icon || TOAST_ICONS[toast.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[3px] text-gray-500 mb-1">
                  {TOAST_LABELS[toast.type]}
                </p>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {toast.message}
                </p>
              </div>
              {toast.type !== 'loading' && (
                <button
                  onClick={() => hideToast(toast.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Convenience hooks for specific toast types
export function useSuccessToast() {
  const { showToast } = useToast();
  return useCallback((message: string, duration?: number) => {
    showToast('success', message, duration);
  }, [showToast]);
}

export function useErrorToast() {
  const { showToast } = useToast();
  return useCallback((message: string, duration?: number) => {
    showToast('error', message, duration);
  }, [showToast]);
}

export function useWarningToast() {
  const { showToast } = useToast();
  return useCallback((message: string, duration?: number) => {
    showToast('warning', message, duration);
  }, [showToast]);
}

export function useInfoToast() {
  const { showToast } = useToast();
  return useCallback((message: string, duration?: number) => {
    showToast('info', message, duration);
  }, [showToast]);
}

export function useLoadingToast() {
  const { showToast, hideToast } = useToast();
  return useCallback((message: string) => {
    const id = `loading-${Date.now()}`;
    showToast('loading', message, 0); // No auto-dismiss for loading
    return () => hideToast(id);
  }, [showToast, hideToast]);
}