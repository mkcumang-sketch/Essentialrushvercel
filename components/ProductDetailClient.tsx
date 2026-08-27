"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  ShieldCheck, 
  RotateCcw, 
  Truck, 
  CheckCircle2, 
  Star, 
  Plus, 
  Minus, 
  Sparkles,
  ChevronDown
} from "lucide-react";
import { useSession } from "next-auth/react";

// 🚀 HYDRATED CART STORE
import { useHydratedCart } from "@/store/cartStoretemp";

// =========================================================
// STRICT INTERFACES
// =========================================================
export interface ProductDetailProps {
  product: {
    _id: string;
    name?: string;
    title?: string;
    brand: string;
    category: string;
    price: number;
    offerPrice?: number;
    imageUrl?: string;
    images?: string[];
    description?: string;
    features?: string[];
    specs?: Record<string, string>;
    stock?: number;
    badge?: string;
    slug?: string;
  };
  reviews?: Array<{
    _id: string;
    userName: string;
    comment: string;
    rating: number;
  }>;
}

export default function ProductDetailClient({ product, reviews = [] }: ProductDetailProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
const { addItem } = useHydratedCart();
  const imagesList = product.images && product.images.length > 0 
    ? product.images 
    : [product.imageUrl || "https://images.unsplash.com/photo-1587836374828-cb4387df3c56?q=80&w=1000"];

  const [activeImage, setActiveImage] = useState(imagesList[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const displayTitle = product.name || product.title || "Masterpiece Timepiece";
  const finalPrice = Number(product.offerPrice || product.price || 0);

  // 4D Tilt Physics for Main Watch Image
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);
  const springConfig = { damping: 30, stiffness: 150, mass: 0.5 };
  const smoothRotateX = useSpring(rotateX, springConfig);
  const smoothRotateY = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddToCart = () => {
    if (status === "unauthenticated" || !session) {
      router.push("/login");
      return;
    }

    addItem({
      ...product,
      id: product._id,
      quantity,
    } as any);

    triggerToast(`Added ${quantity}x ${displayTitle} to your vault.`);
  };

  return (
    <div className="min-h-[100dvh] bg-[#F6F1E7] text-black font-sans pb-32 pt-12 md:pt-20 selection:bg-[#D4AF37] selection:text-black">
      
      {/* LUXURY TOAST */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%" }}
            className="fixed bottom-10 left-1/2 z-[3000] bg-white/95 backdrop-blur-xl border border-gray-200 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px]"
          >
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0">
              <ShoppingBag size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[3px] text-gray-500">Vault Notice</p>
              <p className="text-gray-900 text-sm font-serif italic">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-[1600px] mx-auto px-6 md:px-16">
        
        {/* TOP BREADCRUMB / BRAND */}
        <div className="mb-12 flex items-center justify-between border-b border-gray-200 pb-6">
          <div>
            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[5px] mb-2">
              {product.brand}
            </p>
            <h1 className="text-4xl md:text-6xl font-serif font-bold italic tracking-tight">
              {displayTitle}
            </h1>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-black uppercase tracking-[3px] text-gray-400">Valuation</p>
            <p className="font-mono text-3xl font-bold tracking-tight">₹{finalPrice.toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* MAIN PRODUCT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          
          {/* LEFT: 4D INTERACTIVE GALLERY */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ rotateX: smoothRotateX, rotateY: smoothRotateY, transformStyle: "preserve-3d" }}
              className="relative aspect-square w-full bg-white rounded-[3rem] p-12 md:p-20 flex items-center justify-center shadow-[0_30px_70px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden perspective-[1200px]"
            >
              {product.badge && (
                <span className="absolute top-8 left-8 bg-black text-[#D4AF37] text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full z-20 shadow-md">
                  {product.badge}
                </span>
              )}

              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  src={activeImage}
                  initial={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.05, filter: "blur(5px)" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  alt={displayTitle}
                  className="max-h-[500px] object-contain mix-blend-multiply drop-shadow-2xl"
                  style={{ transform: "translateZ(50px)" }}
                />
              </AnimatePresence>
            </motion.div>

            {/* THUMBNAILS */}
            {imagesList.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    aria-label={`View image thumbnail ${idx + 1}`}
                    className={`w-24 h-24 rounded-2xl bg-white p-3 border-2 transition-all duration-300 flex items-center justify-center shrink-0 ${
                      activeImage === img ? "border-black shadow-lg scale-105" : "border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="max-h-full object-contain mix-blend-multiply" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: BUYBOX & DETAILS */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
              
              <div className="flex justify-between items-baseline mb-8 md:hidden">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Valuation</span>
                <span className="font-mono text-3xl font-bold tracking-tight">₹{finalPrice.toLocaleString("en-IN")}</span>
              </div>

              <p className="text-gray-600 text-base md:text-lg font-serif leading-relaxed mb-8">
                {product.description || "An exceptional horological masterpiece crafted with precision and certified authenticity."}
              </p>

              {/* QUANTITY SELECTOR */}
              <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Quantity</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-mono font-bold text-lg w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* ADD TO CART BUTTON */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                className="w-full bg-black text-white hover:bg-[#D4AF37] hover:text-black py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 shadow-xl flex items-center justify-center gap-3 mb-6"
              >
                <ShoppingBag size={18} />
                Secure in Vault
              </motion.button>

              {/* ASSURANCE BADGES */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-100 text-center">
                <div className="flex flex-col items-center">
                  <ShieldCheck size={20} className="text-[#D4AF37] mb-2" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">100% Authentic</span>
                </div>
                <div className="flex flex-col items-center">
                  <Truck size={20} className="text-[#D4AF37] mb-2" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Insured Shipping</span>
                </div>
                <div className="flex flex-col items-center">
                  <RotateCcw size={20} className="text-[#D4AF37] mb-2" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Secure Returns</span>
                </div>
              </div>

            </div>

            {/* ACCORDION SPECS & DETAILS */}
            <div className="space-y-4">
              {[
                { title: "Horological Specifications", content: product.specs ? Object.entries(product.specs).map(([k, v]) => `${k}: ${v}`).join(" • ") : "Certified automatic movement with high scratch resistance and water resistance." },
                { title: "Authenticity & Warranty", content: "Backed by our lifetime authenticity guarantee and a 2-year international service warranty." },
                { title: "Global Delivery", content: "Dispatched via armored insured courier service within 2-4 business days." }
              ].map((acc, i) => (
                <div key={i} className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setActiveAccordion(activeAccordion === i ? null : i)}
                    aria-expanded={activeAccordion === i}
                    className="w-full p-6 text-left flex justify-between items-center font-serif font-bold text-lg hover:text-[#D4AF37] transition-colors"
                  >
                    {acc.title}
                    <ChevronDown size={20} className={`transition-transform duration-300 ${activeAccordion === i ? "rotate-180 text-[#D4AF37]" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {activeAccordion === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="px-6 pb-6 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-4"
                      >
                        {acc.content}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}