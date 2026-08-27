"use client";

import React, { useEffect, useState, useTransition, useCallback } from "react";
import { signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, Variants } from "framer-motion";
import Link from "next/link";
import { 
  LogOut, History, Sparkles, User, MapPin, Wallet, Heart, 
  Percent, Lock, HelpCircle, Copy, RefreshCw, Plus, Trash2, 
  CheckCircle2, ChevronRight, Download, Package, Gift,
  X, Landmark, CreditCard, Share2 
} from "lucide-react";
import { useCartStore } from "@/store/cartStoretemp";

// Sub-components
import SmartTrackButton from '@/components/SmartTrackButton';
import CancelOrderButton from "@/components/CancelOrderButton";

// =========================================================
// STRICT INTERFACES
// =========================================================

export type TabType = "overview" | "profile" | "orders" | "addresses" | "wallet" | "wishlist" | "offers" | "security" | "support";

interface OrderItem {
    _id: string;
    name?: string;
    imageUrl?: string;
}

interface Order {
    _id: string;
    orderId: string;
    status: string;
    totalAmount: number;
    items: OrderItem[];
}

interface Address {
    _id: string;
    line1: string;
    city: string;
    state: string;
    zip: string;
    isDefault: boolean;
    address?: string;
}

interface WishlistItem {
    _id: string;
    name?: string;
    title?: string;
    brand?: string;
    price?: number;
    offerPrice?: number;
    imageUrl?: string;
    images?: string[];
}

interface AccountClientProps {
  initialData: {
    walletPoints?: number;
    loyaltyTier?: string;
    orders?: Order[];
    phone?: string;
    dob?: string;
    myReferralCode?: string; 
    totalEarned?: number;    
  };
  session: {
    user?: {
      name?: string;
      email?: string;
      id?: string;
    };
  };
}

