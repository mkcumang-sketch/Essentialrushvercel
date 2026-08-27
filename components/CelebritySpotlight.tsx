"use client";

import React from "react";
import { motion } from "framer-motion";

// =========================================================
// STRICT INTERFACES (NO 'any')
// =========================================================
export interface Celebrity {
  _id?: string;
  name: string;
  watchModel?: string;
  watch?: string;
  image?: string;
  imageUrl?: string;
}

interface CelebritySpotlightProps {
  celebrities: Celebrity[];
}

// Fallback data in case the CMS/Database is empty
const DEFAULT_CELEBRITIES: Celebrity[] = [
  { 
    name: "Shah Rukh Khan", 
    watch: "Patek Philippe Nautilus", 
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2574" 
  },
  { 
    name: "Ranbir Kapoor", 
    watch: "Rolex Daytona", 
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2670" 
  }
];

export default function CelebritySpotlight({ celebrities }: CelebritySpotlightProps) {
  // Safe check to prevent crashes on empty database arrays
  const celebs = celebrities?.length > 0 ? celebrities : DEFAULT_CELEBRITIES;

  return (
    <section className="py-32 bg-[#050505] px-6 md:px-12 overflow-hidden">
      <div className="max-w-[1800px] mx-auto">
        <header className="mb-16 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-[#D4AF37] font-black uppercase tracking-[0.5em] text-[10px] mb-4"
          >
            On the wrist
          </motion.h2>
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-white font-serif italic font-bold text-5xl md:text-7xl tracking-tighter"
          >
            Stars and their watches
          </motion.h3>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {celebs.map((celeb, i) => {
            const imgSrc = celeb.image || celeb.imageUrl || "";
            const watchName = celeb.watchModel || celeb.watch || "Premium Timepiece";

            return (
              <motion.div 
                key={celeb._id || i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative aspect-[3/4] overflow-hidden group rounded-[2rem] shadow-2xl bg-white/5"
              >
                {/* Celebrity Image */}
                {imgSrc && (
                  <img 
                    src={imgSrc} 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[1.5s] ease-[0.16,1,0.3,1]" 
                    alt={`${celeb.name} wearing ${watchName}`}
                  />
                )}
                
                {/* Luxury Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-700" />

                {/* Text Info */}
                <div className="absolute bottom-0 left-0 p-8 md:p-10 w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-700 ease-[0.16,1,0.3,1]">
                  <p className="text-[#D4AF37] font-black uppercase text-[10px] tracking-[0.3em] mb-2 drop-shadow-md">
                    {watchName}
                  </p>
                  <h4 className="text-white font-serif font-bold italic text-3xl md:text-4xl drop-shadow-lg">
                    {celeb.name}
                  </h4>
                  <div className="w-0 group-hover:w-20 h-[2px] bg-[#D4AF37] mt-5 transition-all duration-700 delay-100 ease-[0.16,1,0.3,1]" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}