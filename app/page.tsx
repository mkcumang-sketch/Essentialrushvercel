"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, useVelocity } from 'framer-motion';
import {
  Menu, Search, ShieldCheck, ShoppingBag, User, Plus, Sparkles, ChevronDown, Lock, X, Star, CheckCircle,
  Instagram, Facebook, Twitter, Youtube, MapPin, Phone, Mail, Linkedin, ArrowRight, Camera, UploadCloud, RefreshCcw, Trash2, Zap
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { useHydratedCart } from '@/store/cartStoretemp';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import { 
  motionConfig, 
  fadeUpVariants, 
  drawerVariants, 
  modalVariants, 
  staggerContainerVariants, 
  staggerItemVariants,
  productCardVariants
} from '@/lib/motion';

const displayFont = Fraunces({ subsets: ['latin'], weight: ['300', '400', '600', '700', '900'], style: ['normal', 'italic'], variable: '--font-display' });
const bodyFont = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' });
const monoFont = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-mono' });

const MONO = 'font-[family-name:var(--font-mono)] tabular-nums';

// ✨ PARTICLE SYSTEM FOR MAGICAL EFFECTS
const Particle = ({ delay }: { delay: number }) => {
  const duration = 3 + Math.random() * 2;
  const size = Math.random() * 4 + 2;
  const startX = Math.random() * 100;
  const startY = Math.random() * 100;
  const endX = startX + (Math.random() - 0.5) * 100;
  const endY = startY - 100 - Math.random() * 50;
  
  return (
    <motion.div
      key={`particle-${delay}`}
      className="absolute pointer-events-none"
      initial={{ x: startX, y: startY, opacity: 1, scale: 1 }}
      animate={{ x: endX, y: endY, opacity: 0, scale: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
      style={{
        width: size,
        height: size,
        background: `rgba(212, 175, 55, ${0.3 + Math.random() * 0.5})`,
        borderRadius: '50%',
        boxShadow: `0 0 ${size * 2}px rgba(212, 175, 55, 0.6)`,
      }}
    />
  );
};

const ParticleField = () => {
  const particles = Array.from({ length: 12 });
  return (
    <div className="fixed inset-0 pointer-events-none z-[5]">
      {particles.map((_, i) => (
        <Particle key={i} delay={i * 0.1} />
      ))}
    </div>
  );
};

// 🎯 MAGNETIC BUTTON EFFECT
const MagneticButton = ({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };
  
  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };
  
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

// 🔮 ADVANCED 4D DIAL MARK
const DialMark = ({ size = 14, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-hidden="true"
    animate={animated ? { rotate: 360 } : {}}
    transition={animated ? { duration: 8, repeat: Infinity, ease: "linear" } : {}}
  >
    <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.2" />
    <motion.line
      x1="12" y1="12" x2="12" y2="6"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
      animate={animated ? { y2: [6, 5, 6] } : {}}
      transition={animated ? { duration: 2, repeat: Infinity } : {}}
    />
    <line x1="12" y1="12" x2="15.6" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </motion.svg>
);

const Eyebrow = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.p
    initial={{ opacity: 0, y: -10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[5px] ${className}`}
  >
    <DialMark size={12} className="shrink-0 opacity-70" />
    {children}
  </motion.p>
);

const LUXURY_BRANDS = ["ROLEX", "PATEK PHILIPPE", "AUDEMARS PIGUET", "RICHARD MILLE", "CARTIER", "OMEGA", "VACHERON CONSTANTIN"];

const DEFAULT_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1587836374828-cb4387df3c56?q=80&w=1000",
  "https://images.unsplash.com/photo-1508685096489-77a46807e604?q=80&w=1000",
  "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?q=80&w=1000",
  "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1000",
  "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?q=80&w=1000",
  "https://images.unsplash.com/photo-1547996160-81dfa63595dd?q=80&w=1000"
];

const DEFAULT_PROMO_VIDEOS = [
  "https://cdn.pixabay.com/video/2020/05/24/40092-424840899_large.mp4",
  "https://cdn.pixabay.com/video/2021/08/11/84687-587289569_large.mp4",
  "https://cdn.pixabay.com/video/2020/02/21/32616-393246231_large.mp4",
  "",
  ""
];

interface LuxuryToastProps {
  show: boolean;
  message: string;
  type?: 'success' | 'error';
}

interface HeroSlide {
  type: 'image' | 'video';
  url: string;
  heading?: string;
}

interface FaqItem {
  question?: string;
  q?: string;
  answer?: string;
  a?: string;
}

interface LegalPage {
  slug: string;
  title: string;
}

interface SiteConfig {
  heroSlides?: HeroSlide[];
  galleryImages?: string[];
  promotionalVideos?: string[];
  categories?: string[];
  faqs?: FaqItem[];
  socialLinks?: Record<string, string>;
  corporateInfo?: Record<string, string>;
  legalPages?: LegalPage[];
  aboutConfig?: {
    alignment?: 'left' | 'center' | 'right';
    title?: string;
    content?: string;
    boldWords?: string;
  };
}

interface Product {
  _id: string;
  name?: string;
  title?: string;
  brand: string;
  category: string;
  price: number;
  offerPrice?: number;
  imageUrl: string;
  images: string[];
  priority?: number;
  slug?: string;
  badge?: string;
  qty?: number;
  quantity?: number;
}

interface Celebrity {
  _id: string;
  name: string;
  imageUrl?: string;
  img?: string;
  description?: string;
  title?: string;
  watch?: string;
}

interface Review {
  _id?: string;
  userName: string;
  comment: string;
  rating: number;
  product: string;
  visibility: 'public' | 'private' | 'pending';
  isGhost?: boolean;
  media?: string[];
}

// ✨ ENHANCED LUXURY TOAST WITH GLASSMORPHISM
const LuxuryToast = ({ show, message, type = "success" }: LuxuryToastProps) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 50, x: "-50%", scale: 0.8 }}
        animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
        exit={{ opacity: 0, scale: 0.8, x: "-50%" }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        role="status"
        aria-live="polite"
        className="fixed bottom-10 left-1/2 z-[3000] bg-white/10 backdrop-blur-2xl border border-white/20 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] group hover:border-[#D4AF37]/50 transition-colors"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
          className={`w-10 h-10 rounded-full flex items-center justify-center ${type === 'success' ? 'bg-[#4C6B8A]/20 text-[#D4AF37]' : 'bg-red-500/20 text-red-500'}`}
        >
          {type === 'success' ? <ShoppingBag size={20} /> : <X size={20} />}
        </motion.div>
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[10px] font-black uppercase tracking-[3px] text-[#D4AF37]"
          >
            {type === 'success' ? 'Transmitted' : 'Alert'}
          </motion.p>
          <p className="text-white text-sm font-[family-name:var(--font-display)] italic">{message}</p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// 🎬 CINEMATIC BREAK WITH ADVANCED EFFECTS
const CinematicBreak = ({ videoUrl, title }: { videoUrl?: string; title?: string }) => {
  if (!videoUrl || videoUrl.trim() === '') return null;
  
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.5 }}
      className="relative w-full h-[50dvh] md:h-[70dvh] bg-[#0B0E11] overflow-hidden border-t border-b border-white/10 will-change-transform"
    >
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1),transparent_70%)]"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      
      <motion.video
        src={videoUrl}
        autoPlay loop muted playsInline preload="none"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1.15 }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        className="w-full h-full object-cover opacity-50"
        aria-hidden="true"
      />
      
      {title && (
        <div className="absolute inset-0 flex items-center justify-center text-center px-4 z-20 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, filter: "blur(20px)" }}
            whileInView={{ opacity: 1, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <h2 className="text-white text-4xl md:text-7xl font-[family-name:var(--font-display)] tracking-[8px] uppercase drop-shadow-2xl font-bold">
              {title}
            </h2>
          </motion.div>
        </div>
      )}
      
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50 z-10 pointer-events-none"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </motion.section>
  );
};

// 🌟 ULTIMATE 4D HERO WITH EXTREME EFFECTS
const Isolated4DHero = ({ config }: { config: SiteConfig | null }) => {
  const heroRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);
  const z = useTransform(mouseX, [-0.5, 0.5], [50, -50]);
  
  const springConfig = { damping: 30, stiffness: 200, mass: 0.3 };
  const smoothRotateX = useSpring(rotateX, springConfig);
  const smoothRotateY = useSpring(rotateY, springConfig);
  const smoothZ = useSpring(z, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const slides: HeroSlide[] = useMemo(() => {
    const rawSlides = config?.heroSlides || [];
    return (rawSlides.length > 0 && rawSlides[0]?.url?.length > 5)
      ? rawSlides
      : [{ type: 'video', url: 'https://cdn.pixabay.com/video/2020/05/24/40092-424840899_large.mp4', heading: 'PREMIUM WATCHES' }];
  }, [config?.heroSlides]);

  const currentSlide = slides[currentSlideIndex] || slides[0];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides]);

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => router.push('/shop')}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push('/shop'); }}
      aria-label="Shop the new collection - Premium luxury watches"
      className="relative h-[100dvh] w-full bg-[#0B0E11] cursor-pointer overflow-hidden"
    >
      {/* Animated Background Grid */}
      <motion.div className="absolute inset-0 opacity-10 z-0">
        <svg className="w-full h-full" aria-hidden="true">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
            </pattern>
          </defs>
          <motion.rect
            width="100%" height="100%" fill="url(#grid)"
            animate={{ opacity: [0.05, 0.15, 0.05] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </svg>
      </motion.div>

      <motion.div
        style={{
          rotateX: smoothRotateX,
          rotateY: smoothRotateY,
          z: smoothZ,
          transformStyle: "preserve-3d"
        }}
        className="w-full h-full flex items-center justify-center relative origin-center"
      >
        {/* Rotating Halo */}
        <motion.div
          aria-hidden="true"
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute z-20 w-[150vw] h-[150vw] md:w-[90vh] md:h-[90vh] rounded-full pointer-events-none opacity-30"
          style={{
            border: '2px dashed rgba(212,175,55,0.3)',
            transform: 'translateZ(-100px)',
            boxShadow: '0 0 40px rgba(212,175,55,0.2), inset 0 0 40px rgba(212,175,55,0.1)',
          }}
        />

        {/* Pulsing Core */}
        <motion.div
          className="absolute z-15 w-[100px] h-[100px] rounded-full pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 30px rgba(212,175,55,0.3)',
              '0 0 60px rgba(212,175,55,0.6)',
              '0 0 30px rgba(212,175,55,0.3)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transform: 'translateZ(100px)' }}
        />

        {/* Content */}
        <div className="absolute z-30 text-center pointer-events-none w-full px-4" style={{ transform: 'translateZ(120px)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlideIndex}
              initial={{ opacity: 0, filter: 'blur(15px)', scale: 0.85, y: 30 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1, y: 0 }}
              exit={{ opacity: 0, filter: 'blur(15px)', scale: 1.1, y: -30 }}
              transition={{ duration: 1.2, ease: [0.23, 1, 0.320, 1] }}
            >
              <motion.p
                className={`${MONO} text-[#D4AF37] text-[10px] md:text-xs font-bold uppercase tracking-[20px] md:tracking-[30px] mb-8 drop-shadow-[0_0_20px_rgba(212,175,55,0.8)]`}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                ESSENTIAL VAULT
              </motion.p>

              <h2 className="text-5xl md:text-[140px] lg:text-[180px] font-[family-name:var(--font-display)] leading-none tracking-tighter text-white font-black max-w-[95vw] mx-auto drop-shadow-2xl">
                {currentSlide?.heading || 'Masterpieces'}
              </h2>

              <motion.div
                className="mt-16 flex items-center justify-center gap-4"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <DialMark size={16} className="text-[#D4AF37]" animated />
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-[8px]">Enter the Vault</p>
                <Zap size={14} className="text-[#D4AF37]" />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Background Media */}
        <div className="absolute inset-0 w-full h-full z-10 overflow-hidden bg-black pointer-events-none" style={{ transform: 'translateZ(-150px)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlideIndex}
              initial={{ opacity: 0, scale: 1.15 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              {currentSlide?.type === 'image' ? (
                <img
                  src={currentSlide.url}
                  className="w-full h-full object-cover opacity-50"
                  alt={`Essential Rush Banner - Slide ${currentSlideIndex + 1}`}
                />
              ) : (
                <motion.video
                  key={currentSlide?.url}
                  src={currentSlide?.url}
                  autoPlay muted loop playsInline preload="metadata"
                  onCanPlay={() => setIsVideoLoaded(true)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isVideoLoaded ? 0.5 : 0 }}
                  transition={{ duration: 1.5 }}
                  className="w-full h-full object-cover"
                  aria-hidden="true"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Dynamic Gradient Overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"
            animate={{
              background: [
                'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0), rgba(0,0,0,0.5))',
                'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.1), rgba(0,0,0,0.4))',
                'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0), rgba(0,0,0,0.5))',
              ]
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>

        {/* Slide Indicators */}
        {slides.length > 1 && (
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 flex gap-4 bg-white/5 border border-white/20 px-8 py-4 rounded-full backdrop-blur-xl hover:bg-white/10 transition-colors"
            onClick={(e) => e.stopPropagation()}
            style={{ transform: 'translateZ(80px)' }}
            whileHover={{ scale: 1.05 }}
          >
            {slides.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setCurrentSlideIndex(i)}
                aria-label={`Show slide ${i + 1} of ${slides.length}`}
                aria-current={i === currentSlideIndex}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                className={`rounded-full transition-all duration-500 ${i === currentSlideIndex ? 'bg-[#D4AF37] w-8 md:w-10 h-2.5 md:h-3 shadow-lg shadow-[#D4AF37]/50' : 'bg-white/30 w-2.5 md:w-3 h-2.5 md:h-3 hover:bg-white/70'}`}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Cursor Glow */}
      <motion.div
        className="absolute w-32 h-32 rounded-full pointer-events-none z-[999]"
        animate={{
          x: mousePosition.x - 64,
          y: mousePosition.y - 64,
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ type: "tween", ease: "linear" }}
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.4), transparent)',
          filter: 'blur(40px)',
        }}
      />
    </section>
  );
};

// ✨ FADE UP ANIMATION
const FadeUp = ({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) => (
  <motion.div
    variants={fadeUpVariants}
    initial="hidden"
    whileInView="visible"
    transition={{ duration: 0.8, delay, ease: [0.23, 1, 0.320, 1] }}
    viewport={{ once: true, margin: "-50px" }}
    className={className}
  >
    {children}
  </motion.div>
);

// MAIN COMPONENT
export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, addItem, _hasHydrated } = useHydratedCart();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 150]);

  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [liveWatches, setLiveWatches] = useState<Product[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>(DEFAULT_GALLERY_IMAGES);
  const [promoVideos, setPromoVideos] = useState<string[]>(DEFAULT_PROMO_VIDEOS);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [liveCelebrities, setLiveCelebrities] = useState<Celebrity[]>([]);
  const [liveFaqs, setLiveFaqs] = useState<FaqItem[]>([]);
  const [flowingReviews, setFlowingReviews] = useState<Review[]>([]);
  const [socialLinks, setSocialLinks] = useState<Record<string, string> | null>(null);
  const [corporateInfo, setCorporateInfo] = useState<Record<string, string> | null>(null);
  const [legalPages, setLegalPages] = useState<LegalPage[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ userName: '', comment: '', rating: 5 });
  const [reviewMedia, setReviewMedia] = useState<string[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [honeyPot, setHoneyPot] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showLuxuryToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  }, []);

  // Zero-Latency SWR Cache
  useEffect(() => {
    const CACHE_KEY = 'essential_home_cache';

    const loadCachedData = () => {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setConfig(parsed.config);
          setGalleryImages(parsed.config?.galleryImages || DEFAULT_GALLERY_IMAGES);
          setPromoVideos(parsed.config?.promotionalVideos || DEFAULT_PROMO_VIDEOS);
          setLiveFaqs(parsed.config?.faqs || []);
          setSocialLinks(parsed.config?.socialLinks || null);
          setCorporateInfo(parsed.config?.corporateInfo || null);
          setLegalPages(parsed.config?.legalPages || []);
          setLiveCelebrities(parsed.celebrities || []);
          setLiveWatches(parsed.watches || []);
          setFlowingReviews(parsed.reviews || []);
          setIsDataLoading(false);
        } catch (e) {
          console.error("Cache parsing error", e);
        }
      }
    };

    loadCachedData();

    const fetchPersonalizedData = async () => {
      try {
        const ts = new Date().getTime();
        const [c, ai, rev, celebRes] = await Promise.all([
          fetch(`/api/cms?t=${ts}`).catch(() => null),
          fetch(`/api/products?t=${ts}`).catch(() => null),
          fetch(`/api/reviews?t=${ts}`).catch(() => null),
          fetch(`/api/celebrity?t=${ts}`).catch(() => null)
        ]);

        let newConfig = config;
        let newWatches = liveWatches;
        let newCelebs = liveCelebrities;
        let newReviews = flowingReviews;

        if (c?.ok) {
          const res = await c.json();
          newConfig = res.data || {};
          setConfig(newConfig);
          if (newConfig?.galleryImages) setGalleryImages(newConfig.galleryImages);
          if (newConfig?.promotionalVideos) setPromoVideos(newConfig.promotionalVideos);
          if (newConfig?.faqs) setLiveFaqs(newConfig.faqs);
          if (newConfig?.socialLinks) setSocialLinks(newConfig.socialLinks);
          if (newConfig?.corporateInfo) setCorporateInfo(newConfig.corporateInfo);
          if (newConfig?.legalPages) setLegalPages(newConfig.legalPages);
        }
        if (celebRes?.ok) {
          const celebData = await celebRes.json();
          if (celebData.data) {
            newCelebs = celebData.data;
            setLiveCelebrities(newCelebs);
          }
        }
        if (ai?.ok) {
          const res = await ai.json();
          newWatches = (res.data || []).sort((a: Product, b: Product) => (b.priority || 0) - (a.priority || 0));
          setLiveWatches(newWatches);
        }
        if (rev?.ok) {
          const revData = await rev.json();
          const pubRevs = (revData.data || []).filter((r: Review) => r.visibility === 'public');
          if (typeof window !== 'undefined') {
            const myLocalReviews = JSON.parse(localStorage.getItem('my_ghost_reviews') || '[]');
            const globalLocalRevs = myLocalReviews.filter((r: Review) => r.product === 'GLOBAL');
            const finalLocal = globalLocalRevs.filter((localRev: Review) =>
              !pubRevs.some((pubRev: Review) => pubRev.userName === localRev.userName && pubRev.comment === localRev.comment)
            );
            newReviews = [...finalLocal, ...pubRevs];
            setFlowingReviews(newReviews);
          } else {
            newReviews = pubRevs;
            setFlowingReviews(newReviews);
          }
        }
        
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          config: newConfig,
          watches: newWatches,
          celebrities: newCelebs,
          reviews: newReviews
        }));

        setIsDataLoading(false);
      } catch (e) {
        console.error("Background Sync Error:", e);
        setIsDataLoading(false);
      }
    };
    
    fetchPersonalizedData();
  }, []);

  const dynamicBrands = useMemo(() => {
    const brandsSet = new Set(liveWatches.map(w => w.brand).filter(Boolean));
    const arr = Array.from(brandsSet);
    return arr.length > 0 ? arr : LUXURY_BRANDS;
  }, [liveWatches]);

  const latestWatches = liveWatches.slice(0, 8);

  const categories = useMemo(() => {
    const fetchedCats = config?.categories || [];
    const aiCats = liveWatches.map(w => w.category).filter(Boolean);
    return ["ALL", ...Array.from(new Set([...fetchedCats, ...aiCats]))];
  }, [liveWatches, config]);

  const filteredWatches = useMemo(() => {
    return liveWatches.filter(w => {
      const catMatch = activeCategory === "ALL" || w.category === activeCategory;
      const safeName = w.name || w.title || "";
      const safeBrand = w.brand || "";
      const searchMatch = safeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          safeBrand.toLowerCase().includes(searchTerm.toLowerCase());
      return catMatch && searchMatch;
    });
  }, [liveWatches, activeCategory, searchTerm]);

  const addToCart = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (status === 'unauthenticated' || !session) {
      showLuxuryToast("Please Login to access the vault.", "error");
      setTimeout(() => router.push('/login'), 2000);
      return;
    }
    addItem(product as any);
    showLuxuryToast(`${product.name || product.title} added to your collection.`, "success");
    try {
      if (session?.user?.email || (session.user as any)?.phone) {
        await fetch(`/api/cart/verify-lead?t=${Date.now()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: session.user?.name || 'Guest',
            email: session.user?.email || '',
            phone: (session.user as any)?.phone || '',
            cartItems: [...items, product],
            cartTotal: [...items, product].reduce((total, item: any) => total + (Number(item.offerPrice || item.price) * (item.quantity || item.qty || 1)), 0)
          })
        });
      }
    } catch (err) {
      console.error("Lead sync failed");
    }
  };

  const handleCustomerMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.url) setReviewMedia(prev => [...prev, data.url]);
      else showLuxuryToast("Upload failed.", "error");
    } catch(err) { 
      showLuxuryToast("Network error.", "error"); 
    } finally { 
      setIsUploadingMedia(false); 
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeyPot.length > 0) return setReviewStatus('success');
    if (!reviewForm.userName || !reviewForm.comment) return showLuxuryToast("Fill details.", "error");
    setReviewStatus('submitting');
    try {
      const payload = { ...reviewForm, media: reviewMedia, product: 'GLOBAL', visibility: 'pending' };
      const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        const localReview: Review = { ...payload, _id: Date.now().toString(), visibility: 'pending', isGhost: true };
        setFlowingReviews(prev => [localReview, ...prev]);
        if (typeof window !== 'undefined') {
          const existingLocal = JSON.parse(localStorage.getItem('my_ghost_reviews') || '[]');
          localStorage.setItem('my_ghost_reviews', JSON.stringify([localReview, ...existingLocal]));
        }
        setReviewStatus('success');
        setTimeout(() => { setIsReviewModalOpen(false); setReviewStatus('idle'); setReviewForm({ userName: '', comment: '', rating: 5 }); setReviewMedia([]); }, 2000);
      } else {
        setReviewStatus('error');
        showLuxuryToast("Could not submit review. Please try again.", "error");
      }
    } catch (err) {
      setReviewStatus('error');
      showLuxuryToast("Network error. Please try again.", "error");
    }
  };

  const handleNewsletterSignup = async () => {
    const email = newsletterEmail.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail) {
      showLuxuryToast("Enter a valid email address.", "error");
      return;
    }
    setIsSubscribing(true);
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      showLuxuryToast("You're on the list. Welcome to Essential Rush.");
      setNewsletterEmail("");
    } catch (err) {
      console.error("Newsletter signup failed", err);
      showLuxuryToast("Something went wrong. Please try again.", "error");
    } finally {
      setIsSubscribing(false);
    }
  };

  if (isDataLoading) return (
    <div className="min-h-[100dvh] bg-[#0B0E11] flex flex-col items-center justify-center gap-6 overflow-hidden">
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="relative"
      >
        <DialMark size={60} className="text-[#D4AF37]" animated />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#D4AF37] border-r-[#D4AF37]"
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
      <motion.p
        className={`${MONO} text-[10px] uppercase tracking-[6px] text-white/50 animate-pulse`}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Initializing Vault...
      </motion.p>
    </div>
  );

  return (
    <div
      className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} bg-[#F6F1E7] text-black font-sans selection:bg-[#D4AF37] selection:text-black overflow-x-hidden scroll-smooth`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <ParticleField />
      <LuxuryToast show={toast.show} message={toast.message} type={toast.type} />
      
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4AF37] via-white to-[#D4AF37] origin-left z-[1000] shadow-lg shadow-[#D4AF37]/50"
        style={{ scaleX }}
      />

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="fixed inset-0 z-[1100] bg-[#0B0E11]/95 backdrop-blur-3xl flex flex-col p-8 md:p-24 overflow-hidden"
          >
            <div className="absolute inset-x-0 top-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="relative z-10 flex justify-end">
              <MagneticButton
                onClick={() => setIsMenuOpen(false)}
                className="p-4 rounded-full border border-white/20 bg-black/50 text-white hover:text-black hover:bg-[#D4AF37] hover:border-[#D4AF37] transition-all duration-500 cursor-pointer"
              >
                <motion.div whileHover={{ rotate: 90 }} transition={{ type: "spring" }}>
                  <X size={30} />
                </motion.div>
              </MagneticButton>
            </div>

            <motion.nav
              variants={staggerContainerVariants}
              initial="hidden"
              animate="visible"
              className="relative z-10 flex-1 flex flex-col justify-center space-y-8 md:space-y-12"
              aria-label="Main"
            >
              {["Home", "Shop Watches", "About Us", "My Account"].map((m) => (
                <motion.div key={m} variants={staggerItemVariants}>
                  <Link
                    href={m === "Home" ? "/" : m === "Shop Watches" ? "/shop" : m === "My Account" ? "/account" : "#ourstory"}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-white text-5xl md:text-8xl font-[family-name:var(--font-display)] font-bold hover:text-[#D4AF37] transition-colors tracking-tight block whitespace-nowrap leading-[0.95]"
                  >
                    {m}
                  </Link>
                </motion.div>
              ))}
            </motion.nav>

            <div className="relative z-10 mt-auto border-t border-white/10 pt-8 flex justify-between items-center">
              <div className="flex gap-6">
                <motion.a
                  href={socialLinks?.instagram || '#'}
                  aria-label="Instagram"
                  whileHover={{ scale: 1.2, color: '#D4AF37' }}
                  className="text-white/50 hover:text-[#D4AF37] transition-colors"
                >
                  <Instagram size={20} />
                </motion.a>
                <motion.a
                  href={socialLinks?.facebook || '#'}
                  aria-label="Facebook"
                  whileHover={{ scale: 1.2, color: '#D4AF37' }}
                  className="text-white/50 hover:text-[#D4AF37] transition-colors"
                >
                  <Facebook size={20} />
                </motion.a>
                <motion.a
                  href={socialLinks?.twitter || '#'}
                  aria-label="Twitter"
                  whileHover={{ scale: 1.2, color: '#D4AF37' }}
                  className="text-white/50 hover:text-[#D4AF37] transition-colors"
                >
                  <Twitter size={20} />
                </motion.a>
              </div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[5px]">Essential Rush</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REVIEW MODAL */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Write a review"
            className="fixed inset-0 z-[1200] bg-black/40 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-gradient-to-br from-[#0B0E11] via-[#1a1a2e] to-[#0B0E11] border border-white/10 p-8 md:p-12 rounded-[30px] w-full max-w-lg relative shadow-2xl shadow-[#D4AF37]/10"
            >
              <button
                onClick={() => setIsReviewModalOpen(false)}
                aria-label="Close review form"
                className="absolute top-6 right-6 bg-white/5 text-gray-400 rounded-full p-2 hover:bg-white hover:text-black transition-all"
              >
                <X size={20} />
              </button>

              {reviewStatus === 'success' ? (
                <motion.div
                  className="text-center py-10"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle size={60} className="text-[#D4AF37] mx-auto mb-6" />
                  </motion.div>
                  <h3 className="text-2xl font-[family-name:var(--font-display)] text-white mb-2 font-bold">
                    Review Captured
                  </h3>
                  <p className="text-gray-500 text-sm">Your thoughts have been sealed in the vault.</p>
                </motion.div>
              ) : (
                <>
                  <h3 className="text-2xl font-[family-name:var(--font-display)] font-bold text-white mb-6">
                    Write a Review
                  </h3>
                  <div className="space-y-5">
                    <input
                      type="text"
                      value={honeyPot}
                      onChange={(e) => setHoneyPot(e.target.value)}
                      name="company_website"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      className="absolute -left-[9999px] top-0 w-px h-px opacity-0 overflow-hidden"
                    />
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">
                        Name
                      </label>
                      <input
                        value={reviewForm.userName}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, userName: e.target.value })
                        }
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm text-white outline-none focus:border-[#D4AF37] focus:bg-white/10 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">
                        Rating
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            aria-label={`Rate ${star} star`}
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            className={`transition-all ${
                              reviewForm.rating >= star
                                ? 'text-[#D4AF37] drop-shadow-lg drop-shadow-[#D4AF37]/50'
                                : 'text-white/10'
                            }`}
                          >
                            <Star
                              size={28}
                              fill={reviewForm.rating >= star ? 'currentColor' : 'none'}
                            />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">
                        Review
                      </label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, comment: e.target.value })
                        }
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm text-white outline-none focus:border-[#D4AF37] focus:bg-white/10 transition-all resize-none"
                        placeholder="Share your experience..."
                      />
                    </div>
                    <div className="border-t border-white/10 pt-5">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-3 flex items-center gap-2">
                        <Camera size={14} /> Add Photo/Video
                      </label>
                      <div className="flex flex-wrap gap-4">
                        {reviewMedia.map((url: string, idx: number) => (
                          <motion.div
                            key={idx}
                            className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/20 group"
                            whileHover={{ scale: 1.05 }}
                          >
                            {url.match(/\.(mp4|webm|mov)$/i) ? (
                              <video
                                src={url}
                                className="w-full h-full object-cover"
                                playsInline
                                preload="none"
                                muted
                                aria-label={`Review media ${idx + 1}`}
                              />
                            ) : (
                              <img
                                src={url}
                                className="w-full h-full object-cover"
                                alt={`Review media ${idx + 1}`}
                              />
                            )}
                            <motion.button
                              type="button"
                              onClick={() =>
                                setReviewMedia(reviewMedia.filter((x) => x !== url))
                              }
                              aria-label={`Remove media ${idx + 1}`}
                              className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                              whileHover={{ scale: 1.1 }}
                            >
                              <Trash2 size={14} />
                            </motion.button>
                          </motion.div>
                        ))}
                        <label className="relative w-16 h-16 rounded-xl border border-white/10 hover:border-[#D4AF37] flex flex-col items-center justify-center cursor-pointer bg-white/5 hover:bg-white/10 transition-all">
                          {isUploadingMedia ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                              <RefreshCcw size={16} className="text-[#D4AF37]" />
                            </motion.div>
                          ) : (
                            <>
                              <UploadCloud size={16} className="text-gray-400" />
                              <span className="text-[8px] font-bold text-gray-400 uppercase mt-1">
                                Upload
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleCustomerMediaUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isUploadingMedia}
                            aria-label="Upload photo or video"
                          />
                        </label>
                      </div>
                    </div>
                    <motion.button
                      onClick={handleReviewSubmit}
                      disabled={reviewStatus === 'submitting' || isUploadingMedia}
                      whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(212,175,55,0.4)' }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-[#D4AF37] text-black font-black uppercase tracking-[3px] rounded-xl transition-all disabled:opacity-50 text-xs mt-4 shadow-lg shadow-[#D4AF37]/20"
                    >
                      {reviewStatus === 'submitting' ? 'Transmitting...' : 'Submit Review'}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <motion.div
        className="bg-[#0B0E11] text-white py-2.5 px-4 md:px-12 flex justify-between items-center text-[8px] md:text-[9px] font-bold uppercase tracking-[3px] z-[601] relative border-b border-white/5"
        animate={{ backgroundColor: ['#0B0E11', '#1a1a2e', '#0B0E11'] }}
        transition={{ duration: 8, repeat: Infinity }}
      >
        <div className="flex items-center gap-2">
          <Lock size={10} className="text-[#D4AF37]" /> Secure Checkout
        </div>
        <div className="hidden sm:block text-gray-400">Complimentary Global Shipping</div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={10} className="text-[#D4AF37]" /> Authenticity Guarantee
        </div>
      </motion.div>

      {/* NAVIGATION */}
      <nav
        className={`fixed w-full z-[600] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled
            ? 'top-0 h-16 md:h-20 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm'
            : 'top-9 md:top-10 h-20 md:h-28 bg-transparent'
        }`}
      >
        <div className="flex items-center justify-between px-4 md:px-12 h-full relative">
          <div className="flex items-center gap-6">
            <motion.button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 -ml-2 rounded-full transition-all active:scale-95 ${
                isScrolled
                  ? 'text-black hover:bg-gray-100'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Menu size={24} />
            </motion.button>
            <div
              className={`hidden lg:flex gap-8 text-[10px] font-bold uppercase tracking-[3px] transition-colors ${
                isScrolled ? 'text-gray-600' : 'text-white/80'
              }`}
            >
              <motion.div whileHover={{ color: '#D4AF37' }}>
                <Link href="/shop" className="transition-colors">
                  Collection
                </Link>
              </motion.div>
              <motion.div whileHover={{ color: '#D4AF37' }}>
                <Link href="#ourstory" className="transition-colors">
                  Heritage
                </Link>
              </motion.div>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="absolute left-1/2 -translate-x-1/2"
          >
            <Link href="/" className="flex flex-col items-center group">
              <h1
                className={`text-xl md:text-3xl font-[family-name:var(--font-display)] font-black tracking-[6px] md:tracking-[10px] uppercase transition-all duration-500 ${
                  isScrolled
                    ? 'text-black group-hover:text-[#D4AF37]'
                    : 'text-white drop-shadow-md group-hover:text-[#D4AF37]'
                }`}
              >
                Essential
              </h1>
            </Link>
          </motion.div>

          <div className="flex items-center gap-4 md:gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/account"
                className={`hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-[2px] transition-all border ${
                  isScrolled
                    ? 'bg-black text-white border-black hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-black'
                    : 'bg-white/10 text-white border-white/20 backdrop-blur-md hover:bg-white hover:text-black'
                }`}
              >
                <User size={14} /> Vault
              </Link>
            </motion.div>

            <motion.button
              type="button"
              className="relative cursor-pointer group p-2 bg-transparent"
              onClick={() => router.push('/checkout')}
              aria-label={`View cart, ${_hasHydrated ? items.length : 0} items`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <ShoppingBag
                  size={20}
                  className={`transition-transform ${
                    isScrolled ? 'text-black' : 'text-white'
                  }`}
                />
              </motion.div>
              {_hasHydrated && items.length > 0 && (
                <motion.span
                  className="absolute -top-1 -right-1 bg-[#D4AF37] text-black w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shadow-md border border-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {items.length}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <Isolated4DHero config={config || {}} />

      {/* CINEMATIC BREAK 1 */}
      <CinematicBreak videoUrl={promoVideos[0]} title="Precision." />

      {/* BRANDS CAROUSEL */}
      <section className="bg-white py-12 border-b border-gray-100 overflow-hidden relative z-[40]">
        <div className="flex w-[200%]">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ ease: "linear", duration: 60, repeat: Infinity }}
            className="flex gap-16 md:gap-32 items-center px-10 will-change-transform"
          >
            {dynamicBrands.concat(dynamicBrands).map((b: string, i: number) => (
              <motion.div
                key={`brand-${i}`}
                className="flex items-center gap-6 group cursor-default"
                whileHover={{ scale: 1.1 }}
              >
                <span className="text-2xl md:text-4xl font-[family-name:var(--font-display)] italic tracking-tighter whitespace-nowrap text-gray-200 group-hover:text-[#D4AF37] group-hover:drop-shadow-lg group-hover:drop-shadow-[#D4AF37]/50 transition-all duration-500">
                  {b}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* NEW ARRIVALS SECTION */}
      <section className="py-24 md:py-40 relative overflow-hidden bg-[#F6F1E7]">
        <div className="relative z-10 px-6 md:px-16 max-w-[1600px] mx-auto mb-16 flex justify-between items-end">
          <div>
            <Eyebrow className="text-gray-500 mb-3">Just Landed</Eyebrow>
            <h2 className="text-5xl md:text-7xl font-[family-name:var(--font-display)] text-black tracking-tight font-bold drop-shadow-sm">
              New Arrivals.
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-[10px] font-black uppercase tracking-[3px] border-b-2 border-black pb-1 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all hidden md:flex items-center gap-2"
          >
            Explore Collection <ArrowRight size={14} />
          </Link>
        </div>

        <div className="relative z-10 w-full overflow-x-auto snap-x snap-mandatory scroll-pl-6 md:scroll-pl-16 pb-12 hide-scrollbar">
          <div className="flex gap-6 md:gap-10 px-6 md:px-16 w-max">
            {latestWatches.length > 0 ? (
              latestWatches.map((watch: Product, i: number) => (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  key={`horiz-${i}`}
                  onClick={() => router.push(`/product/${watch.slug || watch._id}`)}
                  whileHover={{ y: -8 }}
                  className="w-[280px] md:w-[380px] shrink-0 snap-start bg-white rounded-[30px] p-6 border border-gray-100 group hover:border-[#D4AF37]/50 hover:shadow-[0_30px_60px_rgba(212,175,55,0.15)] transition-all duration-500 cursor-pointer flex flex-col will-change-transform"
                >
                  <div className="h-64 md:h-80 bg-[#F6F1E7]/50 rounded-2xl mb-6 p-8 flex items-center justify-center relative overflow-hidden">
                    {watch.badge && (
                      <span className="absolute top-4 left-4 bg-black text-[#D4AF37] text-[9px] font-black uppercase px-3 py-1.5 rounded-full z-10 shadow-sm">
                        {watch.badge}
                      </span>
                    )}
                    <img
                      src={watch.imageUrl || (watch.images && watch.images[0])}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-1000 ease-[0.16,1,0.3,1]"
                      loading={i < 2 ? "eager" : "lazy"}
                      alt={`${watch.brand} ${watch.name || watch.title} - Premium Luxury Timepiece`}
                      decoding="async"
                    />
                  </div>
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[3px] mb-2">
                    {watch.brand}
                  </p>
                  <h4 className="text-xl md:text-2xl font-[family-name:var(--font-display)] text-black leading-tight line-clamp-1 mb-6 font-bold group-hover:text-[#D4AF37] transition-colors">
                    {watch.name || watch.title}
                  </h4>
                  <div className="mt-auto flex justify-between items-center border-t border-gray-100 pt-5">
                    <p className="font-[family-name:var(--font-mono)] tabular-nums font-bold text-xl md:text-2xl text-black">
                      ₹{Number(watch.offerPrice || watch.price).toLocaleString()}
                    </p>
                    <motion.button
                      onClick={(e) => addToCart(watch, e)}
                      aria-label={`Add ${watch.name || watch.title} to cart`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-12 h-12 bg-black text-white rounded-full hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg flex items-center justify-center"
                    >
                      <Plus size={20} />
                    </motion.button>
                  </div>
                </motion.div>
              ))
            ) : (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`skel-${i}`}
                  className="w-[280px] md:w-[380px] shrink-0 snap-start bg-white rounded-[30px] p-6 border border-gray-100 shadow-sm animate-pulse flex flex-col"
                >
                  <div className="h-64 md:h-80 bg-gray-100 rounded-2xl mb-6" />
                  <div className="h-3 w-1/3 bg-gray-200 rounded mb-3" />
                  <div className="h-6 w-3/4 bg-gray-200 rounded mb-4" />
                  <div className="mt-auto flex justify-between items-center border-t border-gray-100 pt-5">
                    <div className="h-6 w-1/3 bg-gray-200 rounded" />
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CINEMATIC BREAK 2 */}
      <CinematicBreak videoUrl={promoVideos[1]} title="Elegance." />

      {/* SHOP SECTION */}
      <section id="ourcollection" className="py-24 md:py-40 relative overflow-hidden bg-white">
        <div className="relative z-10 px-6 md:px-16 max-w-[1600px] mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-20 border-b border-gray-200 pb-10 gap-8">
            <div>
              <Eyebrow className="text-gray-500 mb-3">Discover</Eyebrow>
              <h2 className="text-5xl md:text-7xl font-[family-name:var(--font-display)] tracking-tight text-black font-bold">
                The Shop.
              </h2>
            </div>
            <div className="w-full lg:w-auto flex flex-col md:flex-row items-end gap-6">
              <div className="relative w-full md:w-80">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search the vault..."
                  aria-label="Search watches"
                  className="w-full pl-12 pr-12 py-4 rounded-full text-sm font-medium bg-gray-50 border border-gray-200 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 transition-all"
                />
                {searchTerm && (
                  <motion.button
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                    whileHover={{ rotate: 90 }}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  >
                    <X size={16} />
                  </motion.button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-start w-full md:w-auto">
                {categories.map((cat: string, i: number) => (
                  <motion.button
                    key={`cat-${i}`}
                    onClick={() => setActiveCategory(cat)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-6 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[3px] transition-all duration-300 ${
                      activeCategory === cat
                        ? 'bg-black text-white shadow-lg shadow-black/50'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-black hover:text-black'
                    }`}
                  >
                    {cat}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10">
            {filteredWatches.length === 0 && !isDataLoading ? (
              <div className="col-span-full py-40 text-center flex flex-col items-center justify-center bg-[#F6F1E7] rounded-[40px] border border-gray-200">
                <Sparkles size={50} className="text-[#D4AF37] mb-6" />
                <h3 className="text-3xl font-[family-name:var(--font-display)] text-black mb-3 font-bold">
                  Vault is Empty
                </h3>
                <p className="text-gray-500 text-sm max-w-sm px-4">
                  Try adjusting your search or category filters to explore the collection.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredWatches.map((watch: Product, i: number) => (
                  <motion.div
                    layout
                    variants={productCardVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover="hover"
                    key={watch._id || i}
                    className="group bg-[#F6F1E7]/30 p-6 md:p-8 rounded-[30px] border border-gray-100 hover:border-[#D4AF37]/50 hover:bg-white hover:shadow-[0_30px_60px_rgba(212,175,55,0.12)] transition-all duration-500 flex flex-col h-full relative cursor-pointer"
                    onClick={() => router.push(`/product/${watch.slug || watch._id}`)}
                  >
                    {watch.badge && (
                      <span className="absolute top-6 left-6 bg-black text-[#D4AF37] text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full z-20 shadow-sm">
                        {watch.badge}
                      </span>
                    )}
                    <div className="flex aspect-square bg-white rounded-2xl overflow-hidden mb-8 items-center justify-center p-8 relative will-change-transform shadow-sm group-hover:shadow-lg transition-all">
                      <img
                        src={watch.imageUrl || (watch.images && watch.images[0])}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-125 transition-transform duration-1000 ease-[0.16,1,0.3,1]"
                        loading="lazy"
                        alt={`${watch.brand} ${watch.name || watch.title} - Premium Watch`}
                        decoding="async"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-2">
                          {watch.brand}
                        </p>
                        <h4 className="text-xl font-[family-name:var(--font-display)] text-black leading-snug mb-4 font-bold line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                          {watch.name || watch.title}
                        </h4>
                      </div>
                      <div className="flex justify-between items-end mt-auto pt-5 border-t border-gray-200">
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[2px] mb-1">
                            Valuation
                          </p>
                          <p className="font-[family-name:var(--font-mono)] tabular-nums text-2xl text-black font-bold tracking-tight">
                            ₹{Number(watch.offerPrice || watch.price).toLocaleString()}
                          </p>
                        </div>
                        <motion.button
                          onClick={(e) => addToCart(watch, e)}
                          aria-label={`Add ${watch.name || watch.title} to cart`}
                          whileHover={{ scale: 1.1, rotate: 5, backgroundColor: '#D4AF37' }}
                          whileTap={{ scale: 0.9 }}
                          className="w-12 h-12 bg-black text-white rounded-full transition-all flex items-center justify-center shadow-lg active:scale-95"
                        >
                          <Plus size={20} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </section>

      {/* CINEMATIC BREAK 3 */}
      <CinematicBreak videoUrl={promoVideos[2]} title="Mastery." />

      {/* GALLERY SECTION */}
      <section className="py-24 md:py-32 bg-[#0B0E11] text-white hidden lg:flex items-center justify-center relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08),transparent_60%)]"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <div className="max-w-[1600px] mx-auto flex items-center justify-center gap-12 px-10 relative z-10">
          <motion.div style={{ y: y1 }} className="w-1/3 flex flex-col gap-12 pt-20 will-change-transform">
            <motion.img
              src={galleryImages[0]}
              className="w-full h-[450px] object-cover rounded-[40px] shadow-2xl hover:shadow-[0_40px_80px_rgba(212,175,55,0.2)]"
              alt="Essential Rush luxury lifestyle photography"
              loading="lazy"
              decoding="async"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5 }}
            />
            <motion.img
              src={galleryImages[3]}
              className="w-full h-[350px] object-cover rounded-[40px] shadow-2xl hover:shadow-[0_40px_80px_rgba(212,175,55,0.2)]"
              alt="Essential Rush luxury lifestyle photography"
              loading="lazy"
              decoding="async"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
          <div className="w-1/3 flex flex-col gap-12">
            <div className="text-center py-16 px-6">
              <FadeUp>
                <Eyebrow className="text-[#D4AF37] mb-6 justify-center">Heritage</Eyebrow>
              </FadeUp>
              <FadeUp delay={0.1}>
                <h2 className="text-6xl xl:text-8xl font-[family-name:var(--font-display)] tracking-tight mb-8 font-bold text-white leading-none">
                  Modern <br />
                  <span className="text-gray-500 italic">Classics.</span>
                </h2>
              </FadeUp>
            </div>
            <motion.img
              src={galleryImages[2]}
              className="w-full h-[550px] object-cover rounded-[50px] shadow-2xl border border-white/10 hover:shadow-[0_40px_80px_rgba(212,175,55,0.2)]"
              alt="Essential Rush luxury lifestyle photography"
              loading="lazy"
              decoding="async"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <motion.div style={{ y: y2 }} className="w-1/3 flex flex-col gap-12 pt-40 will-change-transform">
            <motion.img
              src={galleryImages[4]}
              className="w-full h-[500px] object-cover rounded-[40px] shadow-2xl hover:shadow-[0_40px_80px_rgba(212,175,55,0.2)]"
              alt="Essential Rush luxury lifestyle photography"
              loading="lazy"
              decoding="async"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5 }}
            />
            <motion.img
              src={galleryImages[5]}
              className="w-full h-[400px] object-cover rounded-[40px] shadow-2xl hover:shadow-[0_40px_80px_rgba(212,175,55,0.2)]"
              alt="Essential Rush luxury lifestyle photography"
              loading="lazy"
              decoding="async"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="ourstory" className="py-32 md:py-48 bg-[#F6F1E7] text-black relative overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"
          animate={{ y: [0, 50, 0], x: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <div className="max-w-[1400px] mx-auto px-6 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <div
            className={
              config?.aboutConfig?.alignment === 'right'
                ? 'lg:order-2 text-right'
                : config?.aboutConfig?.alignment === 'center'
                ? 'text-center col-span-full max-w-4xl mx-auto'
                : 'text-left'
            }
          >
            <FadeUp>
              <p className="text-black/50 text-[10px] font-bold uppercase tracking-[10px] mb-8 flex items-center gap-4">
                <span className="w-8 h-px bg-black/30 hidden md:block" />
                <DialMark size={12} className="opacity-70 shrink-0" />{' '}
                {config?.aboutConfig?.title || 'ABOUT US'}
              </p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="text-6xl md:text-[100px] font-[family-name:var(--font-display)] leading-[0.9] tracking-tight mb-10 text-black font-bold">
                Built to <br />
                <span className="text-gray-400 italic">Last.</span>
              </h2>
            </FadeUp>
            <FadeUp delay={0.2}>
              <p className="text-gray-600 text-xl md:text-3xl leading-relaxed font-[family-name:var(--font-display)] max-w-3xl">
                {(config?.aboutConfig?.content ||
                  "We bring the world's best watches directly to you. Every piece is guaranteed authentic and checked for quality.").split(' ')
                  .map((word: string, idx: number) => {
                    const isBold = config?.aboutConfig?.boldWords
                      ?.split(',')
                      .map((w: string) => w.trim().toLowerCase())
                      .includes(word.toLowerCase().replace(/[^a-zA-Z]/g, ''));
                    return isBold ? (
                      <strong key={`bold-${idx}`} className="font-bold text-black">
                        {' '}
                        {word}{' '}
                      </strong>
                    ) : (
                      <span key={`reg-${idx}`}> {word} </span>
                    );
                  })}
              </p>
            </FadeUp>
          </div>
          {config?.aboutConfig?.alignment !== 'center' && (
            <FadeUp delay={0.3} className="h-[500px] md:h-[700px] w-full bg-black/5 rounded-[50px] overflow-hidden shadow-2xl hover:shadow-[0_40px_80px_rgba(0,0,0,0.3)]">
              <motion.img
                src="https://images.unsplash.com/photo-1547996160-81dfa63595dd?q=80&w=1200"
                className="w-full h-full object-cover"
                alt="Essential Rush brand story and heritage"
                loading="lazy"
                decoding="async"
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.8 }}
              />
            </FadeUp>
          )}
        </div>
      </section>

      {/* CINEMATIC BREAK 4 */}
      <CinematicBreak videoUrl={promoVideos[3]} />

      {/* CELEBRITIES SECTION */}
      <section className="py-32 md:py-48 bg-white text-black relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-6 md:px-10 relative z-10 mb-24 text-center">
          <FadeUp>
            <Eyebrow className="text-[#D4AF37] mb-6 justify-center">Worn By Leaders</Eyebrow>
            <h2 className="text-6xl md:text-[120px] font-[family-name:var(--font-display)] text-black tracking-tight leading-none font-bold">
              Trusted Faces.
            </h2>
          </FadeUp>
        </div>
        <div className="relative w-full overflow-hidden flex z-20 py-10">
          <div className="absolute left-0 top-0 bottom-0 w-20 md:w-[300px] bg-gradient-to-r from-white to-transparent z-30 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 md:w-[300px] bg-gradient-to-l from-white to-transparent z-30 pointer-events-none" />
          <div className="flex w-[300%] md:w-[200%]">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ ease: "linear", duration: 50, repeat: Infinity }}
              className="flex gap-8 md:gap-16 items-stretch px-10 will-change-transform"
            >
              {liveCelebrities.length === 0 ? (
                [1, 2, 3, 4, 5].map((_, i) => (
                  <div
                    key={i}
                    className="w-[280px] md:w-[400px] aspect-[3/4] bg-gray-100 rounded-[40px] animate-pulse"
                  />
                ))
              ) : (
                Array(4)
                  .fill(liveCelebrities)
                  .flat()
                  .map((celeb: Celebrity, i: number) => (
                    <motion.div
                      key={`${celeb._id}-${i}`}
                      className="w-[280px] md:w-[420px] aspect-[3/4] relative group rounded-[40px] overflow-hidden shrink-0 shadow-2xl cursor-pointer hover:shadow-[0_40px_80px_rgba(212,175,55,0.15)]"
                      whileHover={{ scale: 1.05 }}
                    >
                      {(celeb.imageUrl || celeb.img) && (
                        <img
                          src={celeb.imageUrl || celeb.img || ""}
                          className="w-full h-full object-cover group-hover:scale-110 transition-all duration-[1.5s] ease-[0.16,1,0.3,1] relative z-10"
                          alt={celeb.name}
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-10 flex flex-col justify-end z-20 opacity-90 group-hover:opacity-100 transition-opacity"
                        animate={{ backgroundImage: ['linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.2), transparent)', 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.3), transparent)', 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.2), transparent)'] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        <h4 className="text-white text-4xl font-[family-name:var(--font-display)] mb-2 font-bold translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                          {celeb.name}
                        </h4>
                        <span className="text-[10px] uppercase font-bold tracking-[3px] text-[#D4AF37] translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                          {celeb.title || celeb.watch}
                        </span>
                      </motion.div>
                    </motion.div>
                  ))
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section id="reviews" className="py-32 md:py-48 relative overflow-hidden bg-[#0B0E11] text-white">
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.08),transparent_50%)]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <div className="text-center mb-24 relative z-10 px-6">
          <FadeUp>
            <h2 className="text-5xl md:text-[100px] font-[family-name:var(--font-display)] mb-8 tracking-tight font-bold">
              The Verdict.
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <motion.button
              onClick={() => setIsReviewModalOpen(true)}
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(212,175,55,0.4)' }}
              whileTap={{ scale: 0.95 }}
              className="mt-4 px-12 py-5 bg-[#D4AF37] text-black rounded-full text-[10px] font-black uppercase tracking-[4px] hover:bg-white transition-all flex items-center justify-center mx-auto gap-3 shadow-[0_0_30px_rgba(212,175,55,0.3)]"
            >
              <Camera size={16} /> Write a Review
            </motion.button>
          </FadeUp>
        </div>
        {flowingReviews.length > 0 && (
          <div className="flex w-[300%] md:w-[200%] relative z-10">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ ease: "linear", duration: 60, repeat: Infinity }}
              className="flex gap-8 md:gap-12 items-stretch px-12 will-change-transform"
            >
              {flowingReviews.concat(flowingReviews).map((rev: Review, i: number) => (
                <motion.div
                  key={i}
                  className="flex-shrink-0 w-[320px] md:w-[500px] bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-14 rounded-[50px] flex flex-col justify-between shadow-2xl hover:bg-white/10 hover:border-[#D4AF37]/30 transition-all duration-500"
                  whileHover={{ y: -8, boxShadow: '0 30px 60px rgba(212,175,55,0.2)' }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="font-[family-name:var(--font-display)] text-3xl font-bold mb-2 text-white">
                          {rev.userName}
                        </p>
                        <p className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-[3px] flex items-center gap-2">
                          <ShieldCheck size={12} /> Verified Buyer
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 text-[#D4AF37] mb-8">
                      {[...Array(rev.rating)].map((_, idx) => (
                        <motion.div
                          key={idx}
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 0.5, delay: idx * 0.1 }}
                        >
                          <Star size={18} fill="currentColor" />
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-gray-300 font-[family-name:var(--font-display)] text-xl leading-relaxed line-clamp-4">
                      "{rev.comment}"
                    </p>
                    {rev.media && rev.media.length > 0 && (
                      <div className="flex gap-4 overflow-x-auto pt-8 mt-8 border-t border-white/10 hide-scrollbar">
                        {rev.media.map((mediaUrl: string, mIdx: number) =>
                          mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
                            <video
                              key={mIdx}
                              src={mediaUrl}
                              playsInline
                              preload="none"
                              muted
                              className="h-20 w-20 object-cover rounded-2xl border border-white/20 shrink-0 hover:border-[#D4AF37]/50 transition-all"
                            />
                          ) : (
                            <img
                              key={mIdx}
                              src={mediaUrl}
                              className="h-20 w-20 object-cover rounded-2xl border border-white/20 shrink-0 hover:border-[#D4AF37]/50 transition-all"
                              alt={`${rev.userName}'s review media ${mIdx + 1}`}
                              loading="lazy"
                              decoding="async"
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-32 md:py-48 relative overflow-hidden bg-[#F6F1E7]">
        <motion.div
          className="absolute -bottom-40 -right-40 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"
          animate={{ y: [0, 50, 0], x: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <div className="max-w-[1200px] mx-auto px-8 relative z-10">
          <FadeUp>
            <h2 className="text-6xl md:text-[100px] font-[family-name:var(--font-display)] text-center mb-24 text-black tracking-tight font-bold drop-shadow-sm">
              Help & FAQs.
            </h2>
          </FadeUp>
          <div className="space-y-6">
            {liveFaqs.length === 0 ? (
              <p className="text-center text-gray-500 font-serif text-xl">No questions yet.</p>
            ) : (
              liveFaqs.map((faq: FaqItem, i: number) => (
                <motion.div
                  key={i}
                  className={`bg-white rounded-[40px] border transition-all duration-700 ease-[0.16,1,0.3,1] ${
                    openFaq === i
                      ? 'border-[#D4AF37] shadow-[0_20px_50px_rgba(212,175,55,0.1)]'
                      : 'border-gray-200 hover:border-black'
                  }`}
                  whileHover={{ scale: 1.01 }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    className="w-full p-8 md:p-12 text-left flex justify-between items-center group"
                  >
                    <span className="font-[family-name:var(--font-display)] font-bold text-2xl md:text-4xl pr-8 text-black group-hover:text-[#D4AF37] transition-colors">
                      {faq.question || faq.q}
                    </span>
                    <motion.div
                      className={`p-4 rounded-full transition-all duration-700 ${
                        openFaq === i
                          ? 'bg-[#D4AF37] text-black'
                          : 'bg-gray-50 text-gray-400 border border-gray-200 group-hover:border-black group-hover:text-black'
                      }`}
                      animate={{ rotate: openFaq === i ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <ChevronDown size={28} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.6, ease: [0.23, 1, 0.320, 1] }}
                        className="px-8 md:px-12 pb-12"
                      >
                        <p className="text-gray-600 font-sans text-lg md:text-xl leading-relaxed border-t border-gray-100 pt-8">
                          {faq.answer || faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0B0E11] text-white pt-32 pb-12 relative z-20 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.08),transparent_50%)]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 6, repeat: Infinity }}
          style={{ pointerEvents: 'none' }}
        />
        <div className="max-w-[1600px] mx-auto px-8 md:px-20 relative z-10">
          <div className="flex flex-col md:flex-row justify-between border-b border-white/10 pb-20 mb-20 gap-16">
            <div>
              <h3 className="text-5xl md:text-7xl font-[family-name:var(--font-display)] font-bold text-white tracking-tight mb-6">
                Stay Updated.
              </h3>
              <p className="text-gray-400 text-lg">
                Get exclusive access to new timepieces and vault sales.
              </p>
            </div>
            <motion.div
              className="flex w-full md:w-auto h-max self-center border-b border-gray-600 focus-within:border-[#D4AF37] transition-all pb-3"
              whileFocus={{ borderColor: '#D4AF37' }}
            >
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNewsletterSignup();
                }}
                placeholder="Your Email Address"
                aria-label="Email address for newsletter"
                className="bg-transparent p-4 text-white outline-none text-xl w-full md:w-[400px] placeholder:text-gray-600 font-serif italic"
              />
              <motion.button
                onClick={handleNewsletterSignup}
                disabled={isSubscribing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-[#D4AF37] font-black uppercase tracking-[3px] text-[10px] px-8 hover:text-white transition-all disabled:opacity-50"
              >
                {isSubscribing ? 'Joining...' : 'Subscribe'}
              </motion.button>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-16 mb-24 text-left">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[5px] text-[#D4AF37] mb-10">
                Shop
              </h4>
              <ul className="space-y-5 text-sm font-medium text-gray-400">
                <li>
                  <Link href="/shop" className="hover:text-white hover:text-[#D4AF37] transition-all">
                    All Watches
                  </Link>
                </li>
                <li>
                  <Link
                    href="/checkout"
                    className="hover:text-white hover:text-[#D4AF37] transition-all"
                  >
                    My Cart
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[5px] text-[#D4AF37] mb-10">
                Help
              </h4>
              <ul className="space-y-5 text-sm font-medium text-gray-400">
                <li>
                  <Link
                    href="/account"
                    className="hover:text-white hover:text-[#D4AF37] transition-all"
                  >
                    My Account
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="hover:text-white hover:text-[#D4AF37] transition-all">
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-[10px] font-black uppercase tracking-[5px] text-[#D4AF37] mb-10">
                Legal
              </h4>
              <ul className="space-y-5 text-sm font-medium text-gray-400">
                {legalPages.length === 0 ? (
                  <li>Coming soon</li>
                ) : (
                  legalPages.map((page: LegalPage, i: number) => (
                    <li key={i}>
                      <Link
                        href={`/policies/${page.slug}`}
                        className="hover:text-white hover:text-[#D4AF37] transition-all"
                      >
                        {page.title}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-[10px] font-black uppercase tracking-[5px] text-[#D4AF37] mb-10">
                Contact
              </h4>
              <div className="space-y-5 text-sm font-medium text-gray-400">
                <p className="text-white font-serif text-xl">
                  {corporateInfo?.companyName || 'Essential Rush'}
                </p>
                <motion.p
                  className="flex items-center gap-4 hover:text-white hover:text-[#D4AF37] transition-colors cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  <Mail size={18} /> {corporateInfo?.email || 'support@essential.com'}
                </motion.p>
                {corporateInfo?.phone && (
                  <motion.p
                    className="flex items-center gap-4 hover:text-white hover:text-[#D4AF37] transition-colors cursor-pointer"
                    whileHover={{ x: 5 }}
                  >
                    <Phone size={18} /> {corporateInfo.phone}
                  </motion.p>
                )}
                {corporateInfo?.address && (
                  <p className="flex items-start gap-4 leading-relaxed">
                    <MapPin size={18} className="mt-1 shrink-0" />{' '}
                    <span>{corporateInfo.address}</span>
                  </p>
                )}
                <div className="flex gap-6 mt-10 pt-10 border-t border-white/10">
                  <motion.a
                    href={socialLinks?.instagram || '#'}
                    aria-label="Instagram"
                    whileHover={{ scale: 1.3, color: '#D4AF37' }}
                  >
                    <Instagram className="text-gray-500 cursor-pointer" size={24} />
                  </motion.a>
                  <motion.a
                    href={socialLinks?.facebook || '#'}
                    aria-label="Facebook"
                    whileHover={{ scale: 1.3, color: '#D4AF37' }}
                  >
                    <Facebook className="text-gray-500 cursor-pointer" size={24} />
                  </motion.a>
                  <motion.a
                    href={socialLinks?.twitter || '#'}
                    aria-label="Twitter"
                    whileHover={{ scale: 1.3, color: '#D4AF37' }}
                  >
                    <Twitter className="text-gray-500 cursor-pointer" size={24} />
                  </motion.a>
                  <motion.a
                    href={socialLinks?.youtube || '#'}
                    aria-label="YouTube"
                    whileHover={{ scale: 1.3, color: '#D4AF37' }}
                  >
                    <Youtube className="text-gray-500 cursor-pointer" size={24} />
                  </motion.a>
                  <motion.a
                    href={socialLinks?.linkedin || '#'}
                    aria-label="LinkedIn"
                    whileHover={{ scale: 1.3, color: '#D4AF37' }}
                  >
                    <Linkedin className="text-gray-500 cursor-pointer" size={24} />
                  </motion.a>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black uppercase tracking-[5px] text-gray-600">
              © {new Date().getFullYear()} ESSENTIAL RUSH. ALL RIGHTS RESERVED.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[3px] text-gray-600">
              <ShieldCheck size={14} className="text-[#D4AF37]" /> Secured Vault
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}