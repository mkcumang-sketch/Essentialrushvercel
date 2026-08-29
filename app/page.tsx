"use client";

import React, { useState, useEffect, useMemo, useCallback, ReactNode, memo } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import {
  Menu, Search, ShieldCheck, ShoppingBag, User, Plus, Sparkles, ChevronDown, Lock, X, Star, CheckCircle,
  Instagram, Facebook, Twitter, Youtube, MapPin, Phone, Mail, Linkedin, ArrowRight, Camera, UploadCloud, RefreshCcw, Trash2, Zap, Award
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { useHydratedCart } from '@/store/cartStoretemp';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';

const displayFont = Fraunces({ subsets: ['latin'], weight: ['300', '400', '600', '700', '900'], style: ['normal', 'italic'], variable: '--font-display' });
const bodyFont = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' });
const monoFont = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-mono' });

const MONO = 'font-[family-name:var(--font-mono)] tabular-nums';

// 🚀 DESKTOP LIGHTWEIGHT PARTICLES
const ParticleField = memo(() => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth > 768) {
      setIsMounted(true);
    }
  }, []);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-[#D4AF37]/30 blur-[1px]"
          style={{
            width: 3 + (i % 3),
            height: 3 + (i % 3),
            left: `${(i * 13) % 100}%`,
            top: `${(i * 19) % 100}%`,
          }}
          animate={{
            y: [-20, -120],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
});
ParticleField.displayName = "ParticleField";

// 🔮 4D DIAL MARK
const DialMark = memo(({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.2" />
    <line x1="12" y1="12" x2="12" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="12" y1="12" x2="15.6" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
));
DialMark.displayName = "DialMark";

const Eyebrow = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[5px] ${className}`}>
    <DialMark size={12} className="shrink-0 opacity-70" />
    {children}
  </p>
);

const LUXURY_BRANDS = ["ROLEX", "PATEK PHILIPPE", "AUDEMARS PIGUET", "RICHARD MILLE", "CARTIER", "OMEGA", "VACHERON CONSTANTIN"];

const DEFAULT_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1587836374828-cb4387df3c56?q=80&w=800",
  "https://images.unsplash.com/photo-1508685096489-77a46807e604?q=80&w=800",
  "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?q=80&w=800",
  "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=800",
  "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?q=80&w=800",
  "https://images.unsplash.com/photo-1547996160-81dfa63595dd?q=80&w=800"
];

const DEFAULT_PROMO_VIDEOS = [
  "https://cdn.pixabay.com/video/2020/05/24/40092-424840899_large.mp4",
  "https://cdn.pixabay.com/video/2021/08/11/84687-587289569_large.mp4",
  "https://cdn.pixabay.com/video/2020/02/21/32616-393246231_large.mp4",
  "",
  ""
];

interface HeroSlide {
  type: 'image' | 'video';
  url: string;
  heading?: string;
  subtitle?: string;
  ctaText?: string;
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
}

interface Celebrity {
  _id: string;
  name: string;
  imageUrl?: string;
  img?: string;
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
  media?: string[];
}

// 🎬 CINEMATIC BREAK
const CinematicBreak = memo(({ videoUrl, title }: { videoUrl?: string; title?: string }) => {
  if (!videoUrl || videoUrl.trim() === '') return null;
  
  return (
    <section className="relative w-full h-[45dvh] md:h-[65dvh] bg-[#0B0E11] overflow-hidden border-t border-b border-white/10">
      <video
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        className="w-full h-full object-cover opacity-45"
        aria-hidden="true"
      />
      {title && (
        <div className="absolute inset-0 flex items-center justify-center text-center px-4 z-20 pointer-events-none">
          <h2 className="text-white text-4xl md:text-7xl font-[family-name:var(--font-display)] tracking-[8px] uppercase drop-shadow-2xl font-bold">
            {title}
          </h2>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50 z-10 pointer-events-none" />
    </section>
  );
});
CinematicBreak.displayName = "CinematicBreak";

// 🌟 HERO SECTION
const Isolated4DHero = memo(({ config }: { config: SiteConfig | null }) => {
  const router = useRouter();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const slides: HeroSlide[] = useMemo(() => {
    const rawSlides = config?.heroSlides || [];
    return rawSlides.length > 0 && rawSlides[0]?.url?.length > 5
      ? rawSlides
      : [{ type: 'video', url: 'https://cdn.pixabay.com/video/2020/05/24/40092-424840899_large.mp4', heading: 'PREMIUM WATCHES', subtitle: 'The Masterpiece Vault' }];
  }, [config?.heroSlides]);

  const currentSlide = slides[currentSlideIndex] || slides[0];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section
      onClick={() => router.push('/shop')}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push('/shop'); }}
      aria-label="Shop luxury collection"
      className="relative h-[100dvh] w-full bg-[#0B0E11] cursor-pointer overflow-hidden font-sans select-none"
    >
      <div className="absolute inset-0 w-full h-full z-10 overflow-hidden bg-black pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlideIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full"
          >
            {currentSlide?.type === 'image' ? (
              <img
                src={currentSlide.url}
                className="w-full h-full object-cover opacity-50"
                alt="Hero Banner"
              />
            ) : (
              <video
                key={currentSlide?.url}
                src={currentSlide?.url}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-cover opacity-50"
                aria-hidden="true"
              />
            )}
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E11] via-black/35 to-black/55 pointer-events-none" />
      </div>

      <div className="absolute inset-0 z-30 flex items-center justify-center text-center px-4 sm:px-6 md:px-10 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlideIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-4xl mx-auto w-full flex flex-col items-center"
          >
            <p className={`${MONO} text-[#D4AF37] text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-[6px] sm:tracking-[10px] md:tracking-[18px] mb-4 sm:mb-6 drop-shadow-md`}>
              {currentSlide?.subtitle || "ESSENTIAL VAULT"}
            </p>

            <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-[family-name:var(--font-display)] leading-[1.05] sm:leading-[0.95] tracking-tight text-white font-black mb-6 sm:mb-8 drop-shadow-2xl">
              {currentSlide?.heading || 'Masterpieces'}
            </h1>

            <div className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-white/10 hover:bg-white text-white hover:text-black rounded-full backdrop-blur-md transition-all duration-300 pointer-events-auto shadow-2xl border border-white/20 active:scale-95">
              <DialMark size={12} className="text-[#D4AF37]" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em]">
                {currentSlide?.ctaText || "Explore Vault"}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-6 md:bottom-10 inset-x-0 z-40 flex items-center justify-center pointer-events-none">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/25 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto"
          >
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentSlideIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  i === currentSlideIndex
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
});
Isolated4DHero.displayName = "Isolated4DHero";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, addItem, _hasHydrated } = useHydratedCart();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

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
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showLuxuryToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
  }, []);

  // SWR Instant Cache + Silent Background Sync
  useEffect(() => {
    const CACHE_KEY = 'essential_home_cache_v2';

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.config) setConfig(parsed.config);
        if (parsed.watches) setLiveWatches(parsed.watches);
        if (parsed.celebrities) setLiveCelebrities(parsed.celebrities);
        if (parsed.reviews) setFlowingReviews(parsed.reviews);
        if (parsed.config?.galleryImages) setGalleryImages(parsed.config.galleryImages);
        if (parsed.config?.promotionalVideos) setPromoVideos(parsed.config.promotionalVideos);
        if (parsed.config?.faqs) setLiveFaqs(parsed.config.faqs);
        if (parsed.config?.socialLinks) setSocialLinks(parsed.config.socialLinks);
        if (parsed.config?.corporateInfo) setCorporateInfo(parsed.config.corporateInfo);
        if (parsed.config?.legalPages) setLegalPages(parsed.config.legalPages);
      } catch (e) {
        console.error("Cache parsing error", e);
      }
    }

    const syncData = async () => {
      try {
        const ts = Date.now();
        const [cRes, pRes, rRes, clRes] = await Promise.allSettled([
          fetch(`/api/cms?t=${ts}`),
          fetch(`/api/products?t=${ts}`),
          fetch(`/api/reviews?t=${ts}`),
          fetch(`/api/celebrity?t=${ts}`)
        ]);

        let newConfig = config;
        let newWatches = liveWatches;
        let newCelebs = liveCelebrities;
        let newReviews = flowingReviews;

        if (cRes.status === "fulfilled" && cRes.value.ok) {
          const res = await cRes.value.json();
          newConfig = res.data || {};
          setConfig(newConfig);
          if (newConfig?.galleryImages) setGalleryImages(newConfig.galleryImages);
          if (newConfig?.promotionalVideos) setPromoVideos(newConfig.promotionalVideos);
          if (newConfig?.faqs) setLiveFaqs(newConfig.faqs);
          if (newConfig?.socialLinks) setSocialLinks(newConfig.socialLinks);
          if (newConfig?.corporateInfo) setCorporateInfo(newConfig.corporateInfo);
          if (newConfig?.legalPages) setLegalPages(newConfig.legalPages);
        }

        if (pRes.status === "fulfilled" && pRes.value.ok) {
          const res = await pRes.value.json();
          newWatches = (res.data || []).sort((a: Product, b: Product) => (b.priority || 0) - (a.priority || 0));
          setLiveWatches(newWatches);
        }

        if (clRes.status === "fulfilled" && clRes.value.ok) {
          const res = await clRes.value.json();
          if (res.data) {
            newCelebs = res.data;
            setLiveCelebrities(newCelebs);
          }
        }

        if (rRes.status === "fulfilled" && rRes.value.ok) {
          const res = await rRes.value.json();
          newReviews = (res.data || []).filter((r: Review) => r.visibility === 'public');
          setFlowingReviews(newReviews);
        }

        localStorage.setItem(CACHE_KEY, JSON.stringify({
          config: newConfig,
          watches: newWatches,
          celebrities: newCelebs,
          reviews: newReviews
        }));
      } catch (e) {
        console.error("Background sync error", e);
      }
    };

    syncData();
  }, []);

  const dynamicBrands = useMemo(() => {
    const brandsSet = new Set(liveWatches.map(w => w.brand).filter(Boolean));
    const arr = Array.from(brandsSet);
    return arr.length > 0 ? arr : LUXURY_BRANDS;
  }, [liveWatches]);

  const latestWatches = useMemo(() => liveWatches.slice(0, 8), [liveWatches]);

  const categories = useMemo(() => {
    const fetchedCats = config?.categories || [];
    const aiCats = liveWatches.map(w => w.category).filter(Boolean);
    return ["ALL", ...Array.from(new Set([...fetchedCats, ...aiCats]))];
  }, [liveWatches, config]);

  const filteredWatches = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return liveWatches.filter(w => {
      const catMatch = activeCategory === "ALL" || w.category === activeCategory;
      const name = (w.name || w.title || "").toLowerCase();
      const brand = (w.brand || "").toLowerCase();
      const searchMatch = !term || name.includes(term) || brand.includes(term);
      return catMatch && searchMatch;
    });
  }, [liveWatches, activeCategory, searchTerm]);

  const addToCart = useCallback((product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (status === 'unauthenticated' || !session) {
      showLuxuryToast("Please Login to access the vault.", "error");
      setTimeout(() => router.push('/login'), 1500);
      return;
    }
    addItem(product as any);
    showLuxuryToast(`${product.name || product.title} added to your collection.`, "success");
  }, [session, status, addItem, router, showLuxuryToast]);

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
    } catch { 
      showLuxuryToast("Network error.", "error"); 
    } finally { 
      setIsUploadingMedia(false); 
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeyPot.length > 0) return setReviewStatus('success');
    if (!reviewForm.userName || !reviewForm.comment) return showLuxuryToast("Please fill all details.", "error");
    setReviewStatus('submitting');
    try {
      const payload = { ...reviewForm, media: reviewMedia, product: 'GLOBAL', visibility: 'pending' };
      const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        setReviewStatus('success');
        setTimeout(() => { setIsReviewModalOpen(false); setReviewStatus('idle'); setReviewForm({ userName: '', comment: '', rating: 5 }); setReviewMedia([]); }, 2000);
      } else {
        setReviewStatus('error');
        showLuxuryToast("Could not submit review. Please try again.", "error");
      }
    } catch {
      setReviewStatus('error');
      showLuxuryToast("Network error. Please try again.", "error");
    }
  };

  const handleNewsletterSignup = async () => {
    const email = newsletterEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
      showLuxuryToast("Welcome to Essential Rush.");
      setNewsletterEmail("");
    } catch {
      showLuxuryToast("Something went wrong.", "error");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div
      className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} bg-[#F6F1E7] text-black font-sans selection:bg-[#D4AF37] selection:text-black overflow-x-hidden`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <ParticleField />
      
      {/* Luxury Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 30, x: "-50%" }}
            className="fixed bottom-8 left-1/2 z-[3000] bg-black/85 backdrop-blur-xl border border-white/20 px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-3 text-white"
          >
            <ShoppingBag size={16} className="text-[#D4AF37]" />
            <span className="text-xs font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Top Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-[#D4AF37] origin-left z-[1000]"
        style={{ scaleX }}
      />

      {/* TOP HEADER STATUS BAR */}
      <div className="bg-[#0B0E11] text-white py-2 px-4 md:px-12 flex justify-between items-center text-[8px] md:text-[9px] font-bold uppercase tracking-[3px] z-[601] relative border-b border-white/5">
        <div className="flex items-center gap-2">
          <Lock size={10} className="text-[#D4AF37]" /> Secure Checkout
        </div>
        <div className="hidden sm:block text-gray-400">Complimentary Global Shipping & Valuation</div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={10} className="text-[#D4AF37]" /> Authenticity Guarantee
        </div>
      </div>

      {/* NAVIGATION BAR */}
      <nav
        className={`fixed w-full z-[600] transition-all duration-300 ${
          isScrolled
            ? 'top-0 h-16 md:h-20 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm'
            : 'top-8 h-20 md:h-24 bg-transparent'
        }`}
      >
        <div className="flex items-center justify-between px-4 md:px-12 h-full relative">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              className={`p-2 -ml-2 rounded-full transition-all active:scale-95 cursor-pointer ${
                isScrolled ? 'text-black hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
            >
              <Menu size={22} />
            </button>
            <div className={`hidden lg:flex gap-8 text-[10px] font-bold uppercase tracking-[3px] ${isScrolled ? 'text-gray-600' : 'text-white/80'}`}>
              <Link href="/shop" className="hover:text-[#D4AF37] transition-colors">Collection</Link>
              <Link href="#ourstory" className="hover:text-[#D4AF37] transition-colors">Heritage</Link>
              <Link href="#vault" className="hover:text-[#D4AF37] transition-colors">Vault</Link>
              <Link href="#faq" className="hover:text-[#D4AF37] transition-colors">Concierge</Link>
            </div>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="flex flex-col items-center">
              <h1 className={`text-xl md:text-3xl font-[family-name:var(--font-display)] font-black tracking-[6px] md:tracking-[10px] uppercase transition-colors ${isScrolled ? 'text-black' : 'text-white'}`}>
                Essential
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            <Link
              href="/account"
              className={`hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-[2px] transition-all border ${
                isScrolled
                  ? 'bg-black text-white border-black hover:bg-[#D4AF37] hover:text-black'
                  : 'bg-white/10 text-white border-white/20 backdrop-blur-md hover:bg-white hover:text-black'
              }`}
            >
              <User size={14} /> Vault
            </Link>

            <button
              type="button"
              className="relative cursor-pointer p-2 bg-transparent active:scale-95"
              onClick={() => router.push('/checkout')}
              aria-label="View Cart"
            >
              <ShoppingBag size={20} className={isScrolled ? 'text-black' : 'text-white'} />
              {_hasHydrated && items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shadow-md border border-white">
                  {items.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[1000] flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-4/5 max-w-sm bg-[#0B0E11] text-white h-full p-8 flex flex-col justify-between z-10 border-r border-white/10 shadow-2xl"
            >
              <div>
                <div className="flex justify-between items-center mb-12">
                  <h2 className="text-xl font-[family-name:var(--font-display)] tracking-[4px] uppercase text-[#D4AF37]">
                    Essential Vault
                  </h2>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex flex-col gap-6 text-sm font-bold uppercase tracking-[4px]">
                  <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="hover:text-[#D4AF37]">All Timepieces</Link>
                  <Link href="#ourstory" onClick={() => setIsMenuOpen(false)} className="hover:text-[#D4AF37]">Heritage & Craft</Link>
                  <Link href="#celebrities" onClick={() => setIsMenuOpen(false)} className="hover:text-[#D4AF37]">Worn By Legends</Link>
                  <Link href="#vault" onClick={() => setIsMenuOpen(false)} className="hover:text-[#D4AF37]">Curated Vault</Link>
                  <Link href="#reviews" onClick={() => setIsMenuOpen(false)} className="hover:text-[#D4AF37]">Client Feedback</Link>
                  <Link href="#faq" onClick={() => setIsMenuOpen(false)} className="hover:text-[#D4AF37]">Concierge FAQ</Link>
                  <Link href="/account" onClick={() => setIsMenuOpen(false)} className="hover:text-[#D4AF37]">My Vault Account</Link>
                </div>
              </div>
              <div className="border-t border-white/10 pt-6 text-[10px] uppercase font-bold text-gray-400">
                <p>Private Horology Consignment</p>
                <p className="text-[#D4AF37] mt-1">Authenticity Guaranteed</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1. HERO SECTION */}
      <Isolated4DHero config={config || {}} />

      {/* 2. CINEMATIC BREAK 1 */}
      <CinematicBreak videoUrl={promoVideos[0]} title="Precision." />

      {/* 3. LUXURY BRANDS CAROUSEL */}
      <section className="bg-white py-10 border-b border-gray-100 overflow-hidden relative z-[40]">
        <div className="flex w-[200%]">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ ease: "linear", duration: 40, repeat: Infinity }}
            className="flex gap-16 md:gap-32 items-center px-10 will-change-transform"
          >
            {dynamicBrands.concat(dynamicBrands).map((b: string, i: number) => (
              <div key={`brand-${i}`} className="flex items-center gap-6">
                <span className="text-2xl md:text-4xl font-[family-name:var(--font-display)] italic tracking-tighter whitespace-nowrap text-gray-300 hover:text-[#D4AF37] transition-colors">
                  {b}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. NEW ARRIVALS HORIZONTAL SCROLL */}
      <section className="py-20 md:py-32 relative overflow-hidden bg-[#F6F1E7]">
        <div className="px-6 md:px-16 max-w-[1600px] mx-auto mb-12 flex justify-between items-end">
          <div>
            <Eyebrow className="text-gray-500 mb-2">Just Landed</Eyebrow>
            <h2 className="text-4xl md:text-6xl font-[family-name:var(--font-display)] text-black tracking-tight font-bold">
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

        <div className="w-full overflow-x-auto snap-x snap-mandatory scroll-pl-6 md:scroll-pl-16 pb-8 hide-scrollbar">
          <div className="flex gap-6 md:gap-8 px-6 md:px-16 w-max">
            {latestWatches.map((watch: Product, i: number) => (
              <div
                key={`horiz-${watch._id || i}`}
                onClick={() => router.push(`/product/${watch.slug || watch._id}`)}
                className="w-[280px] md:w-[360px] shrink-0 snap-start bg-white rounded-[28px] p-6 border border-gray-100 group hover:border-[#D4AF37]/50 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
              >
                <div className="h-60 md:h-72 bg-[#F6F1E7]/50 rounded-2xl mb-5 p-6 flex items-center justify-center relative overflow-hidden">
                  {watch.badge && (
                    <span className="absolute top-4 left-4 bg-black text-[#D4AF37] text-[9px] font-black uppercase px-3 py-1 rounded-full z-10">
                      {watch.badge}
                    </span>
                  )}
                  <img
                    src={watch.imageUrl || (watch.images && watch.images[0])}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    alt={watch.name || "Watch"}
                  />
                </div>
                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[3px] mb-1.5">{watch.brand}</p>
                <h4 className="text-lg md:text-xl font-[family-name:var(--font-display)] text-black line-clamp-1 mb-5 font-bold group-hover:text-[#D4AF37] transition-colors">
                  {watch.name || watch.title}
                </h4>
                <div className="mt-auto flex justify-between items-center border-t border-gray-100 pt-4">
                  <p className="font-[family-name:var(--font-mono)] tabular-nums font-bold text-xl text-black">
                    ₹{Number(watch.offerPrice || watch.price || 0).toLocaleString()}
                  </p>
                  <button
                    onClick={(e) => addToCart(watch, e)}
                    aria-label="Add to cart"
                    className="w-11 h-11 bg-black text-white rounded-full hover:bg-[#D4AF37] hover:text-black transition-colors shadow-md flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CINEMATIC BREAK 2 */}
      <CinematicBreak videoUrl={promoVideos[1]} title="Elegance." />

      {/* 6. MAIN CATALOG SHOP SECTION */}
      <section id="ourcollection" className="py-20 md:py-32 relative overflow-hidden bg-white">
        <div className="px-6 md:px-16 max-w-[1600px] mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 border-b border-gray-200 pb-8 gap-6">
            <div>
              <Eyebrow className="text-gray-500 mb-2">Discover</Eyebrow>
              <h2 className="text-4xl md:text-6xl font-[family-name:var(--font-display)] tracking-tight text-black font-bold">
                The Shop.
              </h2>
            </div>
            <div className="w-full lg:w-auto flex flex-col md:flex-row items-end gap-4">
              <div className="relative w-full md:w-80">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search the vault..."
                  className="w-full pl-11 pr-10 py-3 rounded-full text-xs font-medium bg-gray-50 border border-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat: string, i: number) => (
                  <button
                    key={`cat-${i}`}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[2px] transition-all cursor-pointer ${
                      activeCategory === cat ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-black'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWatches.map((watch: Product, i: number) => (
              <div
                key={watch._id || i}
                onClick={() => router.push(`/product/${watch.slug || watch._id}`)}
                className="bg-[#F6F1E7]/30 p-6 rounded-[28px] border border-gray-100 hover:border-[#D4AF37]/50 hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
              >
                {watch.badge && (
                  <span className="self-start mb-3 bg-black text-[#D4AF37] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    {watch.badge}
                  </span>
                )}
                <div className="aspect-square bg-white rounded-2xl overflow-hidden mb-6 flex items-center justify-center p-6">
                  <img
                    src={watch.imageUrl || (watch.images && watch.images[0])}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
                    loading="lazy"
                    alt={watch.name || "Watch"}
                  />
                </div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] mb-1.5">{watch.brand}</p>
                <h4 className="text-lg font-[family-name:var(--font-display)] text-black font-bold line-clamp-1 mb-4">
                  {watch.name || watch.title}
                </h4>
                <div className="flex justify-between items-end mt-auto pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[2px]">Valuation</p>
                    <p className="font-[family-name:var(--font-mono)] tabular-nums text-xl text-black font-bold">
                      ₹{Number(watch.offerPrice || watch.price || 0).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => addToCart(watch, e)}
                    aria-label="Add to cart"
                    className="w-11 h-11 bg-black text-white rounded-full hover:bg-[#D4AF37] hover:text-black transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. WORN BY LEGENDS / CELEBRITY HOROLOGY */}
      {liveCelebrities.length > 0 && (
        <section id="celebrities" className="py-20 md:py-32 bg-[#0B0E11] text-white relative overflow-hidden">
          <div className="max-w-[1600px] mx-auto px-6 md:px-16">
            <div className="mb-16">
              <Eyebrow className="text-[#D4AF37] mb-2">Iconic Wristwear</Eyebrow>
              <h2 className="text-4xl md:text-6xl font-[family-name:var(--font-display)] font-bold tracking-tight">
                Worn by Legends.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {liveCelebrities.map((celeb, idx) => (
                <div key={celeb._id || idx} className="group relative rounded-3xl overflow-hidden bg-white/5 border border-white/10 aspect-[3/4]">
                  <img
                    src={celeb.imageUrl || celeb.img}
                    alt={celeb.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex flex-col justify-end p-6">
                    <p className="text-[9px] font-mono text-[#D4AF37] uppercase font-bold tracking-widest">{celeb.watch || "Investment Piece"}</p>
                    <h3 className="text-xl font-bold font-serif">{celeb.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">{celeb.title || "Brand Ambassador"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. OUR STORY / HERITAGE */}
      <section id="ourstory" className="py-24 md:py-36 bg-[#F6F1E7] text-black border-t border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <Eyebrow className="text-[#D4AF37] justify-center mb-4">Provenance & Heritage</Eyebrow>
          <h2 className="text-4xl md:text-6xl font-[family-name:var(--font-display)] font-black tracking-tight mb-8">
            {config?.aboutConfig?.title || "Crafted for Generations."}
          </h2>
          <p className="text-base md:text-xl text-gray-700 leading-relaxed font-serif italic mb-8">
            {config?.aboutConfig?.content ||
              "Essential Rush was conceived to preserve the pinnacle of mechanical watchmaking. Every timepiece curated within our private vault undergoes multi-point diplomatic provenance verification and rigorous chronometric testing."}
          </p>
          <div className="flex justify-center items-center gap-8 text-[10px] font-bold uppercase tracking-[3px] text-gray-500">
            <span>• Authentic Calibers</span>
            <span>• Diplomatic Provenance</span>
            <span>• Lifetime Mechanical Guarantee</span>
          </div>
        </div>
      </section>

      {/* 9. CURATED LUXURY GALLERY GRID */}
      {galleryImages.length > 0 && (
        <section id="vault" className="py-20 md:py-32 bg-white">
          <div className="max-w-[1600px] mx-auto px-6 md:px-16">
            <div className="mb-16 text-center">
              <Eyebrow className="text-gray-500 justify-center mb-2">Visual Vault</Eyebrow>
              <h2 className="text-4xl md:text-6xl font-[family-name:var(--font-display)] font-bold tracking-tight">
                Curated Horology.
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {galleryImages.slice(0, 6).map((img, i) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden group bg-gray-100 border border-gray-200">
                  <img
                    src={img}
                    alt="Gallery"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 10. CLIENT TESTIMONIALS & REVIEWS MARQUEE */}
      <section id="reviews" className="py-20 md:py-32 bg-[#0B0E11] text-white overflow-hidden relative">
        <div className="max-w-[1600px] mx-auto px-6 md:px-16 mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <Eyebrow className="text-[#D4AF37] mb-2">Verified Feedback</Eyebrow>
            <h2 className="text-4xl md:text-6xl font-[family-name:var(--font-display)] font-bold tracking-tight">
              Client Commendations.
            </h2>
          </div>
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="px-6 py-3.5 bg-[#D4AF37] text-black font-black uppercase text-xs tracking-widest rounded-full hover:bg-white transition-all flex items-center gap-2 cursor-pointer shadow-xl"
          >
            <Star size={14} /> Submit Commendation
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1600px] mx-auto px-6 md:px-16">
          {flowingReviews.slice(0, 6).map((rev, idx) => (
            <div key={rev._id || idx} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex gap-1 text-[#D4AF37] mb-3">
                  {Array.from({ length: rev.rating || 5 }).map((_, r) => (
                    <Star key={r} size={14} fill="#D4AF37" />
                  ))}
                </div>
                <p className="text-xs text-gray-300 italic font-serif leading-relaxed line-clamp-4">"{rev.comment}"</p>
              </div>
              <div className="border-t border-white/10 pt-4 flex justify-between items-center text-[10px]">
                <span className="font-bold uppercase tracking-wider text-white">{rev.userName}</span>
                <span className="text-emerald-400 font-mono flex items-center gap-1"><CheckCircle size={10} /> Verified Patron</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEW SUBMISSION MODAL */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-[#0B0E11] text-white border border-white/15 rounded-3xl p-8 max-w-md w-full shadow-2xl z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif font-bold text-[#D4AF37]">Patron Commendation</h3>
                <button onClick={() => setIsReviewModalOpen(false)} className="p-1 text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Full Name / Alias"
                  value={reviewForm.userName}
                  onChange={(e) => setReviewForm({ ...reviewForm, userName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-[#D4AF37]"
                />
                <textarea
                  rows={4}
                  placeholder="Share your timepiece acquisition experience..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-[#D4AF37]"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Rating:</span>
                  <div className="flex gap-1.5 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Star
                        key={num}
                        size={18}
                        className={num <= reviewForm.rating ? "text-[#D4AF37] fill-[#D4AF37]" : "text-gray-600"}
                        onClick={() => setReviewForm({ ...reviewForm, rating: num })}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={reviewStatus === "submitting"}
                  className="w-full py-3.5 bg-[#D4AF37] text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-white transition-all cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {reviewStatus === "submitting" ? "Transmitting..." : "Submit for Verification"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 11. FAQ CONCIERGE ACCORDION */}
      {liveFaqs.length > 0 && (
        <section id="faq" className="py-20 md:py-32 bg-white">
          <div className="max-w-4xl mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <Eyebrow className="text-gray-500 justify-center mb-2">Concierge Advisory</Eyebrow>
              <h2 className="text-4xl md:text-6xl font-[family-name:var(--font-display)] font-bold tracking-tight text-black">
                Frequently Asked.
              </h2>
            </div>
            <div className="space-y-4">
              {liveFaqs.map((faq, i) => (
                <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-6 text-left flex justify-between items-center font-bold text-sm hover:bg-gray-50 transition-colors"
                  >
                    <span>{faq.question || faq.q}</span>
                    <ChevronDown size={18} className={`transition-transform duration-300 ${openFaq === i ? "rotate-180 text-[#D4AF37]" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-6 text-xs text-gray-600 leading-relaxed font-serif">
                      {faq.answer || faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 12. COMPLETE LUXURY FOOTER */}
      <footer className="bg-[#0B0E11] text-white pt-24 pb-10 border-t border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 md:px-16">
          <div className="flex flex-col md:flex-row justify-between border-b border-white/10 pb-16 mb-16 gap-10">
            <div>
              <h3 className="text-4xl md:text-6xl font-[family-name:var(--font-display)] font-bold text-white tracking-tight mb-4">
                Stay Updated.
              </h3>
              <p className="text-gray-400 text-sm">Get exclusive access to new timepieces and vault sales.</p>
            </div>
            <div className="flex w-full md:w-auto h-max self-center border-b border-gray-600 focus-within:border-[#D4AF37] transition-all pb-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Your Email Address"
                className="bg-transparent p-3 text-white outline-none text-base w-full md:w-[320px] placeholder:text-gray-600 font-serif italic"
              />
              <button
                onClick={handleNewsletterSignup}
                disabled={isSubscribing}
                className="text-[#D4AF37] font-black uppercase tracking-[3px] text-[9px] px-6 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubscribing ? 'Joining...' : 'Subscribe'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-16 border-b border-white/10 text-xs text-gray-400">
            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-[10px] mb-4">Corporate Office</h4>
              <p>{corporateInfo?.companyName || "Essential Rush Pvt Ltd"}</p>
              <p className="mt-2">{corporateInfo?.address || "The Vault, Financial District"}</p>
              <p className="mt-2">{corporateInfo?.phone1 || "+91 (0) 800-VAULT-RUSH"}</p>
              <p className="mt-1">{corporateInfo?.email || "concierge@essentialrush.com"}</p>
            </div>

            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-[10px] mb-4">Collections</h4>
              <ul className="space-y-2">
                <li><Link href="/shop" className="hover:text-white">Investment Grade</Link></li>
                <li><Link href="/shop" className="hover:text-white">Rare Vintage</Link></li>
                <li><Link href="/shop" className="hover:text-white">Modern Complications</Link></li>
                <li><Link href="/shop" className="hover:text-white">Haute Horlogerie</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-[10px] mb-4">Legal Policies</h4>
              <ul className="space-y-2">
                {legalPages.map((lp, idx) => (
                  <li key={idx}><Link href={`/legal/${lp.slug}`} className="hover:text-white">{lp.title}</Link></li>
                ))}
                <li><Link href="/legal/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-white">Terms of Consignment</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-[10px] mb-4">Diplomatic Connect</h4>
              <div className="flex gap-4 text-gray-400">
                {socialLinks?.instagram && <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="hover:text-[#D4AF37]"><Instagram size={18} /></a>}
                {socialLinks?.facebook && <a href={socialLinks.facebook} target="_blank" rel="noreferrer" className="hover:text-[#D4AF37]"><Facebook size={18} /></a>}
                {socialLinks?.twitter && <a href={socialLinks.twitter} target="_blank" rel="noreferrer" className="hover:text-[#D4AF37]"><Twitter size={18} /></a>}
                {socialLinks?.youtube && <a href={socialLinks.youtube} target="_blank" rel="noreferrer" className="hover:text-[#D4AF37]"><Youtube size={18} /></a>}
                {socialLinks?.linkedin && <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="hover:text-[#D4AF37]"><Linkedin size={18} /></a>}
              </div>
            </div>
          </div>

          <div className="text-center pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-bold uppercase tracking-[3px] text-gray-500">
            <p>© {new Date().getFullYear()} ESSENTIAL RUSH. ALL RIGHTS RESERVED.</p>
            <div className="flex items-center gap-2 text-gray-400">
              <ShieldCheck size={14} className="text-[#D4AF37]" /> Secured Vault Core
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}