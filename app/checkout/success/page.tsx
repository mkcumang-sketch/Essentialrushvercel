"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight, ShieldCheck, Package, MapPin, Download, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
    const router = useRouter();
    const [txnId, setTxnId] = useState(""); // 🔧 START EMPTY
    const [showCertificate, setShowCertificate] = useState(false);
    const [isMounted, setIsMounted] = useState(false); // 🔧 ADD HYDRATION GUARD

    useEffect(() => {
        // 🔧 ONLY GENERATE ON CLIENT SIDE
        setIsMounted(true);
        setTxnId(`TXN-${Date.now().toString().slice(-8)}`);
        
        // 🛡️ SECURITY: Wipe the cart completely upon successful entry to this page
        localStorage.removeItem('luxury_cart');
    }, []);

    // 🔧 PREVENT RENDERING UNTIL HYDRATED
    if (!isMounted) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-[#D4AF37] selection:text-black">
            
            {/* AMBIENT LIGHTING */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37] blur-[150px] opacity-10 pointer-events-none rounded-full"></div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-2xl w-full bg-black/40 backdrop-blur-2xl border border-white/10 p-10 md:p-16 rounded-[40px] text-center shadow-2xl relative z-10"
            >
                <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20"
                >
                    <CheckCircle size={50} className="text-green-500" />
                </motion.div>

                <h1 className="text-4xl md:text-5xl font-serif italic text-white mb-4 tracking-tighter">Order confirmed</h1>
                <p className="text-gray-400 font-serif text-lg mb-8">Thank you. We are packing your watch and will ship it soon.</p>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-10 text-left space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Order ref</span>
                        <span className="text-xs font-mono text-[#D4AF37] tracking-widest">{txnId}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={12}/> Status</span>
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Confirmed</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2"><Package size={12}/> Next step</span>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Getting ready to ship</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={() => setShowCertificate(true)} className="px-8 py-5 bg-white text-black font-black uppercase text-[10px] tracking-[4px] rounded-full hover:bg-[#D4AF37] transition-all shadow-xl flex items-center justify-center gap-2">
                        Certificate <Download size={14}/>
                    </button>
                    <button onClick={() => router.push('/account')} className="px-8 py-5 bg-[#D4AF37] text-black font-black uppercase text-[10px] tracking-[4px] rounded-full hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2">
                        Track Order <MapPin size={14}/>
                    </button>
                    <button onClick={() => router.push('/')} className="px-8 py-5 bg-transparent border border-white/20 text-white font-black uppercase text-[10px] tracking-[4px] rounded-full hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                        Back home <ArrowRight size={14}/>
                    </button>
                </div>
            </motion.div>

            {/* 📜 DIGITAL AUTHENTICITY CERTIFICATE MODAL 📜 */}
            <AnimatePresence>
                {showCertificate && (
                    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
                        <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="bg-white text-black max-w-4xl w-full rounded-[60px] overflow-hidden relative shadow-[0_0_100px_rgba(212,175,55,0.2)] print:m-0 print:rounded-none">
                            <button onClick={()=>setShowCertificate(false)} className="absolute top-10 right-10 p-4 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all print:hidden"><X size={20}/></button>
                            
                            <div className="p-16 md:p-24 text-center border-[20px] border-double border-gray-100 m-8 rounded-[40px] relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] text-[400px] pointer-events-none">♞</div>
                                
                                <p className="text-[12px] font-black uppercase tracking-[20px] mb-12 text-[#D4AF37]">Certificate of Authenticity</p>
                                <h2 className="text-6xl md:text-8xl font-serif italic mb-12 tracking-tighter">Essential Rush</h2>
                                
                                <div className="max-w-md mx-auto space-y-8 mb-16">
                                    <p className="text-lg font-serif italic text-gray-600">"This document certifies that the timepiece acquired under transaction <span className="text-black font-bold">{txnId}</span> is an authentic masterpiece, curated and verified by the Essential Fine Horology Vault."</p>
                                </div>

                                <div className="grid grid-cols-2 gap-12 text-left border-t border-b border-gray-100 py-12 mb-12">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Acquisition Ref</p>
                                        <p className="text-sm font-mono font-black">{txnId}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Timestamp</p>
                                        <p className="text-sm font-mono font-black">{isMounted && new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </div>

                                <div className="flex justify-center mb-12">
                                    <div className="w-32 h-32 border-4 border-black/5 rounded-full flex items-center justify-center p-2">
                                        <div className="w-full h-full border-2 border-black/10 rounded-full flex items-center justify-center text-4xl">♞</div>
                                    </div>
                                </div>

                                <button onClick={()=>window.print()} className="px-12 py-5 bg-black text-[#D4AF37] font-black uppercase text-[10px] tracking-[5px] rounded-full hover:bg-[#D4AF37] hover:text-black transition-all shadow-2xl print:hidden">
                                    Print Certificate
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SECURE FOOTER */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 text-gray-600 opacity-50">
                <ShieldCheck size={16}/>
                <p className="text-[8px] uppercase font-black tracking-[4px]">Essential Rush • Insured shipping</p>
            </div>
        </div>
    );
}
// 🌟 VERCEL SSR BYPASS 🌟
