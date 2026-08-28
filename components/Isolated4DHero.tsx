"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from "framer-motion";
import { useRouter } from "next/navigation";
import { motionConfig } from "@/lib/motion";

interface HeroSlide {
  type?: "image" | "video";
  url?: string;
  image?: string;
  heading?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
}

interface HeroProps {
  slides?: HeroSlide[];
}

const DialMark = ({ size = 12, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.2" />
    <line x1="12" y1="12" x2="12" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="12" y1="12" x2="15.6" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export default function Isolated4DHero({ slides: propSlides }: HeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // 4D Parallax Physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [3, -3]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-3, 3]);
  const springConfig = { damping: 35, stiffness: 120, mass: 0.5 };
  const smoothRotateX = useSpring(rotateX, springConfig);
  const smoothRotateY = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const slides: HeroSlide[] = useMemo(() => {
    return propSlides && propSlides.length > 0
      ? propSlides
      : [
          {
            type: "video",
            url: "https://cdn.pixabay.com/video/2020/05/24/40092-424840899_large.mp4",
            heading: "The Masterpiece Vault",
            subtitle: "Rolex • Patek Philippe • Audemars Piguet",
            ctaText: "Explore Collection",
            ctaLink: "/shop",
          },
        ];
  }, [propSlides]);

  const currentSlide = slides[currentIndex] || slides[0];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const assetUrl = currentSlide.url || currentSlide.image || "";
  const slideType = currentSlide.type || (assetUrl.match(/\.(mp4|webm|mov)$/i) ? "video" : "image");

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => router.push(currentSlide.ctaLink || "/shop")}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") router.push(currentSlide.ctaLink || "/shop");
      }}
      aria-label="Hero Banner Carousel"
      className="relative h-[100dvh] w-full bg-[#0B0E11] cursor-pointer overflow-hidden font-sans select-none"
    >
      <motion.div
        style={{ rotateX: smoothRotateX, rotateY: smoothRotateY, transformStyle: "preserve-3d" }}
        className="w-full h-full flex items-center justify-center relative origin-center"
      >
        {/* Ambient Bezel Ring */}
        <motion.div
          aria-hidden="true"
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] md:w-[85vh] md:h-[85vh] rounded-full pointer-events-none opacity-25"
          style={{ border: "1px dashed rgba(212,175,55,0.25)" }}
        />

        {/* Background Media */}
        <div className="absolute inset-0 w-full h-full z-10 overflow-hidden bg-black pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: motionConfig.duration.slow, ease: motionConfig.ease.easeOut }}
              className="absolute inset-0 w-full h-full"
            >
              {slideType === "image" ? (
                <img src={assetUrl} alt={currentSlide.heading || "Luxury Watch Banner"} className="w-full h-full object-cover opacity-60" />
              ) : (
                <motion.video
                  key={assetUrl}
                  src={assetUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onCanPlay={() => setIsVideoLoaded(true)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isVideoLoaded ? 0.6 : 0 }}
                  transition={{ duration: 1 }}
                  className="w-full h-full object-cover"
                  aria-hidden="true"
                />
              )}
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E11] via-black/35 to-black/55 pointer-events-none" />
        </div>

        {/* Foreground Content - Fluid Responsive Sizing */}
        <div className="absolute inset-0 z-30 flex items-center justify-center text-center px-4 sm:px-6 md:px-10 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
              transition={{ duration: motionConfig.duration.slow, ease: motionConfig.ease.easeOut }}
              className="max-w-4xl mx-auto w-full flex flex-col items-center"
            >
              {currentSlide.subtitle && (
                <p className="text-[#D4AF37] text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-[5px] sm:tracking-[8px] md:tracking-[16px] mb-4 sm:mb-6 drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] px-2">
                  {currentSlide.subtitle}
                </p>
              )}

              <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-serif font-bold italic leading-[1.05] sm:leading-[0.98] tracking-tight text-white mb-6 sm:mb-8 drop-shadow-2xl max-w-[90vw]">
                {currentSlide.heading || "Masterpiece Timepieces"}
              </h1>

              <div className="inline-flex items-center gap-2.5 px-5 sm:px-7 py-3 sm:py-3.5 bg-white/10 hover:bg-white text-white hover:text-black rounded-full backdrop-blur-md transition-all duration-300 pointer-events-auto shadow-xl border border-white/20 active:scale-95">
                <DialMark size={11} className="text-[#D4AF37]" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em]">
                  {currentSlide.ctaText || "Explore Vault"}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Slide Indicators - 100% Mathematically Centered & Transparent Glass Pill */}
      {slides.length > 1 && (
        <div 
          className="absolute bottom-5 sm:bottom-8 md:bottom-10 inset-x-0 z-40 flex items-center justify-center pointer-events-none"
          style={{ transform: "none" }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto"
          >
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  i === currentIndex
                    ? "w-6 sm:w-7 h-1.5 bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.7)]"
                    : "w-1.5 h-1.5 bg-white/35 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}