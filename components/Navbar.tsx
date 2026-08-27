"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag, User, ShieldCheck } from "lucide-react";
import { useHydratedCart } from "@/store/cartStoretemp";
import { drawerVariants, staggerContainerVariants, staggerItemVariants, motionConfig } from "@/lib/motion";

interface NavbarProps {
  onOpenCart?: () => void;
}

export default function Navbar({ onOpenCart }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { items, _hasHydrated } = useHydratedCart();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const totalCartItems = items.reduce((sum: number, item: any) => sum + (item.quantity || item.qty || 1), 0);
  const isHome = pathname === "/";

  return (
    <>
      {/* MOBILE FULLSCREEN NAVIGATION DRAWER */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={drawerVariants}
            role="dialog"
            aria-modal="true"
            aria-label="Main Navigation Menu"
            className="fixed inset-0 z-[1100] bg-[#0B0E11]/95 backdrop-blur-3xl flex flex-col p-8 md:p-24 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.08),transparent_40%)] pointer-events-none" />

            <div className="relative z-10 flex justify-end">
              <button
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
                className="p-4 rounded-full border border-white/10 bg-white/5 text-white hover:text-black hover:bg-[#D4AF37] hover:rotate-90 transition-all duration-500 shadow-2xl"
              >
                <X size={28} />
              </button>
            </div>

            <motion.nav
              variants={staggerContainerVariants}
              initial="hidden"
              animate="visible"
              className="relative z-10 flex-1 flex flex-col justify-center space-y-8 md:space-y-12"
              aria-label="Mobile Navigation"
            >
              {[
                { name: "Home", href: "/" },
                { name: "Shop Collection", href: "/shop" },
                { name: "Heritage", href: "/#ourstory" },
                { name: "Client Vault", href: "/account" },
              ].map((link) => (
                <motion.div key={link.name} variants={staggerItemVariants}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-white text-4xl md:text-7xl font-serif italic font-bold hover:text-[#D4AF37] transition-colors tracking-tight block w-max"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </motion.nav>

            <div className="relative z-10 mt-auto border-t border-white/10 pt-8 flex justify-between items-center text-gray-400">
              <p className="text-[10px] font-black uppercase tracking-[4px]">Essential Rush • Vault Edition</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ANNOUNCEMENT BAR */}
      <div className="bg-[#0B0E11] text-white py-2.5 px-4 md:px-12 flex justify-between items-center text-[8px] md:text-[9px] font-black uppercase tracking-[3px] z-[601] relative border-b border-white/5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={12} className="text-[#D4AF37]" /> Authenticity Guaranteed
        </div>
        <div className="hidden sm:block text-gray-400">Complimentary Global Insured Shipping</div>
        <div className="text-[#D4AF37]">Private Concierge Active</div>
      </div>

      {/* MAIN STICKY NAVBAR */}
      <header
        className={`fixed w-full z-[600] transition-all duration-700 ease-[${motionConfig.ease.easeOut.join(",")}] ${
          isScrolled
            ? "top-0 h-20 bg-white/90 backdrop-blur-xl border-b border-gray-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.03)] text-black"
            : `top-8 md:top-9 h-24 bg-transparent ${isHome ? "text-white" : "text-black bg-white/80 backdrop-blur-md border-b border-gray-100"}`
        }`}
      >
        <div className="flex items-center justify-between px-6 md:px-12 h-full max-w-[1800px] mx-auto relative">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              className={`p-2.5 -ml-2.5 rounded-full transition-all duration-300 flex items-center gap-3 group cursor-pointer ${
                isScrolled || !isHome ? "hover:bg-black/5 text-black" : "hover:bg-white/10 text-white"
              }`}
            >
              <Menu size={22} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[3px] hidden lg:inline-block">Menu</span>
            </button>

            <nav className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[3px]">
              <Link href="/shop" className={`transition-colors hover:text-[#D4AF37] ${isScrolled || !isHome ? "text-gray-700" : "text-white/90"}`}>
                Collection
              </Link>
              <Link href="/#ourstory" className={`transition-colors hover:text-[#D4AF37] ${isScrolled || !isHome ? "text-gray-700" : "text-white/90"}`}>
                Heritage
              </Link>
            </nav>
          </div>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center group">
            <h1 className={`text-2xl md:text-3xl font-serif font-black tracking-[8px] md:tracking-[12px] uppercase transition-colors duration-500 ${
              isScrolled || !isHome ? "text-black group-hover:text-[#D4AF37]" : "text-white group-hover:text-[#D4AF37]"
            }`}>
              Essential
            </h1>
          </Link>

          <div className="flex items-center gap-4 md:gap-6">
            <Link
              href={session ? "/account" : "/login"}
              className={`hidden md:flex items-center gap-2 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[2px] transition-all border ${
                isScrolled || !isHome
                  ? "bg-black text-white border-black hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-black shadow-md"
                  : "bg-white/10 text-white border-white/20 backdrop-blur-md hover:bg-white hover:text-black"
              }`}
            >
              <User size={14} /> {session ? "Vault" : "Sign In"}
            </Link>

            <button
              type="button"
              onClick={() => (onOpenCart ? onOpenCart() : router.push("/checkout"))}
              aria-label={`View cart, ${_hasHydrated ? totalCartItems : 0} items`}
              className={`relative p-3 rounded-full transition-all duration-300 cursor-pointer ${
                isScrolled || !isHome ? "hover:bg-black/5 text-black" : "hover:bg-white/10 text-white"
              }`}
            >
              <ShoppingBag size={20} className="transition-transform duration-300 hover:scale-110" />
              {_hasHydrated && totalCartItems > 0 && (
                <span className="absolute top-1 right-1 bg-[#D4AF37] text-black w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shadow-md border border-white">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}