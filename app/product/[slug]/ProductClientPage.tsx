"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Star, ShieldCheck, ArrowLeft, Play, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useHydratedCart } from "@/store/cartStoretemp";
import { motionConfig, fadeUpVariants } from "@/lib/motion";

export interface Product {
  _id: string;
  name: string;
  brand?: string;
  category?: string;
  price: number;
  offerPrice?: number;
  imageUrl?: string;
  images?: string[];
  videoUrl?: string;
  description?: string;
  badge?: string;
  slug?: string;
  amazonDetails?: Array<{ key: string; value: string }>;
}

interface ProductClientPageProps {
  initialProduct: Product;
}

export default function ProductClientPage({ initialProduct }: ProductClientPageProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { addItem, _hasHydrated } = useHydratedCart();

  const [isMounted, setIsMounted] = useState(false);
  const [validImages, setValidImages] = useState<string[]>([]);
  const [activeMedia, setActiveMedia] = useState<{ type: "image" | "video"; url: string }>({
    type: "image",
    url: "",
  });
  const [productReviews, setProductReviews] = useState<Array<{ userName: string; comment: string; rating: number }>>([]);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setIsMounted(true);

    if (!initialProduct) return;

    // 🛡️ Safe Media Extraction
    const primaryImg = initialProduct.imageUrl || (initialProduct.images && initialProduct.images[0]) || "";
    const allImgs = Array.from(new Set([primaryImg, ...(initialProduct.images || [])])).filter(Boolean) as string[];
    
    setValidImages(allImgs);
    if (allImgs.length > 0) {
      setActiveMedia({ type: "image", url: allImgs[0] });
    }

    // 🛡️ Fetch Reviews Silently
    const fetchReviews = async () => {
      try {
        const ts = new Date().getTime();
        const res = await fetch(`/api/reviews?t=${ts}`);
        if (!res.ok) return;
        const revRes = await res.json();

        const pubReviews = (revRes.data || []).filter(
          (r: any) => (r.product === initialProduct._id || r.product === "GLOBAL") && r.visibility === "public"
        );

        let localReviews: any[] = [];
        try {
          localReviews = JSON.parse(localStorage.getItem("my_ghost_reviews") || "[]").filter(
            (r: any) =>
              (r.product === initialProduct._id || r.product === "GLOBAL") &&
              !pubReviews.some((p: any) => p.userName === r.userName)
          );
        } catch {
          localReviews = [];
        }

        setProductReviews([...localReviews, ...pubReviews]);
      } catch (e) {
        console.error("Review Sync Error", e);
      }
    };

    fetchReviews();
  }, [initialProduct]);

  if (!initialProduct) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold">Product not found</h2>
        <Link href="/" className="px-6 py-2 bg-black text-white rounded-xl text-xs uppercase font-bold">
          Return to Vault
        </Link>
      </div>
    );
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status === "unauthenticated" || !session) {
      notify("Please Login to access the vault.");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }

    const productToAdd = {
      ...initialProduct,
      slug: initialProduct.slug || initialProduct._id || "",
      images: initialProduct.images || [],
    };

    addItem(productToAdd as any);
    notify(`${initialProduct.name} added to Vault`);
  };

  if (!isMounted || !_hasHydrated) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const priceFormatted = Number(initialProduct.offerPrice || initialProduct.price || 0).toLocaleString("en-IN");
  const originalPriceFormatted = initialProduct.offerPrice ? Number(initialProduct.price || 0).toLocaleString("en-IN") : null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            transition={{ duration: motionConfig.duration.fast, ease: motionConfig.ease.easeOut }}
            className="fixed top-8 left-1/2 z-[200] bg-[#0A0A0A] border border-[#D4AF37]/30 text-white px-6 py-4 rounded-full flex items-center gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-md"
          >
            <CheckCircle2 size={18} className="text-[#D4AF37]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 py-6 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors">
          <ArrowLeft size={16} /> Vault
        </Link>
        <h1 className="text-2xl font-serif font-black tracking-[5px] uppercase absolute left-1/2 -translate-x-1/2">Essential</h1>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* LEFT: Media Gallery */}
        <div className="space-y-6">
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-[30px] p-8 border border-gray-200 aspect-square flex items-center justify-center relative overflow-hidden shadow-sm"
          >
            {activeMedia.url ? (
              activeMedia.type === "image" ? (
                <img src={activeMedia.url} alt={initialProduct.name} className="w-full h-full object-contain mix-blend-multiply" />
              ) : (
                <video src={activeMedia.url} autoPlay loop muted playsInline className="w-full h-full object-cover rounded-2xl" />
              )
            ) : (
              <div className="text-gray-400 text-xs uppercase font-bold">No Image Available</div>
            )}
            {initialProduct.badge && (
              <span className="absolute top-6 right-6 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-md">
                {initialProduct.badge}
              </span>
            )}
          </motion.div>

          {/* Thumbnails */}
          <div className="flex flex-wrap gap-4">
            {validImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveMedia({ type: "image", url: img })}
                className={`w-20 h-20 bg-white border rounded-2xl p-2 transition-all ${
                  activeMedia.url === img ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/20" : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <img src={img} className="w-full h-full object-contain mix-blend-multiply" alt="Thumbnail" />
              </button>
            ))}
            {initialProduct.videoUrl && (
              <button
                onClick={() => setActiveMedia({ type: "video", url: initialProduct.videoUrl! })}
                className={`w-20 h-20 bg-black text-white flex flex-col items-center justify-center rounded-2xl transition-all ${
                  activeMedia.url === initialProduct.videoUrl ? "ring-2 ring-black" : "opacity-80 hover:opacity-100"
                }`}
              >
                <Play size={20} className="mb-1" />
                <span className="text-[8px] font-black uppercase tracking-widest">Video</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: Product Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: motionConfig.duration.normal, ease: motionConfig.ease.easeOut }}
          className="flex flex-col justify-center"
        >
          <p className="text-[#D4AF37] text-xs font-black uppercase tracking-[0.2em] mb-2">{initialProduct.brand || "Essential Horology"}</p>
          <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight mb-4">{initialProduct.name}</h1>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center text-[#D4AF37]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="fill-[#D4AF37]" />
              ))}
            </div>
            <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">{productReviews.length} Reviews</span>
          </div>

          <div className="text-3xl font-mono font-black mb-8 flex items-end gap-3">
            ₹{priceFormatted}
            {originalPriceFormatted && (
              <span className="text-lg text-gray-400 line-through mb-1">₹{originalPriceFormatted}</span>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed mb-10">
            {initialProduct.description || "An exquisite piece of fine horology, designed for the modern connoisseur."}
          </p>

          {/* Specifications */}
          <div className="bg-white p-6 rounded-[24px] border border-gray-200 mb-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 border-b border-gray-100 pb-2">
              Specifications
            </h3>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              {(initialProduct.amazonDetails && initialProduct.amazonDetails.length > 0) ? (
                initialProduct.amazonDetails.map((detail, idx) => (
                  <React.Fragment key={idx}>
                    <div className="text-gray-500">{detail.key}</div>
                    <div className="font-bold text-right">{detail.value}</div>
                  </React.Fragment>
                ))
              ) : (
                <>
                  <div className="text-gray-500">Authenticity</div>
                  <div className="font-bold text-right">Swiss Certified</div>
                  <div className="text-gray-500">Warranty</div>
                  <div className="font-bold text-right">2 Years International</div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mt-auto">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              className="flex-1 bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#D4AF37] hover:text-black transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer"
            >
              <ShoppingBag size={18} /> Add to Cart
            </motion.button>
            <div className="flex items-center justify-center gap-2 px-6 py-4 bg-green-50 text-green-700 rounded-2xl border border-green-100">
              <ShieldCheck size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">100% Authentic</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}