"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

export default function Hero({ featuredProducts = [] }: { featuredProducts?: any[] }) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-100%"]);

  // 🛡️ Bulletproof Fallbacks
  const product = featuredProducts.length > 0 ? featuredProducts[0] : null;
  const imageUrl = product?.images?.[0] || product?.imageUrl || "https://www.titan.co.in/dw/image/v2/BKDD_PRD/on/demandware.static/-/Library-Sites-TitanSharedLibrary/default/dw106292b2/homepage/Main-Banner/Stellar_Desktop.jpg";
  const title = product?.name || product?.title || "ESSENTIAL RUSH";
  const brand = product?.brand || "Engineering Perfection Since 2026";
  const productLink = product?._id ? `/product/${product._id}` : "/shop";

  return (
    <section ref={containerRef} className="relative h-[120vh] bg-black overflow-hidden flex items-center justify-center">
      {/* 3D Visual Layer */}
      <motion.div style={{ y, scale }} className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black z-10" />
        <img 
          src={imageUrl}
          className="w-full h-full object-cover opacity-70"
          alt={title}
        />
      </motion.div>

      {/* Luxury Content Layer */}
      <motion.div style={{ y: textY }} className="relative z-20 text-center px-10">
        <motion.div
          initial={{ opacity: 0, letterSpacing: "2em" }}
          animate={{ opacity: 1, letterSpacing: "0.8em" }}
          transition={{ duration: 2 }}
          className="text-[#C9A24D] text-xs font-black uppercase mb-10"
        >
          {brand}
        </motion.div>

        <motion.h1 
          initial={{ clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" }}
          animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="text-white text-[8vw] md:text-[6vw] font-light leading-[0.85] tracking-tighter italic uppercase max-w-5xl mx-auto"
        >
          {title}
        </motion.h1>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-16 flex flex-col md:flex-row gap-8 justify-center items-center"
        >
          <Link href={productLink} className="bg-[#C9A24D] text-white px-16 py-6 rounded-full font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white hover:text-black transition-all duration-700 shadow-[0_0_50px_rgba(201,162,77,0.3)]">
            {product ? "Acquire Masterpiece" : "Explore Masterpieces"}
          </Link>
          <Link href="/shop" className="text-white border-b border-white/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:border-white transition-all">
            View Full Collection
          </Link>
        </motion.div>
      </motion.div>

      {/* Side HUD Info */}
      <div className="absolute bottom-20 left-20 hidden lg:block text-white/40 space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold uppercase tracking-widest">Longitude</span>
          <div className="w-20 h-[1px] bg-white/20" />
          <span className="text-[10px] font-mono italic">47.3769° N</span>
        </div>
        {product && (
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold uppercase tracking-widest">Valuation</span>
            <div className="w-20 h-[1px] bg-white/20" />
            <span className="text-[10px] font-mono italic text-[#C9A24D]">₹{Number(product.offerPrice || product.price || 0).toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>
    </section>
  );
}