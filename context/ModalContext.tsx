"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2, LogOut, ShieldCheck, Info } from 'lucide-react';

export type ModalType = 'confirm' | 'alert' | 'info' | 'delete' | 'logout';

export interface Modal {
  id: string;
  type: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  icon?: React.ReactNode;
  isDestructive?: boolean;
}

interface ModalContextType {
  showModal: (modal: Omit<Modal, 'id'>) => void;
  hideModal: (id: string) => void;
  currentModal: Modal | null;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

const MODAL_ICONS: Record<ModalType, React.ReactNode> = {
  confirm: <AlertTriangle size={32} className="text-amber-500" />,
  alert: <AlertTriangle size={32} className="text-red-500" />,
  info: <Info size={32} className="text-blue-500" />,
  delete: <Trash2 size={32} className="text-red-500" />,
  logout: <LogOut size={32} className="text-gray-500" />,
};

const MODAL_STYLES: Record<ModalType, { wrapper: string; confirmBtn: string }> = {
  confirm: {
    wrapper: 'bg-white',
    confirmBtn: 'bg-black text-white hover:bg-gray-800'
  },
  alert: {
    wrapper: 'bg-white',
    confirmBtn: 'bg-red-500 text-white hover:bg-red-600'
  },
  info: {
    wrapper: 'bg-white',
    confirmBtn: 'bg-[#D4AF37] text-black hover:bg-[#D4AF37]/80'
  },
  delete: {
    wrapper: 'bg-white',
    confirmBtn: 'bg-red-500 text-white hover:bg-red-600'
  },
  logout: {
    wrapper: 'bg-white',
    confirmBtn: 'bg-gray-800 text-white hover:bg-black'
  },
};

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [currentModal, setCurrentModal] = useState<Modal | null>(null);

  const showModal = useCallback((modal: Omit<Modal, 'id'>) => {
    const id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCurrentModal({ ...modal, id });
  }, []);

  const hideModal = useCallback((id: string) => {
    setCurrentModal(prev => prev?.id === id ? null : prev);
  }, []);

  const handleConfirm = async () => {
    if (currentModal) {
      await currentModal.onConfirm();
      hideModal(currentModal.id);
    }
  };

  const handleCancel = () => {
    if (currentModal) {
      currentModal.onCancel?.();
      hideModal(currentModal.id);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && currentModal) {
      handleCancel();
    }
  }, [currentModal]);

  useEffect(() => {
    if (currentModal) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [currentModal, handleKeyDown]);

  return (
    <ModalContext.Provider value={{ showModal, hideModal, currentModal }}>
      {children}
      <AnimatePresence>
        {currentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[6000] flex items-center justify-center p-4"
            onClick={handleCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`${MODAL_STYLES[currentModal.type].wrapper} rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCancel}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 p-2 rounded-full"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  {currentModal.icon || MODAL_ICONS[currentModal.type]}
                </div>
                <h3
                  id="modal-title"
                  className="text-2xl font-serif font-black text-gray-900 mb-4"
                >
                  {currentModal.title}
                </h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  {currentModal.message}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors"
                >
                  {currentModal.cancelText || 'Cancel'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-colors ${MODAL_STYLES[currentModal.type].confirmBtn}`}
                >
                  {currentModal.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

// Convenience hooks for specific modal types
export function useConfirmModal() {
  const { showModal } = useModal();
  return useCallback((title: string, message: string, onConfirm: () => void | Promise<void>) => {
    showModal({
      type: 'confirm',
      title,
      message,
      onConfirm,
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    });
  }, [showModal]);
}

export function useDeleteModal() {
  const { showModal } = useModal();
  return useCallback((title: string, message: string, onConfirm: () => void | Promise<void>) => {
    showModal({
      type: 'delete',
      title,
      message,
      onConfirm,
      isDestructive: true,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
  }, [showModal]);
}

export function useLogoutModal() {
  const { showModal } = useModal();
  return useCallback((onConfirm: () => void | Promise<void>) => {
    showModal({
      type: 'logout',
      title: 'Sign Out',
      message: 'Are you sure you want to sign out? Your session will be terminated.',
      onConfirm,
      confirmText: 'Sign Out',
      cancelText: 'Cancel'
    });
  }, [showModal]);
}