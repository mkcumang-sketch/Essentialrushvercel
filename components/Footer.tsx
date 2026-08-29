"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight
} from "lucide-react";

export interface LegalPage {
  slug: string;
  title: string;
}

export interface CorporateInfo {
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
}

interface FooterProps {
  corporateInfo?: CorporateInfo | null;
  socialLinks?: SocialLinks | null;
  legalPages?: LegalPage[];
}

export default function Footer({
  corporateInfo,
  socialLinks,
  legalPages = []
}: FooterProps) {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  const handleNewsletterSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const email = newsletterEmail.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValidEmail) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    setIsSubscribing(true);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        showToast("Welcome to the Vault. You are now on the VIP registry.");
        setNewsletterEmail("");
      } else {
        showToast("Unable to process subscription. Please try again.", "error");
      }
    } catch (err) {
      console.error("Newsletter error:", err);
      showToast("Network error. Please try again later.", "error");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-[#0B0E11] text-white pt-24 md:pt-32 pb-12 relative z-20 overflow-hidden border-t border-white/10 font-sans">
      {/* LUXURY TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-10 left-1/2 z-[3000] bg-[#0A0A0A] border border-[#D4AF37]/30 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] max-w-[90vw] backdrop-blur-xl"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                toast.type === "success" ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-red-500/20 text-red-500"
              }`}
            >
              {toast.type === "success" ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[3px] text-gray-400">
                {toast.type === "success" ? "VIP Access Granted" : "Subscription Error"}
              </p>
              <p className="text-sm font-serif italic text-white">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.06),transparent_50%)] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-6 md:px-16 lg:px-20 relative z-10">
        
        {/* VIP NEWSLETTER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-white/10 pb-16 md:pb-20 mb-16 md:mb-20 gap-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37] mb-3">
              Privilege Access
            </p>
            <h3 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight leading-none mb-4">
              Stay in the Vault.
            </h3>
            <p className="text-gray-400 text-sm md:text-base max-w-md font-medium">
              Receive private dispatch alerts regarding rare allocations and private horological collections.
            </p>
          </div>

          <form
            onSubmit={handleNewsletterSignup}
            className="flex flex-col sm:flex-row w-full lg:w-auto items-center gap-3 border-b border-gray-700 focus-within:border-[#D4AF37] pb-3 transition-colors"
          >
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your VIP email"
              aria-label="Email address for VIP newsletter"
              className="bg-transparent p-3 text-white outline-none text-base md:text-lg w-full sm:w-[320px] md:w-[380px] placeholder:text-gray-600 font-serif italic"
            />
            <button
              type="submit"
              disabled={isSubscribing}
              className="w-full sm:w-auto bg-[#D4AF37] hover:bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] px-8 py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {isSubscribing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Join Registry <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* NAVIGATION & LEGAL PAGES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-16 mb-20 text-left">
          {/* Shop Column */}
          <nav aria-label="Shop Navigation">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-8">
              Collection
            </h4>
            <ul className="space-y-4 text-sm font-medium text-gray-400">
              <li>
                <Link href="/shop" className="hover:text-white transition-colors duration-300">
                  All Timepieces
                </Link>
              </li>
              <li>
                <Link href="/shop?category=ROLEX" className="hover:text-white transition-colors duration-300">
                  Rolex Vault
                </Link>
              </li>
              <li>
                <Link href="/shop?category=PATEK+PHILIPPE" className="hover:text-white transition-colors duration-300">
                  Patek Philippe
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-white transition-colors duration-300">
                  My Vault Bag
                </Link>
              </li>
            </ul>
          </nav>

          {/* Concierge */}
          <nav aria-label="Support Navigation">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-8">
              Concierge
            </h4>
            <ul className="space-y-4 text-sm font-medium text-gray-400">
              <li>
                <Link href="/account" className="hover:text-white transition-colors duration-300">
                  Client Dashboard
                </Link>
              </li>
              <li>
                <Link href="/account?tab=orders" className="hover:text-white transition-colors duration-300">
                  Track Consignment
                </Link>
              </li>
              <li>
                <Link href="/account?tab=support" className="hover:text-white transition-colors duration-300">
                  Help & FAQs
                </Link>
              </li>
              <li>
                <Link href="/account?tab=security" className="hover:text-white transition-colors duration-300">
                  Security Clearance
                </Link>
              </li>
            </ul>
          </nav>

          {/* Dynamic Legal Pages */}
          <nav aria-label="Legal Navigation">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-8">
              Compliance
            </h4>
            <ul className="space-y-4 text-sm font-medium text-gray-400">
              {legalPages && legalPages.length > 0 ? (
                legalPages.map((page, i) => (
                  <li key={i}>
                    <Link
                      href={`/legal/${page.slug}`}
                      className="hover:text-white transition-colors duration-300"
                    >
                      {page.title}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link href="/legal/privacy-policy" className="hover:text-white transition-colors duration-300">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/legal/terms-of-service" className="hover:text-white transition-colors duration-300">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/legal/authenticity-guarantee" className="hover:text-white transition-colors duration-300">
                      Authenticity Guarantee
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>

          {/* Corporate Headquarters */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-8">
              Headquarters
            </h4>
            <address className="not-italic space-y-4 text-sm font-medium text-gray-400">
              <p className="text-white font-serif italic text-lg font-bold">
                {corporateInfo?.companyName || "Essential Rush"}
              </p>
              <p className="flex items-center gap-3 hover:text-white transition-colors">
                <Mail size={16} className="text-[#D4AF37] shrink-0" />
                <a href={`mailto:${corporateInfo?.email || "concierge@essentialrush.com"}`}>
                  {corporateInfo?.email || "concierge@essentialrush.com"}
                </a>
              </p>
              {corporateInfo?.phone && (
                <p className="flex items-center gap-3 hover:text-white transition-colors">
                  <Phone size={16} className="text-[#D4AF37] shrink-0" />
                  <a href={`tel:${corporateInfo.phone}`}>{corporateInfo.phone}</a>
                </p>
              )}
              {corporateInfo?.address && (
                <p className="flex items-start gap-3 leading-relaxed">
                  <MapPin size={16} className="text-[#D4AF37] shrink-0 mt-1" />
                  <span>{corporateInfo.address}</span>
                </p>
              )}

              {/* Social Media Links */}
              <div className="flex items-center gap-5 pt-4">
                {socialLinks?.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow on Instagram"
                    className="p-2 rounded-full bg-white/5 border border-white/10 hover:border-[#D4AF37] text-gray-400 hover:text-[#D4AF37] hover:scale-110 transition-all duration-300"
                  >
                    <Instagram size={18} />
                  </a>
                )}
                {socialLinks?.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow on Facebook"
                    className="p-2 rounded-full bg-white/5 border border-white/10 hover:border-[#D4AF37] text-gray-400 hover:text-[#D4AF37] hover:scale-110 transition-all duration-300"
                  >
                    <Facebook size={18} />
                  </a>
                )}
                {socialLinks?.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow on Twitter"
                    className="p-2 rounded-full bg-white/5 border border-white/10 hover:border-[#D4AF37] text-gray-400 hover:text-[#D4AF37] hover:scale-110 transition-all duration-300"
                  >
                    <Twitter size={18} />
                  </a>
                )}
                {socialLinks?.youtube && (
                  <a
                    href={socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Watch on YouTube"
                    className="p-2 rounded-full bg-white/5 border border-white/10 hover:border-[#D4AF37] text-gray-400 hover:text-[#D4AF37] hover:scale-110 transition-all duration-300"
                  >
                    <Youtube size={18} />
                  </a>
                )}
                {socialLinks?.linkedin && (
                  <a
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Connect on LinkedIn"
                    className="p-2 rounded-full bg-white/5 border border-white/10 hover:border-[#D4AF37] text-gray-400 hover:text-[#D4AF37] hover:scale-110 transition-all duration-300"
                  >
                    <Linkedin size={18} />
                  </a>
                )}
              </div>
            </address>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
            © {new Date().getFullYear()} {corporateInfo?.companyName || "ESSENTIAL RUSH"}. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <ShieldCheck size={14} className="text-[#D4AF37]" />
            Insured Global Vault Delivery
          </div>
        </div>

      </div>
    </footer>
  );
}