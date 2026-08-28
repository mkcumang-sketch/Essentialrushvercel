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

const DialMark = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
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

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-4, 4]);
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
      className="relative h-[100dvh] w-full bg-[#0B0E11] cursor-pointer overflow-hidden font-sans"
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
          className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] h-[140vw] md:w-[85vh] md:h-[85vh] rounded-full pointer-events-none opacity-30"
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
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E11] via-black/30 to-black/50 pointer-events-none" />
        </div>

        {/* Foreground Content with Blur-to-Sharp Reveal */}
        <div className="absolute inset-0 z-30 flex items-center justify-center text-center px-6 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
              transition={{ duration: motionConfig.duration.slow, ease: motionConfig.ease.easeOut }}
              className="max-w-5xl mx-auto"
            >
              {currentSlide.subtitle && (
                <p className="text-[#D4AF37] text-[10px] md:text-xs font-black uppercase tracking-[12px] md:tracking-[20px] mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                  {currentSlide.subtitle}
                </p>
              )}

              <h1 className="text-5xl md:text-8xl lg:text-[140px] font-serif font-bold italic leading-none tracking-tight text-white mb-8 drop-shadow-2xl">
                {currentSlide.heading || "Masterpiece Timepieces"}
              </h1>

              <div className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white text-white hover:text-black rounded-full backdrop-blur-md transition-all duration-500 pointer-events-auto shadow-2xl border border-white/20">
                <DialMark size={12} className="text-[#D4AF37]" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                  {currentSlide.ctaText || "Explore Vault"}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Slide Indicators - Moved outside 3D parent for pure screen-relative centering */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center pointer-events-auto">
          <div className="flex items-center gap-2.5 md:gap-3 bg-black/50 border border-white/15 px-4 md:px-6 py-2 md:py-3 rounded-full backdrop-blur-xl shadow-2xl">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-500 cursor-pointer ${
                  i === currentIndex
                    ? "w-7 md:w-8 h-2 bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                    : "w-2 h-2 bg-white/30 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}