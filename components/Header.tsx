"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 
import SearchOverlay from "./SearchOverlay";
import { useCartStore } from "@/store/cartStoretemp";
import { useLogoutModal } from "@/context/ModalContext";
import { Menu, X, ShoppingBag, User, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const showLogoutModal = useLogoutModal();
  
  const isAdmin = (session?.user as { role?: string })?.role === "SUPER_ADMIN";

  const [siteName, setSiteName] = useState("EssentialRush");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const cartItems = useCartStore((state) => state.items);

  const handleLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // Ignore storage errors (private browsing, etc.)
    }

    // Ensure in-memory Zustand state is cleared too.
    try {
      useCartStore.getState().clearCart();
    } catch (e) {}

    await signOut({ callbackUrl: "/" });
    router.push("/");
  };

  const handleLogoutClick = () => {
    showLogoutModal(handleLogout);
  };

  // Site Name Load Karna
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.siteName) {
          setSiteName(data.settings.siteName);
        }
      });
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <nav className="fixed top-0 w-full bg-black/80 backdrop-blur-xl border-b border-white/10 z-[60] py-4 px-6 md:px-12 flex justify-between items-center font-serif text-white">
        
        {/* Left: Hamburger (Mobile Only) */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-white/70 hover:text-[#D4AF37] p-2 transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Center: Logo */}
        <Link href="/" className="text-xl md:text-3xl font-bold italic tracking-tighter hover:text-[#D4AF37] transition-colors absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
          {siteName}
        </Link>

        {/* Center: Desktop Navigation */}
        <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-[3px] text-white/70 items-center">
          <Link href="/" className="hover:text-[#D4AF37] transition-colors">Home</Link>
          <Link href="/shop" className="hover:text-[#D4AF37] transition-colors">Collection</Link>
          {isAdmin && <Link href="/Godmode" className="text-[#D4AF37] hover:text-white border-b border-[#D4AF37] pb-1">Admin Panel</Link>}
          {session && !isAdmin && <Link href="/sales" className="text-white/70 hover:text-[#D4AF37]">Sales Dashboard</Link>}
          <button onClick={() => setIsSearchOpen(true)} className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 group">
            <Search size={18} />
          </button>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center gap-2 md:gap-6">
          <Link href="/cart" className="relative p-2 text-white/70 hover:text-[#D4AF37] transition-colors">
            <ShoppingBag size={20} />
            {isMounted && cartItems.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-[#D4AF37] text-black text-[8px] font-black rounded-full flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </Link>
          
          <div className="hidden md:block">
            {session ? (
              <Link href="/account" className="flex items-center gap-3 group">
                <img src={session.user?.image || ""} alt="User" className="w-8 h-8 rounded-full border border-white/15 group-hover:border-[#D4AF37] transition-all" />
              </Link>
            ) : (
              <button onClick={() => signIn("google")} className="text-[9px] font-black uppercase tracking-[3px] border border-white/20 px-6 py-2 hover:bg-white hover:text-black transition-all">Login</button>
            )}
          </div>

          {/* Mobile Profile Icon */}
          <Link href="/account" className="md:hidden p-2 text-white/70 hover:text-[#D4AF37]">
            <User size={20} />
          </Link>
        </div>
      </nav>

      {/* Full Screen Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 bg-black z-[55] pt-24 px-10 flex flex-col gap-8 md:hidden"
          >
            <div className="flex flex-col gap-6">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-4xl font-serif italic text-white hover:text-[#D4AF37]">Home</Link>
              <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="text-4xl font-serif italic text-white hover:text-[#D4AF37]">Collection</Link>
              <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)} className="text-4xl font-serif italic text-white hover:text-[#D4AF37]">Cart</Link>
              <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="text-4xl font-serif italic text-white hover:text-[#D4AF37]">Account</Link>
              {isAdmin && <Link href="/Godmode" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-serif italic text-[#D4AF37]">Admin Panel</Link>}
            </div>

            <div className="mt-auto pb-12 border-t border-white/10 pt-8">
              {session ? (
                <button onClick={handleLogoutClick} className="text-[10px] font-black uppercase tracking-[4px] text-red-500">Sign Out</button>
              ) : (
                <button onClick={() => signIn("google")} className="text-[10px] font-black uppercase tracking-[4px] text-[#D4AF37]">Login to Vault</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} />}
    </>
  );
}