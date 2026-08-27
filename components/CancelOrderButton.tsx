"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2, CheckCircle2, XCircle } from 'lucide-react';

// =========================================================
// STRICT INTERFACES
// =========================================================
interface CancelOrderButtonProps {
    orderId: string;
    status: string;
}

export default function CancelOrderButton({ orderId, status }: CancelOrderButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ 
        show: false, 
        message: '', 
        type: 'success' 
    });

    // Only render the button if the order is eligible for cancellation
    const normalizedStatus = status.trim().toLowerCase();
    if (normalizedStatus !== 'pending' && normalizedStatus !== 'processing') {
        return null;
    }

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
    };

    const handleConfirmCancel = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/orders/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });

            const data = await res.json();

            if (data.success) {
                showToast("Order cancelled successfully.", "success");
                setIsModalOpen(false);
                
                // Smooth refresh after animation completes
                setTimeout(() => {
                    router.refresh();
                }, 1500);
            } else {
                showToast(data.message || "Failed to cancel order.", "error");
                setIsLoading(false);
            }
        } catch (error) {
            showToast("Network error. Please try again.", "error");
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* TRIGGER BUTTON */}
            <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsModalOpen(true)}
                disabled={isLoading}
                className={`mt-4 px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all duration-300 border rounded-xl
                    ${isLoading 
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                        : 'bg-white text-gray-500 border-gray-200 hover:border-red-500 hover:text-red-600 hover:bg-red-50 hover:shadow-sm'
                    }`}
            >
                Cancel Order
            </motion.button>

            {/* LUXURY TOAST NOTIFICATION */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, x: "-50%" }} 
                        animate={{ opacity: 1, y: 0, x: "-50%" }} 
                        exit={{ opacity: 0, scale: 0.95, x: "-50%" }} 
                        className="fixed bottom-10 left-1/2 z-[3000] bg-white/95 backdrop-blur-xl border border-gray-200 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] w-max max-w-[90vw]"
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[3px] text-gray-500">
                                {toast.type === 'success' ? 'Vault Updated' : 'Action Failed'}
                            </p>
                            <p className="text-gray-900 text-sm font-serif italic">{toast.message}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CINEMATIC CONFIRMATION MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div 
                        className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 h-[100dvh]"
                        onClick={() => !isLoading && setIsModalOpen(false)}
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                            className="bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-8 md:p-10 w-full max-w-md text-white relative shadow-2xl"
                        >
                            <button 
                                onClick={() => !isLoading && setIsModalOpen(false)} 
                                disabled={isLoading}
                                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full disabled:opacity-50"
                            >
                                <X size={20}/>
                            </button>
                            
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
                                    <AlertTriangle size={24}/>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-serif italic font-black text-white">Cancel Order?</h3>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Action Cannot Be Undone</p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-400 leading-relaxed mb-8">
                                Are you sure you want to cancel this acquisition? The reserved timepiece will be released back into the global inventory.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isLoading}
                                    className="py-4 border border-white/10 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                    Keep Order
                                </button>
                                <button 
                                    onClick={handleConfirmCancel}
                                    disabled={isLoading}
                                    className="py-4 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] flex justify-center items-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin"/> : "Confirm Cancel"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}