"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ThemeConfig {
  saleActive: boolean;
  primaryColor?: string;
  saleName?: string;
  bannerText?: string;
}

export default function GlobalBanner() {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);

  useEffect(() => {
    const fetchSystemConfig = async () => {
      try {
        const res = await fetch('/api/Godmode/system');
        if (res.ok) {
          const data = await res.json();
          if (data && data.theme) setThemeConfig(data.theme);
        }
      } catch (error) {
        console.error("Global Banner Offline");
      }
    };
    
    fetchSystemConfig();
    // Optional: Har 30 second mein check karega ki Admin ne sale band toh nahi ki
    const interval = setInterval(fetchSystemConfig, 30000); 
    return () => clearInterval(interval);
  }, []);

  // Agar admin ne Sale OFF rakhi hai, toh banner nahi dikhega
  if (!themeConfig || !themeConfig.saleActive) return null;

  return (
    <div 
      className="w-full relative z-[999] py-2.5 overflow-hidden flex items-center shadow-lg"
      style={{ backgroundColor: themeConfig.primaryColor || '#E63946' }} // Admin Panel ka Color
    >
       <motion.div 
         initial={{ x: "0%" }}
         animate={{ x: "-50%" }}
         transition={{ repeat: Infinity, ease: "linear", duration: 15 }}
         className="flex whitespace-nowrap text-white text-[10px] md:text-xs font-black uppercase tracking-[6px]"
       >
          {/* Scrolling Text (Repeated for infinite effect) */}
          {[...Array(6)].map((_, i) => (
             <span key={i} className="mx-8 flex items-center gap-4">
                <span>🚨 {themeConfig.saleName}</span>
                <span>•</span>
                <span className="text-white/80">{themeConfig.bannerText}</span>
                <span>•</span>
             </span>
          ))}
       </motion.div>
    </div>
  );
}