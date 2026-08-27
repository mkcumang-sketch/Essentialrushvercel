"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Plus, ArrowLeft, CheckCircle2, SlidersHorizontal, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { useHydratedCart, CartItem } from '@/store/cartStoretemp'; 

interface Product {
  _id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  offerPrice?: number;
  imageUrl: string;
  images: string[];
  priority?: number;
  slug?: string;
}

export default function ShopClient({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  
  // ✅ ZUSTAND TAKEOVER: No more manual localStorage or raw useState for cart!
  const { items, addItem, _hasHydrated } = useHydratedCart();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("NEWEST");
  const [toast, setToast] = useState<string | null>(null);

  // Global Notification System
  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const availableBrands = useMemo(() => Array.from(new Set((initialProducts || []).map(p => p.brand).filter(Boolean))), [initialProducts]);

  const toggleFilter = (setState: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setState(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...(initialProducts || [])];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => (p.name || p.title || "").toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q));
    }
    if (selectedBrands.length > 0) result = result.filter(p => selectedBrands.includes(p.brand));

    if (sortBy === "PRICE_LOW") result.sort((a, b) => (Number(a.offerPrice || a.price) - Number(b.offerPrice || b.price)));
    else if (sortBy === "PRICE_HIGH") result.sort((a, b) => (Number(b.offerPrice || b.price) - Number(a.offerPrice || a.price)));
    else result.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return result;
  }, [initialProducts, searchQuery, selectedBrands, sortBy]);

  // ✅ CLEAN ADDTOCART: Zustand handles the logic, mapping, and DB sync securely
  const addToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    addItem(product);
    notify(`${product.name} added to Vault`);
  };

  // 🚀 HYDRATION CHECK: Prevents React crash before Zustand loads
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F7F7]">
         <div className="animate-pulse w-12 h-12 bg-black text-[#D4AF37] rounded-2xl flex items-center justify-center font-black text-xl mb-4">♞</div>
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Securing Vault...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#050505] font-sans pb-20">
      
      {/* Dynamic Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: "-50%" }} 
            animate={{ opacity: 1, y: 0, x: "-50%" }} 
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className="fixed top-8 left-1/2 z-[200] bg-[#0A0A0A] border border-[#D4AF37]/30 text-white px-6 py-4 rounded-full flex items-center gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-md"
          >
            <CheckCircle2 size={18} className="text-[#D4AF37]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Header */}
      <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-2xl border-b border-gray-100 h-20 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="w-10 h-10 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="hidden md:flex items-center gap-3">
             <div className="w-8 h-8 bg-black text-[#D4AF37] rounded-lg flex items-center justify-center font-black text-sm">♞</div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Essential Rush</p>
          </div>
        </div>
        
        <div className="relative cursor-pointer group" onClick={() => router.push('/checkout')}>
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-[#D4AF37] transition-colors border border-gray-100">
            <ShoppingBag size={20} className="text-black" />
          </div>
          {/* ✅ UPDATED to use items.length */}
          {items.length > 0 && (
            <motion.span initial={{scale:0}} animate={{scale:1}} className="absolute -top-2 -right-2 bg-black text-[#D4AF37] w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">
              {items.length}
            </motion.span>
          )}
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 flex flex-col lg:flex-row gap-10">
        
        {/* Sticky Filters Sidebar */}
        <aside className="lg:w-[280px] flex-shrink-0 lg:sticky lg:top-32 self-start">
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] mb-6">
             <div className="relative mb-8">
               <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search timepieces..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-gray-50 py-4 pl-12 pr-4 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-[#D4AF37] border border-transparent transition-all"
               />
             </div>
             
             <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2"><SlidersHorizontal size={14}/> Top Brands</h4>
             <div className="space-y-3">
               {(availableBrands || []).map(brand => (
                 <button 
                    key={brand as string} 
                    onClick={() => toggleFilter(setSelectedBrands, brand as string)} 
                    className="flex items-center gap-4 w-full group"
                 >
                   <div className={`w-5 h-5 rounded-[6px] flex items-center justify-center border transition-all ${selectedBrands.includes(brand as string) ? 'bg-black border-black' : 'border-gray-300 group-hover:border-black bg-gray-50'}`}>
                     {selectedBrands.includes(brand as string) && <CheckCircle2 size={14} className="text-[#D4AF37]" />}
                   </div>
                   <span className={`text-xs uppercase tracking-widest font-black transition-colors ${selectedBrands.includes(brand as string) ? 'text-black' : 'text-gray-500 group-hover:text-black'}`}>{brand as string}</span>
                 </button>
               ))}
             </div>
           </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-4 sm:px-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <h2 className="text-3xl font-serif italic text-black tracking-tight ml-2">The Collection</h2>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-50 border border-transparent hover:border-gray-200 text-[10px] font-black uppercase py-4 px-6 rounded-2xl outline-none cursor-pointer transition-all">
              <option value="NEWEST">Newest Arrivals</option>
              <option value="PRICE_LOW">Price: Low to High</option>
              <option value="PRICE_HIGH">Price: High to Low</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* ✅ ADDED Array Fallback: || [] */}
            {(filteredAndSortedProducts || []).map((watch: any) => (
              <Link href={`/product/${watch._id}`} key={watch._id} className="group bg-white p-6 rounded-[2.5rem] border border-gray-100 hover:border-gray-300 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 flex flex-col h-full relative">
                
                {/* Image Container with depth */}
                <div className="flex aspect-[4/5] bg-gradient-to-b from-gray-50 to-white rounded-[2rem] overflow-hidden mb-8 items-center justify-center p-8 relative border border-gray-50">
                  <img src={watch.images?.[0] || watch.imageUrl} className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-700" alt={watch.name || watch.title} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 rounded-[2rem]"></div>
                </div>
                
                <div className="flex-1 flex flex-col justify-between px-2">
                  <div>
                    <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-2">{watch.brand}</p>
                    <h4 className="text-xl font-serif text-[#050505] leading-tight mb-4 tracking-tighter group-hover:text-[#D4AF37] transition-colors line-clamp-2 font-black">{watch.name || watch.title}</h4>
                  </div>
                  
                  <div className="flex justify-between items-end mt-auto pt-6 border-t border-gray-100">
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Acquisition</p>
                        <p className="text-2xl text-black font-black font-serif">₹{Number(watch.offerPrice || watch.price).toLocaleString()}</p>
                    </div>
                    <motion.button 
                        whileTap={{ scale: 0.9 }} 
                        onClick={(e) => addToCart(watch, e)} 
                        className="w-14 h-14 bg-[#0A0A0A] text-[#D4AF37] rounded-2xl flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition-colors shadow-lg"
                    >
                        <Plus size={24}/>
                    </motion.button>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredAndSortedProducts.length === 0 && (
             <div className="bg-white p-16 rounded-[3rem] border border-gray-100 text-center flex flex-col items-center justify-center">
                 <Package size={48} className="text-gray-200 mb-4" />
                 <h3 className="text-3xl font-serif italic mb-2">No Timepieces Found</h3>
                 <p className="text-gray-500 uppercase tracking-widest text-[10px] font-black">Try adjusting your filters or search query.</p>
             </div>
          )}

        </div>
      </main>
    </div>
  );
}