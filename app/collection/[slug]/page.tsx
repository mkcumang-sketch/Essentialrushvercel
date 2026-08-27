"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, ShieldCheck, Filter } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function CollectionPage() {
  const params = useParams();
  const slug = params?.slug as string || '';
  const collectionName = decodeURIComponent(slug).replace(/-/g, ' ');

  // 🔧 COMPONENT STATES & HYDRATION GUARD
  const [isMounted, setIsMounted] = useState(false);
  const [watches, setWatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  // 🔧 HYDRATION-SAFE FETCH EFFECT (Exact snippet)
  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const res = await fetch(`/api/products?search=${collectionName}&limit=20`);
        if (res.ok) {
          const result = await res.json();
          const exactMatches = result.data?.filter((w: any) => 
            w.brand.toLowerCase().includes(collectionName.toLowerCase()) || 
            w.category?.toLowerCase().includes(collectionName.toLowerCase())
          ) || result.data; 
          setWatches(exactMatches || []);
        }
        // 🔧 ONLY READ localStorage AFTER MOUNT
        if (typeof window !== 'undefined') {  // Extra safety check
          const cart = JSON.parse(localStorage.getItem('luxury_cart') || '[]');
          setCartCount(cart.length);
        }
        setLoading(false);
      } catch (e) { 
        setLoading(false); 
      }
    };
    
    // 🔧 RUN ONLY ON CLIENT
    setIsMounted(true);
    if (collectionName) {
      fetchCollection();
    }
  }, [collectionName]);

  // 🔧 SKELETON LOADER (Prevents Hydration Mismatch & handles fetching state)
  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black">
      {/* 🚀 Header */}
      <header className="w-full bg-white border-b border-gray-200 py-6 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors">
          <ArrowLeft size={16} /> Home
        </Link>
        <h1 className="text-2xl font-serif font-black tracking-[5px] uppercase absolute left-1/2 -translate-x-1/2">Essential</h1>
        <Link href="/cart" className="relative text-black hover:text-[#D4AF37] transition-colors">
          <ShoppingBag size={24} />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
              {cartCount}
            </span>
          )}
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* 🚀 Collection Banner */}
        <div className="mb-12 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6 border-b border-gray-200 pb-10">
          <div>
            <p className="text-[#D4AF37] text-xs font-black uppercase tracking-[0.2em] mb-2">Curated Collection</p>
            <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tight capitalize">{collectionName}</h1>
            <p className="text-gray-500 mt-4 max-w-2xl">{watches.length} exclusive timepieces available in this collection.</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-full text-xs font-bold uppercase tracking-widest hover:border-black transition-all">
            <Filter size={16} /> Filter
          </button>
        </div>

        {/* 🚀 Product Grid */}
        {watches.length === 0 ? (
          <div className="bg-white p-12 rounded-[30px] border border-gray-200 text-center shadow-sm py-24">
            <ShieldCheck size={60} className="mx-auto text-gray-300 mb-6" />
            <h3 className="text-2xl font-serif mb-2">No timepieces found</h3>
            <p className="text-gray-500 text-sm mb-8">This collection is currently empty or sold out.</p>
            <Link href="/" className="px-8 py-4 bg-black text-white font-bold uppercase text-xs rounded-full hover:bg-[#D4AF37] hover:text-black transition-colors inline-block">
              Explore Vault
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {watches.map((watch: any, i: number) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.1 }}
                key={watch._id || i} 
                className="bg-white p-6 rounded-[25px] border border-gray-200 flex flex-col group hover:shadow-xl transition-all duration-500"
              >
                <div className="relative aspect-square bg-gray-50 rounded-xl p-4 mb-6 overflow-hidden">
                  {watch.badge && (
                    <span className="absolute top-3 right-3 bg-[#D4AF37] text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full z-10">
                      {watch.badge}
                    </span>
                  )}
                  <img 
                    src={watch.imageUrl || (watch.images && watch.images[0])} 
                    alt={watch.name}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-700" 
                  />
                </div>
                
                <div className="flex-1 flex flex-col">
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-2">{watch.brand}</p>
                  <h4 className="text-lg font-serif font-bold text-black mb-4 line-clamp-2 leading-tight">{watch.name}</h4>
                  
                  <div className="mt-auto flex items-end justify-between border-t border-gray-100 pt-4">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Valuation</p>
                      <p className="text-lg font-bold">₹{Number(watch.offerPrice || watch.price).toLocaleString('en-IN')}</p>
                    </div>
                    <Link 
                      href={`/product/${watch.slug || watch._id}`}
                      className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#D4AF37] hover:text-black transition-colors"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}