export default function AccountClient({ initialData, session }: AccountClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  
  // URL-Driven State for SEO & History Navigation
  const tabParam = searchParams.get("tab") as TabType | null;
  const activeTab: TabType = tabParam || "overview";

  const setActiveTab = useCallback((tab: TabType) => {
      router.push(`?tab=${tab}`, { scroll: false });
  }, [router]);

  const addItem = useCartStore((state) => state.addItem);
  
  // Modals & Forms
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'bank'>('upi');
  const [withdrawDetails, setWithdrawDetails] = useState({ upiId: '', accountName: '', accountNumber: '', ifsc: '' });

  const [isCopied, setIsCopied] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);

  // User Data
  const su = session?.user;
  const name = su?.name || "VIP Member";
  const email = su?.email || "";
  const walletPoints = Number(initialData?.walletPoints ?? 0);
  const loyaltyTier = initialData?.loyaltyTier || "Silver Vault";
  const orders = Array.isArray(initialData?.orders) ? initialData.orders : [];
  const lastThreeOrders = orders.slice(0, 3);

  const [profile, setProfile] = useState({ name, email, phone: initialData?.phone || "", dob: initialData?.dob || "" });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileSaving, setProfileSaving] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [addrForm, setAddrForm] = useState({ line1: "", city: "", state: "", zip: "", isDefault: false });
  
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);

  // 🚀 FIXED: Framer Motion Variants Strict Typing
  const tabVariants: Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -15, scale: 0.98, transition: { duration: 0.3 } }
  };

  const modalVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
  };

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleRefresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
      notify("Data synced with Vault");
    });
  }, [router, notify]);

  const handleWithdrawClick = () => {
    if (walletPoints < 500) {
        notify("Minimum balance of ₹500 is required for withdrawal.");
        return;
    }
    setShowWithdrawModal(true);
  };

  const handleWithdrawSubmit = async () => {
    if (withdrawMethod === 'upi' && !withdrawDetails.upiId) return notify("Please enter UPI ID");
    if (withdrawMethod === 'bank' && (!withdrawDetails.accountNumber || !withdrawDetails.ifsc)) return notify("Please fill all bank details");

    setIsWithdrawing(true);
    
    try {
        const res = await fetch('/api/withdrawals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: walletPoints,
                method: withdrawMethod,
                details: withdrawDetails
            })
        });
        
        const data = await res.json();
        
        if (data.success) {
            notify("Withdrawal request sent! Funds will be credited in 24 hrs.");
            setShowWithdrawModal(false);
            setWithdrawDetails({ upiId: '', accountName: '', accountNumber: '', ifsc: '' });
        } else {
            notify(data.error || "Failed to submit request.");
        }
    } catch (error) {
        notify("Network error. Try again.");
    } finally {
        setIsWithdrawing(false);
    }
  };

  const handleCopyLink = () => {
    const referralCode = initialData?.myReferralCode || "CODE"; 
    const fullLink = `${window.location.origin}/?ref=${referralCode}`;
    navigator.clipboard.writeText(fullLink);
    setIsCopied(true);
    setShowReferralModal(true); 
    setTimeout(() => setIsCopied(false), 2000);
  };

  const validateProfile = () => {
    const errs: Record<string, string> = {};
    if (!profile.name || profile.name.length < 2) errs.name = "Enter a valid name";
    if (!profile.email || !/^[^@]+@[^@]+\.[^@]+$/.test(profile.email)) errs.email = "Enter a valid email";
    if (profile.phone && profile.phone.replace(/\D/g, "").length < 10) errs.phone = "Enter a valid phone";
    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveProfile = async () => {
    if (!validateProfile()) return;
    setProfileSaving(true);
    try {
      const res = await fetch('/api/user/profile', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        notify("Profile details updated successfully.");
        startTransition(() => { router.refresh(); });
      } else {
        notify("Failed to update profile.");
      }
    } catch (error) {
        notify("Network error. Try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const addAddress = () => {
    if (!addrForm.line1 || !addrForm.city || !addrForm.zip) {
        notify("Please fill all required address fields.");
        return;
    }
    startTransition(async () => {
      const optimistic: Address = { 
          ...addrForm, 
          _id: Math.random().toString(36).slice(2),
          state: addrForm.state || "" 
      };
      setAddresses((a) => [optimistic, ...a]);
      try {
        await fetch("/api/user/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addrForm),
        });
        notify("New address added to your vault.");
        router.refresh();
      } catch {
        setAddresses((a) => a.filter((x) => x._id !== optimistic._id));
        notify("Failed to add address.");
      } finally {
        setAddrForm({ line1: "", city: "", state: "", zip: "", isDefault: false });
      }
    });
  };

  const removeAddress = (id: string) => {
    startTransition(async () => {
      const prev = addresses;
      setAddresses((a) => a.filter((x) => x._id !== id));
      try {
        await fetch(`/api/user/addresses/${id}`, { method: "DELETE" });
        notify("Address removed.");
      } catch {
        setAddresses(prev);
        notify("Error removing address.");
      }
    });
  };

  const setDefaultAddress = (id: string) => {
    startTransition(async () => {
      const next = addresses.map((a) => ({ ...a, isDefault: a._id === id }));
      setAddresses(next);
      try {
        await fetch(`/api/user/addresses/${id}`, { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ isDefault: true }) 
        });
        notify("Default address updated.");
      } catch {
          notify("Failed to update default address.");
      }
    });
  };

  const moveToCart = (item: WishlistItem) => {
    addItem({ ...item, id: item._id, quantity: 1 } as any);
    notify(`${item.name || item.title} moved to cart.`);
  };

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [rAdd, rWish] = await Promise.all([fetch("/api/user/addresses"), fetch("/api/user/wishlist")]);
        const [jAdd, jWish] = await Promise.all([rAdd.json(), rWish.json()]);
        if (!mounted) return;
        if (jAdd?.success && Array.isArray(jAdd.data)) setAddresses(jAdd.data);
        if (jWish?.success && Array.isArray(jWish.items)) setWishlist(jWish.items);
      } finally {
        if (mounted) { setAddrLoading(false); setWishlistLoading(false); }
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  const TABS = [
    { key: "overview", label: "Overview", icon: Sparkles },
    { key: "profile", label: "Profile", icon: User },
    { key: "orders", label: "Orders", icon: History },
    { key: "addresses", label: "Addresses", icon: MapPin },
    { key: "wallet", label: "Wallet", icon: Wallet },
    { key: "wishlist", label: "Wishlist", icon: Heart },
    { key: "offers", label: "Offers", icon: Percent },
    { key: "security", label: "Security", icon: Lock },
    { key: "support", label: "Support", icon: HelpCircle },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#F7F7F7] text-[#050505] font-sans pb-24 lg:pb-0 relative">
      
      {/* LUXURY TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: "-50%" }} 
            animate={{ opacity: 1, y: 0, x: "-50%" }} 
            exit={{ opacity: 0, y: -50, x: "-50%" }} 
            className="fixed top-8 left-1/2 z-[200] bg-[#0A0A0A] border border-[#D4AF37]/30 text-white px-6 py-4 rounded-full flex items-center gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.3)] backdrop-blur-md w-max max-w-[90vw]"
          >
            <CheckCircle2 size={18} className="text-[#D4AF37] shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] truncate">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WITHDRAW MODAL */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 h-[100dvh]">
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-[#0A0A0A] border border-gray-800 rounded-[2.5rem] p-8 w-full max-w-lg text-white relative shadow-2xl overflow-y-auto max-h-[90dvh]">
              <button onClick={() => setShowWithdrawModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full"><X size={20}/></button>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#D4AF37]/10 text-[#D4AF37] rounded-2xl flex items-center justify-center"><Wallet size={24}/></div>
                <div>
                    <h3 className="text-2xl font-serif italic font-black">Withdraw Funds</h3>
                    <p className="text-xs text-gray-400 font-mono">Available: ₹{walletPoints.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-4 mb-6">
                  <button onClick={() => setWithdrawMethod('upi')} className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${withdrawMethod === 'upi' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-800 text-gray-400 hover:border-gray-600'}`}>
                      <CreditCard size={24}/> <span className="text-[10px] font-black uppercase tracking-widest">UPI ID</span>
                  </button>
                  <button onClick={() => setWithdrawMethod('bank')} className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${withdrawMethod === 'bank' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-800 text-gray-400 hover:border-gray-600'}`}>
                      <Landmark size={24}/> <span className="text-[10px] font-black uppercase tracking-widest">Bank Transfer</span>
                  </button>
              </div>

              <div className="space-y-4 mb-8">
                {withdrawMethod === 'upi' ? (
                    <input type="text" placeholder="Enter UPI ID (e.g., name@okhdfcbank)" value={withdrawDetails.upiId} onChange={(e) => setWithdrawDetails({...withdrawDetails, upiId: e.target.value})} className="w-full p-5 bg-[#141414] border border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-white transition-colors font-mono text-sm" />
                ) : (
                    <>
                        <input type="text" placeholder="Account Holder Name" value={withdrawDetails.accountName} onChange={(e) => setWithdrawDetails({...withdrawDetails, accountName: e.target.value})} className="w-full p-4 bg-[#141414] border border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-white transition-colors text-sm" />
                        <input type="number" placeholder="Account Number" value={withdrawDetails.accountNumber} onChange={(e) => setWithdrawDetails({...withdrawDetails, accountNumber: e.target.value})} className="w-full p-4 bg-[#141414] border border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-white transition-colors font-mono text-sm" />
                        <input type="text" placeholder="IFSC Code" value={withdrawDetails.ifsc} onChange={(e) => setWithdrawDetails({...withdrawDetails, ifsc: e.target.value})} className="w-full p-4 bg-[#141414] border border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-white transition-colors uppercase font-mono text-sm" />
                    </>
                )}
              </div>

              <button onClick={handleWithdrawSubmit} disabled={isWithdrawing} className="w-full py-5 bg-[#D4AF37] text-black hover:bg-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] flex justify-center items-center gap-2 disabled:opacity-50">
                  {isWithdrawing ? <RefreshCw size={16} className="animate-spin"/> : `Withdraw ₹${walletPoints.toLocaleString()}`}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REFERRAL MODAL */}
      <AnimatePresence>
        {showReferralModal && (
          <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 h-[100dvh]">
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white border border-gray-100 rounded-[2.5rem] p-8 w-full max-w-md text-black relative shadow-2xl">
              <button onClick={() => setShowReferralModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors bg-gray-50 p-2 rounded-full"><X size={20}/></button>
              
              <div className="text-center mb-8 pt-4">
                  <div className="w-16 h-16 bg-[#D4AF37] text-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"><Gift size={32}/></div>
                  <h3 className="text-2xl font-serif italic font-black">Link Copied!</h3>
                  <p className="text-sm text-gray-500 mt-2">Here is how you earn with Essential Network</p>
              </div>

              <div className="space-y-6 mb-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#0A0A0A] text-[#D4AF37] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md z-10"><Share2 size={16}/></div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-gray-50 border border-gray-100">
                          <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-gray-400">Step 1</p>
                          <p className="text-sm font-bold">Share your link with a friend.</p>
                      </div>
                  </div>
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-gray-200 text-gray-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"><Percent size={16}/></div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-gray-50 border border-gray-100">
                          <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-gray-400">Step 2</p>
                          <p className="text-sm font-bold">They get <span className="text-green-600">₹100 Off</span> instantly at checkout.</p>
                      </div>
                  </div>
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#D4AF37] text-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-md"><Wallet size={16}/></div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                          <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-[#D4AF37]">Step 3</p>
                          <p className="text-sm font-bold text-black">Order is Delivered? You get <span className="text-green-600">₹100</span> in Vault!</p>
                      </div>
                  </div>
              </div>

              <button onClick={() => setShowReferralModal(false)} className="w-full py-4 bg-[#0A0A0A] text-white hover:bg-[#D4AF37] hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                  Got it, Let&apos;s Earn!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-2xl border-b border-gray-100 h-20 px-6 lg:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-black text-[#D4AF37] rounded-xl flex items-center justify-center font-black group-hover:bg-[#D4AF37] group-hover:text-black transition-colors duration-500">♞</div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] hidden md:block">Essential Rush</p>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={handleRefresh} className="p-2 text-gray-400 hover:text-black transition-colors" aria-label="Refresh Data">
            <RefreshCw size={16} className={isPending ? "animate-spin" : ""} />
          </button>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <aside className="hidden lg:block lg:col-span-3 space-y-2 sticky top-32 self-start">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] mb-8 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] to-black"></div>
             <div className="w-20 h-20 bg-[#FAFAFA] border-2 border-gray-100 text-black rounded-[2rem] mx-auto mb-4 flex items-center justify-center font-serif italic text-3xl font-black">{name.charAt(0)}</div>
             <h2 className="font-serif font-black text-2xl tracking-tight">{name}</h2>
             <p className="text-[9px] text-[#D4AF37] font-black uppercase tracking-[0.3em] mt-2 bg-black/5 inline-block px-3 py-1 rounded-full">{loyaltyTier}</p>
          </div>

          <div className="bg-white p-3 rounded-[2rem] border border-gray-100 flex flex-col gap-1">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key as TabType)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === t.key ? "bg-[#0A0A0A] text-[#D4AF37] shadow-lg translate-x-2" : "text-gray-400 hover:bg-gray-50 hover:text-black"}`}>
                <t.icon size={16} className={activeTab === t.key ? "text-[#D4AF37]" : "text-gray-400"} />
                {t.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="lg:col-span-9">
          <AnimatePresence mode="wait">
            
            {activeTab === "overview" && (
              <motion.div key="overview" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] p-10 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.2)] relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                    <div className="absolute -right-10 -bottom-10 text-white/5 rotate-12"><Wallet size={200}/></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Available Vault Credit</p>
                            <h3 className="text-5xl md:text-6xl font-serif italic font-black text-[#D4AF37]">₹{walletPoints.toLocaleString()}</h3>
                        </div>
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white"><Sparkles size={20}/></div>
                    </div>
                    <div className="relative z-10 mt-8 flex gap-4">
                        <button onClick={handleWithdrawClick} className="px-6 py-3 bg-[#D4AF37] text-black hover:bg-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg">Withdraw Funds</button>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 bg-gray-50 text-black rounded-2xl flex items-center justify-center mb-4"><Package size={24}/></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Acquisitions</p>
                    <h3 className="text-4xl font-serif italic font-black">{orders.length}</h3>
                  </div>
                </div>

                <div className="bg-[#0A0A0A] text-[#D4AF37] p-8 md:p-10 rounded-[2.5rem] border border-[#D4AF37]/20 shadow-[0_10px_30px_rgba(212,175,55,0.1)] relative overflow-hidden group flex flex-col justify-center">
                    <div className="absolute -right-6 -bottom-6 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700">
                        <Gift size={150}/>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Essential Network</p>
                            <h4 className="text-3xl md:text-4xl font-serif font-black italic mb-2 text-white">Give Flat ₹100 Off, Get ₹100</h4>
                            <p className="text-xs md:text-sm text-gray-400 max-w-md">Share your exclusive link. When your friend&apos;s order is DELIVERED using your link, they instantly get ₹100 off, and you get ₹100 added to your Vault.</p>
                        </div>
                        
                        <div className="flex flex-col gap-3 w-full md:w-auto shrink-0 z-10">
                            <div className="flex items-center justify-between bg-white/5 p-2 pl-4 rounded-2xl border border-white/10 w-full min-w-[280px]">
                                <div className="truncate text-sm text-gray-400 font-mono">
                                    .../?ref=<span className="text-white font-bold">{initialData?.myReferralCode || "CODE"}</span>
                                </div>
                                <button onClick={handleCopyLink} className={`ml-4 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isCopied ? 'bg-green-500 text-black' : 'bg-[#D4AF37] text-black hover:bg-white'}`}>
                                    {isCopied ? 'Copied!' : 'Copy Link'}
                                </button>
                            </div>
                            
                            <button onClick={handleWithdrawClick} className="w-full py-4 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2">
                                Withdraw as Cash (Min ₹500)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-2xl font-serif font-black tracking-tight">Recent Activity</h4>
                    <button onClick={() => setActiveTab("orders")} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">View All <ChevronRight size={14}/></button>
                  </div>
                  {lastThreeOrders.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {lastThreeOrders.map((o: Order) => (
                          <div key={o._id} className="p-6 rounded-2xl border border-gray-100 hover:border-black transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm"><Package size={18} className="text-gray-400"/></div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{o.orderId}</p>
                                    <p className="font-serif font-black text-lg">{o.items?.[0]?.name || "Luxury Timepiece"}</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                <div className="flex w-full gap-2">
                                  <span className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest w-full sm:w-auto text-center flex items-center justify-center ${o.status === 'DELIVERED' ? 'bg-green-50 text-green-700' : 'bg-[#0A0A0A] text-[#D4AF37]'}`}>{o.status || 'PENDING'}</span>
                                  <SmartTrackButton orderId={o.orderId} email={session?.user?.email || ""} />
                                  <CancelOrderButton orderId={o._id.toString()} status={o.status || 'Pending'} />
                                </div>
                            </div>
                          </div>
                        ))}
                      </div>
                  ) : (
                      <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          <p className="text-sm text-gray-500 font-serif italic">Your vault is currently empty.</p>
                          <Link href="/shop" className="inline-block mt-4 px-6 py-3 bg-black text-[#D4AF37] rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all">Explore Collection</Link>
                      </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div key="profile" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <h3 className="text-3xl font-serif italic font-black tracking-tight mb-8">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Full Name</label>
                    <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={`w-full p-5 bg-gray-50 border rounded-2xl outline-none transition-all focus:bg-white focus:shadow-md ${profileErrors.name ? "border-red-300" : "border-transparent focus:border-[#D4AF37]"}`} />
                    {profileErrors.name && <p className="text-[10px] text-red-500 font-bold ml-2">{profileErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Email Address</label>
                    <input value={profile.email} disabled className="w-full p-5 bg-gray-100 text-gray-500 border border-transparent rounded-2xl cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Phone Number</label>
                    <input placeholder="+91" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className={`w-full p-5 bg-gray-50 border rounded-2xl outline-none transition-all focus:bg-white focus:shadow-md ${profileErrors.phone ? "border-red-300" : "border-transparent focus:border-[#D4AF37]"}`} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Date of Birth</label>
                    <input type="date" value={profile.dob} onChange={(e) => setProfile({ ...profile, dob: e.target.value })} className="w-full p-5 bg-gray-50 border border-transparent rounded-2xl outline-none transition-all focus:bg-white focus:shadow-md focus:border-[#D4AF37] text-gray-600" />
                  </div>
                </div>
                <div className="mt-10 pt-8 border-t border-gray-100 flex justify-end">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={saveProfile} disabled={profileSaving} className="px-8 py-4 bg-[#0A0A0A] hover:bg-[#D4AF37] text-white hover:text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-colors shadow-lg disabled:opacity-50">
                    {profileSaving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Save Details
                    </motion.button>
                </div>
              </motion.div>
            )}

            {activeTab === "orders" && (
              <motion.div key="orders" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                {orders.length > 0 ? orders.map((order: Order) => (
                  <div key={order._id} className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between xl:items-center gap-6 hover:border-black transition-colors group">
                    <div className="flex gap-6 items-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-2xl p-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                            {order.items?.[0]?.imageUrl ? <img src={order.items[0].imageUrl} alt="watch" className="max-h-full object-contain" /> : <Package size={24} className="text-gray-300"/>}
                        </div>
                        <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{order.orderId}</p>
                        <h4 className="text-xl font-serif font-black italic">{order.items?.[0]?.name || "Luxury Timepiece"}</h4>
                        <p className="text-sm text-gray-500 mt-1 font-bold">Total: ₹{Number(order.totalAmount || 0).toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                      <div className="flex w-full gap-2">
                        <span className={`px-4 py-3 flex-1 flex items-center justify-center rounded-xl text-[9px] font-black uppercase tracking-widest ${order.status === 'DELIVERED' ? 'bg-green-50 text-green-700' : 'bg-black text-[#D4AF37]'}`}>{order.status || 'PENDING'}</span>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => notify("Downloading PDF Invoice...")} className="px-6 py-3 flex-1 flex items-center justify-center rounded-xl border border-gray-200 hover:border-black text-[10px] font-black uppercase tracking-widest transition-colors gap-2"><Download size={14}/> Invoice</motion.button>
                      </div>
                      <div className="flex w-full gap-2">
                        <SmartTrackButton orderId={order.orderId} email={session?.user?.email || ""} />
                        <CancelOrderButton orderId={order._id.toString()} status={order.status || 'Pending'} />
                      </div>
                    </div>
                  </div>
                )) : (
                    <div className="bg-white p-12 rounded-[2.5rem] text-center border border-gray-100">
                        <History size={48} className="mx-auto text-gray-200 mb-4" />
                        <h3 className="text-2xl font-serif italic mb-2">No Acquisitions Yet</h3>
                        <p className="text-gray-500 mb-6">Your order history will appear here.</p>
                        <Link href="/shop" className="inline-block px-8 py-4 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Start Exploring</Link>
                    </div>
                )}
              </motion.div>
            )}

            {activeTab === "addresses" && (
              <motion.div key="addresses" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <h4 className="text-xl font-serif font-black tracking-tight mb-6">Add New Location</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input placeholder="Street Address / Building" value={addrForm.line1} onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })} className="p-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-[#D4AF37] focus:shadow-md transition-all" />
                    <input placeholder="City" value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} className="p-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-[#D4AF37] focus:shadow-md transition-all" />
                    <input placeholder="State" value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} className="p-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-[#D4AF37] focus:shadow-md transition-all" />
                    <input placeholder="Pincode" value={addrForm.zip} onChange={(e) => setAddrForm({ ...addrForm, zip: e.target.value })} className="p-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-[#D4AF37] focus:shadow-md transition-all" />
                  </div>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-6 pt-6 border-t border-gray-100 gap-4">
                    <label className="flex items-center gap-3 text-sm text-gray-600 font-bold cursor-pointer">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border ${addrForm.isDefault ? 'bg-black border-black' : 'border-gray-300'}`}>
                          {addrForm.isDefault && <CheckCircle2 size={12} className="text-white"/>}
                      </div>
                      <input type="checkbox" className="hidden" checked={addrForm.isDefault} onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })} />
                      Set as primary delivery address
                    </label>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={addAddress} disabled={isPending} className="w-full md:w-auto px-8 py-4 bg-black hover:bg-[#D4AF37] text-white hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                      {isPending ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />} Save Address
                    </motion.button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addrLoading
                    ? Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-40 bg-white rounded-[2rem] border border-gray-100 animate-pulse" />)
                    : addresses.map((a: Address) => (
                        <div key={a._id} className={`p-8 rounded-[2.5rem] border-2 transition-all relative overflow-hidden ${a.isDefault ? 'border-black shadow-lg bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-300'}`}>
                          {a.isDefault && <div className="absolute top-0 right-0 bg-black text-[#D4AF37] text-[8px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-bl-2xl">Primary</div>}
                          
                          <div className="flex items-start gap-3 mb-4">
                              <MapPin size={20} className={a.isDefault ? "text-black" : "text-gray-400"}/>
                              <div>
                                <p className="font-serif font-black text-lg mb-1">{a.line1 || a.address || "Saved Location"}</p>
                                <p className="text-sm text-gray-500 leading-relaxed">{[a.city, a.state, a.zip].filter(Boolean).join(", ")}</p>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200/50">
                            {!a.isDefault && (
                              <button onClick={() => setDefaultAddress(a._id)} disabled={isPending} className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 hover:border-black text-[9px] font-black uppercase tracking-widest transition-all text-center">
                                Make Primary
                              </button>
                            )}
                            <button onClick={() => removeAddress(a._id)} disabled={isPending} className="px-4 py-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                              {isPending ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />} Remove
                            </button>
                          </div>
                        </div>
                      ))}
                </div>
              </motion.div>
            )}

            {activeTab === "wishlist" && (
              <motion.div key="wishlist" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistLoading
                    ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-80 bg-white rounded-[2rem] border border-gray-100 animate-pulse" />)
                    : wishlist.length > 0 ? wishlist.map((w: WishlistItem) => (
                        <div key={w._id} className="p-6 rounded-[2rem] border border-gray-100 bg-white flex flex-col justify-between group hover:shadow-2xl transition-all duration-500">
                          <div className="aspect-[4/5] bg-gray-50 rounded-[1.5rem] flex items-center justify-center p-6 relative overflow-hidden mb-6">
                            <img src={w.imageUrl || w.images?.[0]} className="max-h-full object-contain group-hover:scale-110 transition-transform duration-700" alt="" />
                            <button onClick={() => notify("Removed from Wishlist")} className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md text-red-500 hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={14}/></button>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-1">{w.brand || "Essential"}</p>
                            <p className="font-serif font-black text-lg leading-tight mb-2 line-clamp-1">{w.name || w.title}</p>
                            <p className="text-sm font-bold text-gray-400">₹{Number(w.offerPrice || w.price).toLocaleString()}</p>
                          </div>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => moveToCart(w)} className="mt-6 w-full py-4 rounded-xl bg-[#0A0A0A] hover:bg-[#D4AF37] text-white hover:text-black text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg">Add to Cart</motion.button>
                        </div>
                      )) : (
                        <div className="col-span-full bg-white p-12 rounded-[2.5rem] text-center border border-gray-100">
                            <Heart size={48} className="mx-auto text-gray-200 mb-4" />
                            <h3 className="text-2xl font-serif italic mb-2">Your Wishlist is Empty</h3>
                            <p className="text-gray-500 mb-6">Curate your collection of premium timepieces here.</p>
                            <Link href="/shop" className="inline-block px-8 py-4 bg-black text-[#D4AF37] rounded-xl text-[10px] font-black uppercase tracking-widest">Discover Collection</Link>
                        </div>
                      )}
                </div>
              </motion.div>
            )}

            {activeTab === "offers" && (
              <motion.div key="offers" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                      { code: "VIPWELCOME", desc: "Flat 10% off on your first acquisition", tag: "NEW" }, 
                      { code: "VAULT50K", desc: "Get ₹50,000 off on orders above ₹10L", tag: "PREMIUM" }, 
                      { code: "COMPLIMENTARY", desc: "Free insured shipping globally", tag: "SHIPPING" }
                  ].map((offer) => (
                    <div key={offer.code} className="p-8 rounded-[2.5rem] border border-[#D4AF37]/30 bg-white flex flex-col justify-between relative overflow-hidden group hover:border-[#D4AF37] transition-colors">
                      <div className="absolute -right-6 -top-6 text-[#D4AF37]/5 rotate-12 group-hover:scale-110 transition-transform duration-700"><Percent size={150}/></div>
                      <div className="relative z-10 mb-8">
                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-[8px] font-black uppercase tracking-widest rounded-full mb-4">{offer.tag}</span>
                        <h4 className="text-3xl font-serif italic font-black mb-2">{offer.desc}</h4>
                      </div>
                      <div className="relative z-10 flex items-center justify-between bg-gray-50 p-2 pl-6 rounded-2xl border border-gray-100">
                         <p className="font-mono font-bold text-lg tracking-widest">{offer.code}</p>
                         <motion.button whileTap={{ scale: 0.9 }} onClick={() => { navigator.clipboard.writeText(offer.code); notify(`Code ${offer.code} copied!`); }} className="p-4 bg-black text-[#D4AF37] rounded-xl hover:bg-[#D4AF37] hover:text-black transition-colors"><Copy size={16}/></motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div key="security" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-sm max-w-2xl">
                  <h3 className="text-3xl font-serif italic font-black tracking-tight mb-2">Account Security</h3>
                  <p className="text-gray-500 text-sm mb-8">Ensure your vault remains protected with a strong password.</p>
                  <div className="space-y-4">
                    <input type="password" placeholder="Current Password" className="w-full p-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-black transition-all" />
                    <input type="password" placeholder="New Password" className="w-full p-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-black transition-all" />
                    <input type="password" placeholder="Confirm New Password" className="w-full p-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-black transition-all" />
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => notify("Security credentials updated securely.")} className="mt-8 w-full md:w-auto px-10 py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-colors shadow-lg">
                      Update Password
                  </motion.button>
                </div>
              </motion.div>
            )}

            {activeTab === "support" && (
              <motion.div key="support" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <h3 className="text-3xl font-serif italic font-black tracking-tight mb-8">Luxury Concierge</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                      <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4"><HelpCircle size={24} className="text-[#D4AF37]"/></div>
                          <h4 className="font-serif font-black text-xl mb-2">Live Assistance</h4>
                          <p className="text-sm text-gray-500 mb-6">Our experts are available 24/7 for bespoke inquiries.</p>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => window.open('https://wa.me/917991458280', '_blank')} className="px-8 py-4 bg-black text-[#D4AF37] rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg w-full">Chat on WhatsApp</motion.button>
                      </div>
                      <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4"><HelpCircle size={24} className="text-[#D4AF37]"/></div>
                          <h4 className="font-serif font-black text-xl mb-2">Schedule a Call</h4>
                          <p className="text-sm text-gray-500 mb-6">Prefer speaking? Request a callback from our team.</p>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => notify("Callback request submitted. Our team will contact you shortly.")} className="px-8 py-4 border-2 border-black text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors w-full">Request Callback</motion.button>
                      </div>
                  </div>

                  <h4 className="text-xl font-serif font-black tracking-tight mb-6">Frequently Asked Questions</h4>
                  <div className="space-y-4">
                    {[
                      { 
                        q: "Are your timepieces authentic?", 
                        a: "Yes, every timepiece listed on Essential-Rush is 100% authentic. We take great pride in our curation process, ensuring that every watch meets the highest standards of luxury horology." 
                      },
                      { 
                        q: "What are the shipping timelines?", 
                        a: "We provide complimentary insured global shipping. Domestic deliveries take 2-4 business days, while international acquisitions take 5-10 business days." 
                      },
                      { 
                        q: "Can I cancel my order?", 
                        a: "Yes, you can cancel your order within 24 hours of purchase, provided it has not already been dispatched. You can do this easily through your account dashboard." 
                      }
                    ].map((f, i) => (
                      <details key={i} className="group bg-gray-50 rounded-[1.5rem] border border-gray-100 overflow-hidden">
                        <summary className="p-6 font-semibold cursor-pointer list-none flex justify-between items-center text-[#0A0A0A]">
                          {f.q}
                          <span className="group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <p className="px-6 pb-6 text-gray-600 text-sm leading-relaxed">
                          {f.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "wallet" && (
                <motion.div key="wallet" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="bg-white p-12 rounded-[2.5rem] border border-gray-100 text-center">
                    <Wallet size={48} className="mx-auto text-gray-200 mb-4" />
                    <h3 className="text-2xl font-serif italic mb-2">Vault Transactions</h3>
                    <p className="text-gray-500 mb-6">Your transaction history and saved cards will appear here.</p>
                </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-gray-100 p-2 pb-safe flex justify-around items-center lg:hidden z-[100] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {[
            { key: "overview", icon: Sparkles, label: "Home" }, 
            { key: "orders", icon: Package, label: "Orders" }, 
            { key: "wishlist", icon: Heart, label: "Saved" }, 
            { key: "profile", icon: User, label: "Profile" }
        ].map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key as TabType)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${activeTab === t.key ? "text-[#D4AF37]" : "text-gray-400 hover:text-black"}`}>
            <t.icon size={20} className={activeTab === t.key ? "fill-[#D4AF37]/20" : ""} />
            <span className="text-[8px] font-black uppercase tracking-widest">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}