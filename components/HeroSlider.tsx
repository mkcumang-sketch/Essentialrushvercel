"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

// =========================================================
// STRICT INTERFACES
// =========================================================
export interface HeroSlide {
  id?: string | number;
  type?: "image" | "video";
  url?: string;
  image?: string;
  heading?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
}

interface HeroSliderProps {
  slides?: HeroSlide[];
  autoPlayInterval?: number;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 1,
    type: "video",
    url: "https://cdn.pixabay.com/video/2020/05/24/40092-424840899_large.mp4",
    heading: "The Masterpiece Vault",
    subtitle: "Rolex • Patek Philippe • Audemars Piguet",
    ctaText: "Explore Collection",
    ctaLink: "/shop"
  },
  {
    id: 2,
    type: "image",
    url: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=2000",
    heading: "Timeless Precision",
    subtitle: "Engineered for those who define time.",
    ctaText: "Discover More",
    ctaLink: "/shop"
  }
];

export default function HeroSlider({ 
  slides = [], 
  autoPlayInterval = 7000 
}: HeroSliderProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Fallback to default slides if CMS array is empty
  const activeSlides = useMemo(() => {
    return slides && slides.length > 0 ? slides : DEFAULT_SLIDES;
  }, [slides]);

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];

  // Auto-advance carousel
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [activeSlides.length, autoPlayInterval]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const assetUrl = currentSlide.url || currentSlide.image || "";
  const slideType = currentSlide.type || (assetUrl.match(/\.(mp4|webm|mov)$/i) ? "video" : "image");

  return (
    <section 
      onClick={() => router.push(currentSlide.ctaLink || "/shop")}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(currentSlide.ctaLink || "/shop"); }}
      aria-label="Hero Banner Carousel"
      className="relative h-[100dvh] w-full bg-[#0B0E11] cursor-pointer overflow-hidden font-sans"
    >
      {/* AMBIENT ROTATING BEZEL RING */}
      <motion.div
        aria-hidden="true"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] h-[140vw] md:w-[85vh] md:h-[85vh] rounded-full pointer-events-none opacity-30"
        style={{ border: '1px dashed rgba(212,175,55,0.25)' }}
      />

      {/* BACKGROUND MEDIA CONTAINER */}
      <div className="absolute inset-0 w-full h-full z-10 overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            {slideType === "image" ? (
              <img
                src={assetUrl}
                alt={currentSlide.heading || "Luxury Watch Banner"}
                className="w-full h-full object-cover opacity-60"
              />
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

        {/* Cinematic Vignette Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E11] via-black/30 to-black/50 pointer-events-none" />
      </div>

      {/* FOREGROUND TYPOGRAPHY & CTA */}
      <div className="absolute inset-0 z-30 flex items-center justify-center text-center px-6 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -30, filter: "blur(8px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-5xl mx-auto"
          >
            {currentSlide.subtitle && (
              <p className="text-[#D4AF37] text-[10px] md:text-xs font-black uppercase tracking-[15px] md:tracking-[25px] mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                {currentSlide.subtitle}
              </p>
            )}

            <h1 className="text-5xl md:text-8xl lg:text-[140px] font-serif font-bold italic leading-none tracking-tight text-white mb-8 drop-shadow-2xl">
              {currentSlide.heading || "Masterpiece Timepieces"}
            </h1>

            <div className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white text-white hover:text-black rounded-full backdrop-blur-md transition-all duration-500 pointer-events-auto shadow-2xl border border-white/20">
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                {currentSlide.ctaText || "Explore Vault"}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* NAVIGATION CONTROLS */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-10 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-16 pointer-events-none">
          {/* Previous Arrow */}
          <button
            onClick={handlePrev}
            aria-label="Previous slide"
            className="p-4 rounded-full bg-black/40 border border-white/10 text-white hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] transition-all duration-300 pointer-events-auto backdrop-blur-md"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Dots Indicator */}
          <div className="flex gap-3 bg-black/40 border border-white/10 px-6 py-3 rounded-full backdrop-blur-md pointer-events-auto">
            {activeSlides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i === currentIndex ? "w-8 bg-[#D4AF37]" : "w-2 bg-white/30 hover:bg-white/70"
                }`}
              />
            ))}
          </div>

          {/* Next Arrow */}
          <button
            onClick={handleNext}
            aria-label="Next slide"
            className="p-4 rounded-full bg-black/40 border border-white/10 text-white hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] transition-all duration-300 pointer-events-auto backdrop-blur-md"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </section>
  );
}