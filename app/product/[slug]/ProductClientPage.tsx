"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Star, ShieldCheck, ArrowLeft, Play } from 'lucide-react';
import Link from 'next/link';

interface ProductClientPageProps {
    initialProduct: any;
}

export default function ProductClientPage({ initialProduct }: ProductClientPageProps) {
    // 🔧 1. HYDRATION GUARD & COMPONENT STATES
    const [isMounted, setIsMounted] = useState(false);
    const [cart, setCart] = useState<any[]>([]);
    const [validImages, setValidImages] = useState<string[]>([]);
    const [activeMedia, setActiveMedia] = useState<{ type: 'image' | 'video', url: string }>({ type: 'image', url: '' });
    const [productReviews, setProductReviews] = useState<any[]>([]);

    // 🔧 2. HYDRATION-SAFE INITIALIZATION EFFECT (Your exact snippet)
    useEffect(() => {
        // 🔧 MARK AS MOUNTED FIRST
        setIsMounted(true);
        
        // Now safe to access localStorage
        setCart(JSON.parse(localStorage.getItem('luxury_cart') || '[]'));
        
        // Initialize Media
        const allImgs = [initialProduct.imageUrl, ...(initialProduct.images || [])].filter(Boolean);
        setValidImages(allImgs); 
        if (allImgs.length > 0) setActiveMedia({ type: 'image', url: allImgs[0] });

        // Fetch Reviews Silently
        const fetchReviews = async () => {
            try {
                const ts = new Date().getTime();
                const revRes = await fetch(`/api/reviews?t=${ts}`).then(r => r.json());
                let pubReviews = (revRes.data || []).filter((r: any) => (r.product === initialProduct._id || r.product === 'GLOBAL') && r.visibility === 'public');
                const localReviews = JSON.parse(localStorage.getItem('my_ghost_reviews') || '[]').filter((r: any) => (r.product === initialProduct._id || r.product === 'GLOBAL') && !pubReviews.some((p:any)=>p.userName === r.userName));
                setProductReviews([...localReviews, ...pubReviews]);
            } catch(e) { console.error("Review Sync Error", e); }
        };
        fetchReviews();
    }, [initialProduct]);

    // 🔧 3. LOADING SKELETON (Prevents Hydration Mismatch UI Flash)
    if (!isMounted) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // 4. MAIN RENDER LOGIC
    return (
        <div className="min-h-screen bg-[#FAFAFA] text-black">
            {/* Header */}
            <header className="w-full bg-white border-b border-gray-200 py-6 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors">
                    <ArrowLeft size={16}/> Vault
                </Link>
                <h1 className="text-2xl font-serif font-black tracking-[5px] uppercase absolute left-1/2 -translate-x-1/2">Essential</h1>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                
                {/* LEFT: Media Gallery */}
                <div className="space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[30px] p-8 border border-gray-200 aspect-square flex items-center justify-center relative overflow-hidden shadow-sm"
                    >
                        {activeMedia.type === 'image' ? (
                            <img src={activeMedia.url} alt={initialProduct.name} className="w-full h-full object-contain mix-blend-multiply" />
                        ) : (
                            <video src={activeMedia.url} autoPlay loop muted playsInline className="w-full h-full object-cover rounded-2xl" />
                        )}
                        {initialProduct.badge && (
                            <span className="absolute top-6 right-6 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-md">
                                {initialProduct.badge}
                            </span>
                        )}
                    </motion.div>

                    {/* Thumbnails */}
                    <div className="flex flex-wrap gap-4">
                        {validImages.map((img, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => setActiveMedia({ type: 'image', url: img })}
                                className={`w-20 h-20 bg-white border rounded-2xl p-2 transition-all ${activeMedia.url === img ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/20' : 'border-gray-200 hover:border-gray-400'}`}
                            >
                                <img src={img} className="w-full h-full object-contain mix-blend-multiply" />
                            </button>
                        ))}
                        {initialProduct.videoUrl && (
                            <button 
                                onClick={() => setActiveMedia({ type: 'video', url: initialProduct.videoUrl })}
                                className={`w-20 h-20 bg-black text-white flex flex-col items-center justify-center rounded-2xl transition-all ${activeMedia.url === initialProduct.videoUrl ? 'ring-2 ring-black' : 'opacity-80 hover:opacity-100'}`}
                            >
                                <Play size={20} className="mb-1" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Video</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* RIGHT: Product Details */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col justify-center">
                    <p className="text-[#D4AF37] text-xs font-black uppercase tracking-[0.2em] mb-2">{initialProduct.brand}</p>
                    <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight mb-4">{initialProduct.name}</h1>
                    
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex items-center text-[#D4AF37]">
                            <Star size={16} className="fill-[#D4AF37]"/>
                            <Star size={16} className="fill-[#D4AF37]"/>
                            <Star size={16} className="fill-[#D4AF37]"/>
                            <Star size={16} className="fill-[#D4AF37]"/>
                            <Star size={16} className="fill-[#D4AF37]"/>
                        </div>
                        <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">{productReviews.length} Reviews</span>
                    </div>

                    <div className="text-3xl font-mono font-black mb-8 flex items-end gap-3">
                        ₹{Number(initialProduct.offerPrice || initialProduct.price).toLocaleString('en-IN')}
                        {initialProduct.offerPrice && (
                            <span className="text-lg text-gray-400 line-through mb-1">₹{Number(initialProduct.price).toLocaleString('en-IN')}</span>
                        )}
                    </div>

                    <p className="text-gray-600 leading-relaxed mb-10">{initialProduct.description || "An exquisite piece of fine horology, designed for the modern connoisseur."}</p>

                    <div className="bg-white p-6 rounded-[24px] border border-gray-200 mb-10">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 border-b border-gray-100 pb-2">Specifications</h3>
                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                            {(initialProduct.amazonDetails || []).map((detail: any, idx: number) => (
                                <React.Fragment key={idx}>
                                    <div className="text-gray-500">{detail.key}</div>
                                    <div className="font-bold text-right">{detail.value}</div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                        <button className="flex-1 bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#D4AF37] hover:text-black transition-all flex items-center justify-center gap-2 shadow-xl">
                            <ShoppingBag size={18} /> Add to Cart
                        </button>
                        <div className="flex items-center justify-center gap-2 px-6 py-4 bg-green-50 text-green-700 rounded-2xl border border-green-100">
                            <ShieldCheck size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">100% Authentic</span>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}