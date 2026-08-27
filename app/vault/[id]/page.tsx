'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Zap, Clock, ArrowRight, 
  ChevronRight, Info, Plus, Minus, CreditCard 
} from 'lucide-react';
import Link from 'next/link';

export default function AssetRequisition() {
  const params = useParams();
  const id = params?.id;
  const [quantity, setQuantity] = useState(1);
  const accentColor = '#D4AF37';

  // Mock Data for the Asset
  const asset = {
    name: "Midnight Stealth Prototype",
    series: "V1-Imperial",
    valuation: 45000,
    specs: [
      { label: "Caliber", value: "Automatic E-77" },
      { label: "Glass", value: "Sapphire Crystal" },
      { label: "Depth", value: "50M Water Resist" },
      { label: "Armor", value: "T-316 Stainless Steel" }
    ]
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#D4AF37] selection:text-black p-6 md:p-12 lg:p-20">
      
      {/* Breadcrumb Protocol */}
      <nav className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[4px] text-gray-600 mb-12">
        <Link href="/" className="hover:text-white">Home</Link>
        <ChevronRight size={10} />
        <Link href="/vault" className="hover:text-white">Member perks</Link>
        <ChevronRight size={10} />
        <span className="text-[#D4AF37]">{asset.series}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        
        {/* LEFT: ASSET VISUALIZER */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent blur-2xl rounded-full opacity-30 group-hover:opacity-60 transition-all duration-1000"></div>
          <div className="aspect-square bg-[#0A0A0A] border border-white/5 rounded-[40px] flex items-center justify-center overflow-hidden relative">
            {/* Asset Image Placeholder */}
            <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[8px] animate-pulse">Loading image…</p>
            
            {/* Floating Spec Tags */}
            <div className="absolute bottom-8 left-8 flex gap-3">
               <div className="px-4 py-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">Limited Edition</div>
               <div className="px-4 py-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-green-500">In Stock</div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT: ACQUISITION DATA */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="space-y-10"
        >
          <header>
            <h1 className="text-5xl md:text-7xl font-serif italic mb-2 tracking-tighter">{asset.name}</h1>
            <p className="text-[#D4AF37] text-xs font-black uppercase tracking-[6px]">{asset.series}</p>
          </header>

          <div className="flex items-end gap-4">
             <span className="text-4xl font-serif font-black">₹{asset.valuation.toLocaleString('en-IN')}</span>
             <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-2">Price includes taxes</span>
          </div>

          <p className="text-gray-400 font-serif italic text-lg leading-relaxed max-w-lg">
            "Designed by <span className="text-white">Shresth Kumar</span> for those who value every fraction of a second. The Stealth Prototype combines raw Kanpur grit with modern precision engineering."
          </p>

          {/* TECHNICAL BLUEPRINT (SPECS) */}
          <div className="grid grid-cols-2 gap-4">
            {asset.specs.map((spec, i) => (
              <div key={i} className="p-5 bg-[#0A0A0A] border border-white/5 rounded-2xl group hover:border-[#D4AF37]/30 transition-all">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">{spec.label}</p>
                <p className="text-sm font-serif italic text-white group-hover:text-[#D4AF37] transition-colors">{spec.value}</p>
              </div>
            ))}
          </div>

          {/* ACQUISITION CONTROLS */}
          <div className="pt-10 space-y-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center bg-black border border-white/10 rounded-full p-1">
                <button onClick={() => setQuantity(q => Math.max(1, q-1))} className="p-3 hover:text-[#D4AF37] transition-colors"><Minus size={16}/></button>
                <span className="w-12 text-center font-mono text-sm">{quantity}</span>
                <button onClick={() => setQuantity(q => q+1)} className="p-3 hover:text-[#D4AF37] transition-colors"><Plus size={16}/></button>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">How many?</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex-1 py-6 bg-[#D4AF37] text-black font-black uppercase tracking-[5px] text-[10px] rounded-2xl hover:bg-white transition-all flex items-center justify-center gap-3">
                Buy now <ArrowRight size={14}/>
              </button>
              <button className="px-10 py-6 border border-white/10 text-white font-black uppercase tracking-[5px] text-[10px] rounded-2xl hover:bg-white hover:text-black transition-all">
                Add to cart
              </button>
            </div>
          </div>

          {/* SECURITY FOOTER */}
          <div className="pt-10 border-t border-white/5 flex items-center gap-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-[#D4AF37]" size={18} />
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">2-year warranty</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="text-[#D4AF37]" size={18} />
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Fast shipping</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ASSET STORY SECTION */}
      <section className="mt-40 pt-40 border-t border-white/5 text-center">
         <h2 className="text-4xl font-serif italic mb-10 text-gray-600">Details</h2>
         <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
            <div className="p-10 bg-[#0A0A0A] rounded-[40px] border border-white/5">
               <Info className="text-[#D4AF37] mb-6" size={24} />
               <h4 className="text-xs font-black uppercase tracking-[4px] mb-4">Materials</h4>
               <p className="text-sm text-gray-500 leading-relaxed font-serif italic">Humne high-grade stainless steel aur scratch-resistant sapphire glass ka use kiya hai jo Kanpur ki garmi aur rough use ko dhyan mein rakh kar banaya gaya hai.</p>
            </div>
            <div className="p-10 bg-[#0A0A0A] rounded-[40px] border border-white/5">
               <CreditCard className="text-[#D4AF37] mb-6" size={24} />
               <h4 className="text-xs font-black uppercase tracking-[4px] mb-4">Cashback</h4>
               <p className="text-sm text-gray-500 leading-relaxed font-serif italic">On this watch you get ₹1,200 back to your store wallet after you buy.</p>
            </div>
         </div>
      </section>
    </div>
  );
}