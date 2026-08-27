"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 🚀 USING THE BULLETPROOF HYDRATION HOOK
import { useHydratedCart } from "@/store/cartStoretemp";

// =========================================================
// STRICT INTERFACES
// =========================================================
interface CartItem {
  _id?: string;
  id?: string;
  quantity?: number;
  qty?: number;
}

export default function CartBadge() {
  const { items, _hasHydrated } = useHydratedCart();
  
  // Safely calculate total items, handling both 'quantity' and 'qty' naming conventions
  const totalItems = items.reduce((sum: number, item: CartItem) => {
      const itemQty = item.quantity || item.qty || 1;
      return sum + itemQty;
  }, 0);

  return (
    <Link 
        href="/cart" 
        className="relative inline-flex items-center p-2 text-black dark:text-white hover:text-[#D4AF37] transition-colors group"
        aria-label={`View cart, ${totalItems} items`}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <ShoppingBag className="w-6 h-6" />
      </motion.div>

      {/* LUXURY ANIMATED BADGE */}
      <AnimatePresence>
        {_hasHydrated && totalItems > 0 && (
          <motion.span 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="absolute -top-1 -right-1 bg-[#D4AF37] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-[#0A0A0A]"
          >
            {totalItems > 99 ? "99+" : totalItems}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}