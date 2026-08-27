"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowLeft, ShoppingBag, ShieldCheck, ArrowRight } from 'lucide-react';
import { useHydratedCart } from '@/store/cartStoretemp'; // 🚀 Global State imported
import dynamic from 'next/dynamic';

function CartPage() {
    const router = useRouter();
    // 🚀 THE FIX: Use Global Cart State instead of manual localStorage
    const { items: cart, removeItem, _hasHydrated } = useHydratedCart();

    const cartTotal = (Array.isArray(cart) ? cart : []).reduce((total, item) => 
        total + ((item.offerPrice || item.price || 0) * (item.quantity || item.quantity || 1)), 0
    );

    if (!_hasHydrated) return <div className="h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-black selection:bg-[#D4AF37] selection:text-white">
            <header className="w-full bg-white/90 backdrop-blur-xl border-b border-gray-200 py-6 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors"><ArrowLeft size={16}/> Keep shopping</Link>
                <h1 className="text-2xl font-serif font-black tracking-[5px] uppercase absolute left-1/2 -translate-x-1/2 text-black">Essential</h1>
                <div className="hidden md:flex items-center gap-2 text-green-600 text-[10px] font-black uppercase tracking-widest"><ShieldCheck size={14}/> Safe checkout</div>
            </header>

            <main className="max-w-5xl mx-auto pt-16 pb-32 px-6 md:px-12">
                <div className="flex items-center gap-4 mb-12">
                    <ShoppingBag size={36} className="text-[#D4AF37]"/> 
                    <h2 className="text-4xl md:text-5xl font-serif text-black tracking-tighter">Your cart</h2>
                </div>
                
                {cart.length === 0 ? (
                    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white p-16 rounded-[40px] border border-gray-100 text-center shadow-sm flex flex-col items-center">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8 border border-gray-100">
                            <ShoppingBag size={40} className="text-gray-300"/>
                        </div>
                        <h3 className="text-3xl font-serif mb-4 text-black">Your cart is empty</h3>
                        <p className="text-gray-500 text-base mb-10 font-serif italic">Browse our watches and add one you love.</p>
                        <Link href="/" className="px-10 py-5 bg-black text-white font-black uppercase tracking-[4px] text-[10px] rounded-full hover:bg-[#D4AF37] hover:text-black transition-all hover:shadow-[0_10px_30px_rgba(212,175,55,0.3)] flex items-center gap-3">
                            Browse watches <ArrowRight size={14}/>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-7 space-y-6">
                            <AnimatePresence>
                                {cart.map((item, i) => (
                                    <motion.div
                                        key={item._id || item._id || i}
                                        initial={{opacity:0, scale:0.95}} 
                                        animate={{opacity:1, scale:1}} 
                                        exit={{opacity:0, scale:0.9, x:-20}} 
                                        layout 

                                        className="bg-white p-6 rounded-[30px] border border-gray-100 flex flex-col md:flex-row items-center gap-6 shadow-sm group hover:border-[#D4AF37]/50 transition-colors"
                                    >
                                        <div className="w-full md:w-32 h-32 bg-gray-50 rounded-2xl p-4 shrink-0 border border-gray-100 relative overflow-hidden">
                                            <img src={item.imageUrl || (item.imageUrl && item.imageUrl[0]) || '/placeholder-watch.png'} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                                        </div>
                                        <div className="flex-1 text-center md:text-left w-full">
                                            <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[4px] mb-1">{item.brand}</p>
                                            <h4 className="text-xl font-serif font-bold text-black leading-tight mb-3 line-clamp-1">{item.name || item.name}</h4>
                                            <div className="flex justify-between items-center w-full">
                                                <p className="text-lg font-black font-serif text-black">₹{Number(item.offerPrice || item.price).toLocaleString('en-IN')}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-md">Qty: {item.quantity || item.quantity || 1}</p>
                                            </div>
                                        </div>
<button onClick={() => removeItem(item._id || item._id || "")} className="w-12 h-12 shrink-0 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center md:ml-2">                                            <Trash2 size={18}/>
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        <div className="lg:col-span-5">
                            <div className="bg-[#050505] text-white p-10 rounded-[40px] shadow-2xl sticky top-32 border border-[#D4AF37]/20 overflow-hidden">
                                <h3 className="text-2xl font-serif text-white mb-8 border-b border-white/10 pb-6">Order summary</h3>
                                
                                <div className="space-y-4 mb-8 text-sm font-bold text-gray-400">
                                    <div className="flex justify-between items-center"><span>Subtotal</span><span className="text-white font-mono">₹{cartTotal.toLocaleString('en-IN')}</span></div>
                                    <div className="flex justify-between items-center"><span>Insured shipping</span><span className="text-green-400 font-black uppercase tracking-widest text-[10px]">Free</span></div>
                                    <div className="flex justify-between items-center"><span>Taxes</span><span className="text-white font-mono">Included</span></div>
                                </div>

                                <div className="flex justify-between items-end mb-10 border-t border-white/10 pt-8">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total</span>
                                    <span className="text-4xl font-serif font-black text-[#D4AF37] tracking-tighter">₹{cartTotal.toLocaleString('en-IN')}</span>
                                </div>

                                <button onClick={() => router.push('/checkout')} className="w-full py-6 bg-[#D4AF37] text-black font-black uppercase tracking-[4px] rounded-2xl hover:bg-white hover:shadow-[0_10px_30px_rgba(212,175,55,0.3)] transition-all text-[11px] flex justify-center items-center gap-3">
                                    Proceed to Checkout <ArrowRight size={16}/>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default dynamic(() => Promise.resolve(CartPage), { ssr: false });