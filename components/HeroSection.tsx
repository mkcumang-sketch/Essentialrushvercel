"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

export default function HeroSection({ featuredProducts = [] }: { featuredProducts?: any[] }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // 🛡️ Bulletproof Fallbacks
  const product = featuredProducts.length > 0 ? featuredProducts[0] : null;
  const imageUrl = product?.images?.[0] || product?.imageUrl || "https://www.titan.co.in/dw/image/v2/BKDD_PRD/on/demandware.static/-/Library-Sites-TitanSharedLibrary/default/dw83748281/homepage/Main-Banner/Vyb-Desktop.jpg";
  const brand = product?.brand || "Exclusive Horology Since 2026";
  const title = product?.name || product?.title || "Curating Excellence.";
  const productLink = product?._id ? `/product/${product._id}` : "/shop";

  return (
    <section ref={ref} className="relative h-[110vh] flex items-center justify-center bg-[#0a0a0a] overflow-hidden">
      {/* 3D Parallax Background */}
      <motion.div style={{ y }} className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a] z-10" />
        <img 
          src={imageUrl} 
          className="w-full h-full object-cover opacity-60 scale-110"
          alt={title}
        />
      </motion.div>

      <motion.div style={{ opacity }} className="relative z-20 text-center space-y-10 px-6 max-w-5xl mx-auto">
        <motion.span 
          initial={{ letterSpacing: "1em", opacity: 0 }}
          animate={{ letterSpacing: "0.4em", opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="text-[#C9A24D] text-xs font-black uppercase inline-block"
        >
          {brand}
        </motion.span>

        <motion.h1 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-white text-6xl md:text-8xl font-light italic tracking-tighter leading-none uppercase"
        >
          {title}
        </motion.h1>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col md:flex-row gap-6 justify-center items-center"
        >
          <Link href={productLink} className="bg-[#C9A24D] text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all duration-500 shadow-2xl">
            {product ? "Acquire Masterpiece" : "Browse New Arrivals"}
          </Link>
          <Link href="/shop" className="border border-white/20 text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 backdrop-blur-md transition-all">
            The Full Collection
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator Animation */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-20"
      >
        <span className="text-white/30 text-[8px] font-bold uppercase tracking-[0.3em]">Scroll</span>
        <div className="w-[1px] h-16 bg-gradient-to-b from-[#C9A24D] to-transparent" />
      </motion.div>
    </section>
  );
}