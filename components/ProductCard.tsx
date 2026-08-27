"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";

// 🚀 USING THE HYDRATED CART STORE
import { useHydratedCart } from "@/store/cartStoretemp";

// =========================================================
// STRICT INTERFACES
// =========================================================
export interface Product {
  _id: string;
  name?: string;
  title?: string;
  brand: string;
  category: string;
  price: number;
  offerPrice?: number;
  imageUrl?: string;
  images?: string[];
  slug?: string;
  badge?: string;
}

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  onAddToCart?: (product: Product, e: React.MouseEvent) => void;
}

export default function ProductCard({ product, priority = false, onAddToCart }: ProductCardProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
const { addItem } = useHydratedCart();
  const displayTitle = product.name || product.title || "Masterpiece Timepiece";
  const primaryImage = product.imageUrl || (product.images && product.images[0]) || "";
  const finalPrice = Number(product.offerPrice || product.price || 0);
  const routePath = `/product/${product.slug || product._id}`;

  const handleAddAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onAddToCart) {
      onAddToCart(product, e);
      return;
    }

    if (status === "unauthenticated" || !session) {
      router.push("/login");
      return;
    }

    addItem({
      ...product,
      id: product._id,
      quantity: 1,
    } as any);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
whileHover={{ y: -4, scale: 1.01 }}
      viewport={{ once: true, margin: "-50px" }}
transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => router.push(routePath)}
      className="group bg-[#F6F1E7]/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-200/80 hover:border-[#D4AF37]/60 hover:bg-white hover:shadow-[0_20px_50px_rgba(212,175,55,0.12)] transition-all duration-700 flex flex-col h-full relative cursor-pointer overflow-hidden"
    >
      {/* Badge Indicator */}
      {product.badge && (
        <span className="absolute top-5 left-5 bg-black text-[#D4AF37] text-[8px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full z-20 shadow-md">
          {product.badge}
        </span>
      )}

      {/* Image Container with Parallax Zoom */}
      <div className="aspect-square bg-white rounded-2xl overflow-hidden mb-6 p-8 relative flex items-center justify-center shadow-sm">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={`${product.brand} ${displayTitle}`}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-1000 ease-[0.16,1,0.3,1]"
          />
        ) : (
          <Sparkles className="text-gray-300 w-8 h-8" />
        )}
      </div>

      {/* Details Container */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] mb-1.5">
            {product.brand}
          </p>
          <h4 className="text-xl font-serif font-bold text-black leading-snug mb-4 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
            {displayTitle}
          </h4>
        </div>

        <div className="flex justify-between items-end mt-auto pt-5 border-t border-gray-100">
          <div>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-[2px] mb-0.5">Valuation</p>
            <p className="font-mono tabular-nums text-xl md:text-2xl text-black font-bold tracking-tight">
              ₹{finalPrice.toLocaleString("en-IN")}
            </p>
          </div>
          
          <button
            onClick={handleAddAction}
            aria-label={`Add ${displayTitle} to cart`}
            className="w-11 h-11 bg-black text-white rounded-full hover:bg-[#D4AF37] hover:text-black transition-all duration-300 flex items-center justify-center active:scale-95 shadow-lg group/btn"
          >
            <Plus size={18} className="group-hover/btn:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}