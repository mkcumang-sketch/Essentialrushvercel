"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Wallet,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useHydratedCart } from "@/store/cartStoretemp";

// =========================================================
// STRICT INTERFACES
// =========================================================
interface SessionUser {
  id?: string;
  email?: string;
  name?: string;
  walletBalance?: number;
}

interface CartItem {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  brand?: string;
  price?: number;
  offerPrice?: number;
  imageUrl?: string;
  images?: string[];
  quantity: number;
  qty?: number;
}

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}

export default function Checkout() {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  // Typecast items to ensure strict TypeScript compliance
  const { items: rawItems, _hasHydrated, clearCart } = useHydratedCart();
  const items = rawItems as unknown as CartItem[];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useWallet, setUseWallet] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: "",
    lastName: "",
    email: user?.email ?? "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  // Sync email when session loads
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email! }));
    }
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ show: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  // ===============================
  // CALCULATIONS
  // ===============================
  const subtotal = items.reduce(
    (acc: number, item: CartItem) =>
      acc + Number(item.offerPrice ?? item.price ?? 0) * (item.quantity || item.qty || 1),
    0
  );

  const shipping = subtotal > 10000 ? 0 : 500;
  const walletBalance = user?.walletBalance ?? 0;
  const discount = useWallet ? Math.min(walletBalance, subtotal * 0.1) : 0;
  const total = subtotal + shipping - discount;

  // ===============================
  // HANDLERS
  // ===============================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict frontend validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address) {
        showToast("Please complete all shipping details.", "error");
        return;
    }

    setIsProcessing(true);

    try {
      const orderPayload = {
        userId: user?.id ?? null,
        customerInfo: formData,
        orderItems: items,
        subtotal,
        shippingFee: shipping,
        discount,
        totalAmount: total,
        paymentStatus: "PENDING",
        status: "PENDING",
        useWallet,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        showToast(errorData.message || "Failed to secure order. Please try again.", "error");
        setIsProcessing(false);
        return;
      }

      clearCart();
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      showToast("Network error. Please verify your connection.", "error");
      setIsProcessing(false);
    } 
  };

  // ===============================
  // RENDER: HYDRATION SKELETON
  // ===============================
  if (!_hasHydrated) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#F7F7F7]">
        <div className="text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-black rounded-2xl text-[#D4AF37] flex items-center justify-center text-3xl font-black mb-6 shadow-xl relative overflow-hidden">
            <span className="relative z-10">♞</span>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
          <Loader2 size={24} className="animate-spin text-[#D4AF37] mb-4" />
          <p className="text-[10px] uppercase tracking-[0.4em] font-black text-gray-500 animate-pulse">
            Securing Vault Checkout...
          </p>
        </div>
      </div>
    );
  }

  // ===============================
  // RENDER: EMPTY CART
  // ===============================
  if (items.length === 0 && step !== 3) {
    return (
      <div className="min-h-[100dvh] bg-[#F7F7F7] flex flex-col items-center justify-center px-4 text-center">
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center mb-8 border border-gray-100"
        >
          <ShieldCheck size={40} className="text-gray-300" />
        </motion.div>
        <h2 className="text-4xl font-serif italic mb-4 font-bold text-black">Your Vault is Empty</h2>
        <p className="text-gray-500 mb-10 text-sm font-medium">Add some luxury timepieces to proceed with acquisition.</p>
        <Link
          href="/shop"
          className="bg-black text-white px-10 py-5 rounded-full text-[10px] uppercase tracking-widest font-black hover:bg-[#D4AF37] hover:text-black transition-colors shadow-lg"
        >
          Return to Collection
        </Link>
      </div>
    );
  }

  // ===============================
  // RENDER: MAIN CHECKOUT
  // ===============================
  return (
    <div className="min-h-[100dvh] bg-[#F7F7F7] text-[#050505] font-sans pb-20">
      
      {/* LUXURY TOAST */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: "-50%" }} 
            animate={{ opacity: 1, y: 0, x: "-50%" }} 
            exit={{ opacity: 0, y: -50, x: "-50%" }} 
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-8 left-1/2 z-[200] bg-[#0A0A0A] border border-[#D4AF37]/30 text-white px-6 py-4 rounded-full flex items-center gap-4 shadow-2xl backdrop-blur-md w-max max-w-[90vw]"
          >
            {toast.type === 'success' ? (
                <CheckCircle2 size={18} className="text-[#D4AF37] shrink-0" />
            ) : (
                <XCircle size={18} className="text-red-500 shrink-0" />
            )}
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 h-20 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-50">
        <Link href="/cart" className="flex items-center gap-3 text-gray-400 hover:text-black transition-colors group">
          <div className="p-2 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors">
              <ArrowLeft size={16} />
          </div>
          <span className="text-[10px] uppercase tracking-widest font-black hidden sm:block">Return</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-black rounded-xl text-[#D4AF37] flex items-center justify-center font-black shadow-md">♞</div>
          <p className="hidden sm:block text-[10px] uppercase tracking-[0.4em] font-black">Secure Checkout</p>
        </div>
        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-100">
          <ShieldCheck size={14} />
          <span className="hidden sm:block text-[9px] uppercase tracking-widest font-black">256-Bit SSL</span>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <AnimatePresence mode="wait">
          
          {/* SUCCESS STATE */}
          {step === 3 ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl mx-auto bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl text-center border border-gray-100 mt-10 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.05),transparent_50%)] pointer-events-none" />
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-100 shadow-inner"
              >
                <CheckCircle2 size={48} className="text-green-500" />
              </motion.div>

              <h2 className="text-4xl md:text-5xl font-serif italic text-black mb-4 font-bold">Acquisition Secured</h2>
              <p className="text-gray-500 mb-10 leading-relaxed font-medium">
                Your luxury timepiece will be prepared and shipped shortly. A confirmation dispatch has been sent to your email.
              </p>

              <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-100 rounded-3xl p-8 mb-10 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <p className="text-[10px] uppercase tracking-[0.3em] font-black text-gray-400 mb-2">Order Reference</p>
                <p className="font-mono font-bold text-2xl text-black">#RUSH-{Math.floor(Math.random() * 1000000)}</p>
              </div>

              <Link
                href="/"
                className="inline-block bg-black text-white px-12 py-5 rounded-full text-[10px] uppercase tracking-widest font-black hover:bg-[#D4AF37] hover:text-black transition-all shadow-xl"
              >
                Return to Gallery
              </Link>
            </motion.div>
          ) : (
            
            /* CHECKOUT FORM STATE */
            <motion.div
              key="checkout"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col lg:flex-row gap-10 xl:gap-16"
            >
              {/* LEFT COLUMN: FORMS */}
              <div className="flex-1">
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8 sm:p-10 mb-8">
                  <h3 className="text-2xl font-serif italic font-bold flex items-center gap-3 mb-10 text-black">
                    <div className="p-3 bg-[#D4AF37]/10 rounded-xl"><MapPin size={20} className="text-[#D4AF37]" /></div>
                    Shipping Destination
                  </h3>

                  <form className="space-y-6" id="checkout-form" onSubmit={processPayment}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-3 ml-2">First Name</label>
                        <input
                          required
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:bg-white focus:border-black transition-all text-sm font-bold"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-3 ml-2">Last Name</label>
                        <input
                          required
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:bg-white focus:border-black transition-all text-sm font-bold"
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-3 ml-2">Email Address</label>
                        <input
                          required
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:bg-white focus:border-black transition-all text-sm font-bold"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-3 ml-2">Phone Number</label>
                        <input
                          required
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:bg-white focus:border-black transition-all text-sm font-bold font-mono"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-3 ml-2">Street Address</label>
                      <input
                        required
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:bg-white focus:border-black transition-all text-sm font-bold"
                        placeholder="House / Apartment / Street"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-3 ml-2">City</label>
                        <input
                          required
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:bg-white focus:border-black transition-all text-sm font-bold"
                          placeholder="Mumbai"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-3 ml-2">Postal Code</label>
                        <input
                          required
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:bg-white focus:border-black transition-all text-sm font-bold font-mono"
                          placeholder="400001"
                        />
                      </div>
                    </div>
                  </form>
                </div>

                {/* WALLET SECTION */}
                {session && walletBalance > 0 && (
                  <div className="bg-[#0A0A0A] rounded-[2.5rem] p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl border border-[#D4AF37]/20 group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                      <Wallet size={150} />
                    </div>
                    
                    <h3 className="text-2xl font-serif italic font-bold flex items-center gap-3 mb-4 relative z-10">
                      <div className="p-2 bg-[#D4AF37]/20 rounded-xl"><Wallet size={20} className="text-[#D4AF37]" /></div>
                      Luxury Vault Points
                    </h3>
                    
                    <p className="text-gray-400 mb-8 relative z-10 text-sm font-bold tracking-widest uppercase">
                      Available Balance: 
                      <span className="text-[#D4AF37] font-mono text-xl ml-3">₹{walletBalance.toLocaleString()}</span>
                    </p>

                    <label className="flex items-center gap-4 cursor-pointer relative z-10 w-max" onClick={() => setUseWallet(!useWallet)}>
                      <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${useWallet ? "bg-[#D4AF37] border-[#D4AF37]" : "border-gray-600 bg-white/5"}`}>
                        <motion.div initial={false} animate={{ scale: useWallet ? 1 : 0 }}>
                            <CheckCircle2 size={16} className="text-black" />
                        </motion.div>
                      </div>
                      <span className="text-sm font-bold tracking-wide">Apply Vault Points <span className="text-gray-400 font-normal">(Maximum 10% deduction)</span></span>
                    </label>
                  </div>
                )}
              </div>

              {/* RIGHT SIDE: ORDER SUMMARY */}
              <div className="lg:w-[450px] flex-shrink-0">
                <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sticky top-32">
                  <h3 className="text-2xl font-serif italic font-bold mb-8 border-b border-gray-100 pb-6 text-black">
                    Order Summary
                  </h3>

                  <div className="space-y-6 mb-8 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((item) => (
                      <div key={item._id || item.id} className="flex gap-5 group">
                        <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-100 p-2 flex items-center justify-center flex-shrink-0">
                          <img
                            src={item.imageUrl || (item.images && item.images[0]) || "/placeholder.png"}
                            alt={item.name || item.title}
                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex-1 pt-1 flex flex-col justify-center">
                          {item.brand && <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-1">{item.brand}</p>}
                          <p className="text-sm font-bold leading-tight mb-2 line-clamp-2 text-black">{item.name || item.title}</p>
                          <div className="flex justify-between items-center text-xs mt-auto">
                            <span className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">Qty: {item.quantity || item.qty || 1}</span>
                            <span className="font-black font-mono text-black">₹{(Number(item.offerPrice ?? item.price ?? 0) * (item.quantity || item.qty || 1)).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 pt-8 space-y-5 mb-8">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-mono text-black">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-gray-500">Secured Shipping</span>
                      <span className="font-mono text-black">{shipping === 0 ? <span className="text-green-600 uppercase text-[10px] tracking-widest">Complimentary</span> : `₹${shipping.toLocaleString()}`}</span>
                    </div>
                    {useWallet && discount > 0 && (
                      <div className="flex justify-between text-sm font-bold text-[#D4AF37]">
                        <span>Vault Points Applied</span>
                        <span className="font-mono">- ₹{discount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-8 mb-10 bg-gray-50 -mx-10 px-10 pb-8 rounded-b-[2.5rem]">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500">Total Acquisition</span>
                      <span className="text-4xl font-serif font-black text-black tracking-tight">₹{total.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={isProcessing}
                    className="w-full bg-[#0A0A0A] text-[#D4AF37] py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#D4AF37] hover:text-black transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
                  >
                    <AnimatePresence mode="wait">
                        {isProcessing ? (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <Loader2 size={20} className="animate-spin" />
                            </motion.div>
                        ) : (
                            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                <CreditCard size={18} /> Pay Securely
                            </motion.div>
                        )}
                    </AnimatePresence>
                  </button>

                  <div className="mt-6 flex items-center justify-center gap-2 text-gray-400">
                    <ShieldCheck size={14} className="text-green-600" />
                    <p className="text-[9px] uppercase tracking-widest font-bold">256-bit Encryption • Secure Gateway</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}