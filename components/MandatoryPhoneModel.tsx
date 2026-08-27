"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ShieldCheck, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MandatoryPhoneModal() {
    const { data: session, status, update } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Agar user login hai, par uske session mein phone number nahi hai
        if (status === 'authenticated' && session?.user) {
            const hasPhone = (session.user as any).phone;
            if (!hasPhone) {
                setIsOpen(true); // Popup khol do aur band mat hone do
            }
        }
    }, [status, session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone || phone.length < 10) return alert("Please enter a valid phone number.");
        setLoading(true);

        try {
            const res = await fetch(`/api/user/verify-phone?t=${Date.now()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: session?.user?.email, phone })
            });

            // 🚨 NAYA LOGIC: Backend se exact error pakdo
            const data = await res.json();

            if (res.ok && data.success) {
                // Number save ho gaya
                await update({ phone: phone }); 
                setIsOpen(false); 
                window.location.reload(); 
            } else {
                // Agar number kisi aur ka hai toh yahan Alert aayega
                alert(data.error || "Failed to verify phone. Try again.");
            }
        } catch (error) {
            alert("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        className="bg-[#0a0a0a] border border-[#D4AF37]/50 rounded-[40px] p-8 md:p-12 max-w-md w-full relative shadow-[0_0_100px_rgba(212,175,55,0.15)] text-center"
                    >
                        <div className="w-20 h-20 bg-black border border-[#D4AF37]/30 text-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <ShieldCheck size={30}/>
                        </div>
                        
                        <h3 className="text-3xl font-serif font-bold text-white mb-2">Confirm your phone</h3>
                        <p className="text-[10px] text-gray-400 uppercase tracking-[3px] mb-8 font-bold leading-relaxed">
                            Hi {session?.user?.name?.split(' ')[0]}. <br/> 
                            Add your phone number so we can reach you about your order.
                        </p>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    required 
                                    type="tel" 
                                    value={phone} 
                                    onChange={e=>setPhone(e.target.value)} 
                                    className="w-full bg-black border border-white/20 py-4 pl-12 pr-4 rounded-2xl text-sm outline-none focus:border-[#D4AF37] text-white font-mono transition-colors" 
                                    placeholder="Enter WhatsApp Number" 
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-5 bg-[#D4AF37] text-black font-black uppercase tracking-[4px] rounded-2xl text-xs hover:bg-white transition-all shadow-xl disabled:opacity-50">
                                {loading ? 'Please wait...' : 'Continue'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}