"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShieldCheck, MapPin, CheckCircle2, Tag, UserPlus, X, RefreshCcw, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cartStoretemp";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}

interface AppliedCoupon {
  code: string;
  discountValue: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [isMounted, setIsMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useWallet, setUseWallet] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: session?.user?.email || "",
    phone: (session?.user as any)?.phone || "",
    address: "",
    city: "",
    pincode: "",
  });

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [appliedReferral, setAppliedReferral] = useState<string | null>(null);

  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setIsMounted(true);
    const savedRef = localStorage.getItem("er_ref");
    if (savedRef) {
      setAppliedReferral(savedRef);
    }
  }, []);

  const subtotal = (items || []).reduce(
    (acc, item) => acc + (item.offerPrice || item.price || 0) * (item.quantity || 1),
    0
  );
  const shipping = subtotal > 10000 ? 0 : 500;

  const walletBalance = (session?.user as { walletBalance?: number })?.walletBalance || 0;
  const walletDiscount = useWallet ? Math.min(walletBalance, subtotal * 0.1) : 0;
  const couponDiscount = appliedCoupon ? subtotal * (appliedCoupon.discountValue / 100) : 0;
  const referralDiscount = appliedReferral ? 100 : 0;

  const total = Math.max(0, subtotal + shipping - walletDiscount - couponDiscount - referralDiscount);

  // Background sync for abandoned cart tracking
  const triggerAbandonedCartSync = async (step: "CONTACT" | "SHIPPING" | "PAYMENT" = "CONTACT") => {
    if (!formData.phone && !formData.email) return;

    try {
      await fetch("/api/cart/abandoned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim() || undefined,
          email: formData.email,
          phone: formData.phone,
          items: items.map((item) => ({
            productId: item._id,
            name: item.name,
            price: item.offerPrice || item.price,
            quantity: item.quantity || 1,
            image: item.imageUrl || (item as any).images?.[0] || "",
          })),
          cartTotal: total,
          checkoutStep: step,
          status: "ABANDONED",
        }),
      });
    } catch {
      // Background sync silently fails to not disrupt checkout
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApplyCoupon = async () => {
    if (!couponInput) return;
    setCouponError("");
    try {
      const res = await fetch(`/api/coupons?t=${Date.now()}`);
      const data = await res.json();
      const found = data.data?.find((c: any) => c.code.toUpperCase() === couponInput.toUpperCase());

      if (found) {
        const minVal = found.minOrder || found.minOrderValue || 0;
        if (subtotal >= minVal) {
          setAppliedCoupon({ code: found.code, discountValue: found.discountValue });
          setCouponInput("");
        } else {
          setCouponError(`Minimum order value must be ₹${minVal}`);
        }
      } else {
        setCouponError("Invalid or expired coupon code.");
      }
    } catch {
      setCouponError("Failed to verify coupon.");
    }
  };

  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.phone || !formData.address) {
      setErrorMessage("Please complete all required shipping fields.");
      setShowErrorDialog(true);
      return;
    }

    setIsProcessing(true);

    try {
      const orderPayload = {
        customerInfo: formData,
        items: items.map((item) => ({
          productId: item._id,
          name: item.name,
          price: item.offerPrice || item.price,
          qty: item.quantity || 1,
          imageUrl: item.imageUrl || "",
        })),
        totalAmount: total,
        paymentStatus: "Paid",
        couponCode: appliedCoupon?.code || null,
        referralCode: appliedReferral || null,
        discountApplied: couponDiscount + walletDiscount + referralDiscount,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Mark abandoned cart as converted
        await triggerAbandonedCartSync("PAYMENT");
        clearCart();
        const orderId = data.orderId || data.data?._id || `ORD-${Date.now().toString().slice(-8)}`;
        router.push(`/order-success/${orderId}`);
      } else {
        setErrorMessage(data.error || "Order creation failed.");
        setShowErrorDialog(true);
      }
    } catch {
      setErrorMessage("Network error processing transaction. Please retry.");
      setShowErrorDialog(true);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="animate-pulse w-12 h-12 bg-black text-[#D4AF37] rounded-2xl flex items-center justify-center font-black text-xl mb-4">
          ♞
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl mb-6">
          <ShieldCheck size={32} className="text-[#D4AF37]" />
        </div>
        <h2 className="text-3xl font-serif italic text-black mb-4">Your Vault is Empty</h2>
        <Link
          href="/"
          className="bg-black text-white px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest mt-4 hover:bg-[#D4AF37] hover:text-black transition-colors"
        >
          Return to Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#050505] font-sans pb-20">
      <header className="bg-white border-b border-gray-100 h-20 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-50">
        <Link href="/cart" className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors">
          <ArrowLeft size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Cart</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black text-[#D4AF37] rounded-lg flex items-center justify-center font-black text-sm">
            ♞
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] hidden sm:block">Secure Checkout</p>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <ShieldCheck size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">SSL Secured</span>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-16">
          <div className="flex-1">
            {/* Shipping Details */}
            <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] mb-8">
              <h3 className="text-xl font-serif italic mb-8 flex items-center gap-3">
                <MapPin className="text-[#D4AF37]" size={24} /> Shipping Details
              </h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                      First Name *
                    </label>
                    <input
                      required
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onBlur={() => triggerAbandonedCartSync("CONTACT")}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-black rounded-xl px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-black rounded-xl px-4 py-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                      Email Address *
                    </label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={() => triggerAbandonedCartSync("CONTACT")}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-black rounded-xl px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                      Phone Number *
                    </label>
                    <input
                      required
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={() => triggerAbandonedCartSync("SHIPPING")}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-black rounded-xl px-4 py-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                    Complete Address *
                  </label>
                  <input
                    required
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-black rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-black rounded-xl px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Postal Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-black rounded-xl px-4 py-3 text-sm outline-none"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Promotions */}
            <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] mb-8">
              <h3 className="text-xl font-serif italic mb-6 flex items-center gap-3">
                <Tag className="text-[#D4AF37]" size={24} /> Promotions & Referrals
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                    Discount Coupon
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 px-4 py-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-600" />
                        <span className="text-sm font-bold text-green-700">
                          {appliedCoupon.code} Applied (-{appliedCoupon.discountValue}%)
                        </span>
                      </div>
                      <button onClick={() => setAppliedCoupon(null)} className="text-gray-400 hover:text-red-500">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="flex-1 bg-gray-50 border border-gray-200 focus:border-black rounded-xl px-4 py-3 text-sm outline-none uppercase font-mono tracking-wider"
                        placeholder="ENTER CODE"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="bg-black text-white px-6 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-red-500 text-xs mt-2 font-medium">{couponError}</p>}
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                    Referral Reward
                  </label>
                  {appliedReferral ? (
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-4 py-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <UserPlus size={16} className="text-blue-600" />
                        <span className="text-sm font-bold text-blue-700">Auto-Linked: {appliedReferral} (-₹100)</span>
                      </div>
                      <button
                        onClick={() => {
                          setAppliedReferral(null);
                          localStorage.removeItem("er_ref");
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 font-medium italic">
                      No referral code linked. Use a referral link to unlock ₹100 instant acquisition credit.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-[450px] flex-shrink-0">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sticky top-32">
              <h3 className="text-xl font-serif italic mb-8 border-b border-gray-100 pb-6">Order Summary</h3>
              <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={item._id} className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-xl p-2 border border-gray-100 shrink-0">
                      <img src={item.imageUrl || (item as any).images?.[0] || "/placeholder.png"} className="w-full h-full object-contain" alt={item.name} />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-1">{item.brand}</p>
                      <p className="text-sm font-bold leading-tight mb-2 line-clamp-2">{item.name}</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Qty: {item.quantity || 1}</span>
                        <span className="font-black font-serif">
                          ₹{((item.offerPrice || item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-6 space-y-4 mb-8">
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>Subtotal</span>
                  <span className="text-black">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm font-medium text-green-600">
                    <span>Coupon ({appliedCoupon?.discountValue}%)</span>
                    <span>- ₹{couponDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {referralDiscount > 0 && (
                  <div className="flex justify-between text-sm font-medium text-blue-600">
                    <span>Referral Discount</span>
                    <span>- ₹{referralDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>Secured Shipping</span>
                  <span className="text-black">{shipping === 0 ? "Complimentary" : `₹${shipping}`}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Acquisition</span>
                  <span className="text-3xl font-serif font-black text-[#D4AF37]">₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button
                onClick={processPayment}
                disabled={isProcessing}
                className="w-full bg-[#0A0A0A] text-[#D4AF37] py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isProcessing ? <RefreshCcw size={16} className="animate-spin" /> : "Pay Securely"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showErrorDialog && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
            onClick={() => setShowErrorDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <X size={32} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-serif text-center mb-4">Attention Required</h3>
              <p className="text-gray-600 text-center mb-8">{errorMessage}</p>
              <button
                onClick={() => setShowErrorDialog(false)}
                className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#D4AF37] hover:text-black transition-colors"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}