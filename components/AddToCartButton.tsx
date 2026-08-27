"use client";

import React, { useState, useCallback } from "react";
import { ShoppingBag, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 🚀 USING THE BULLETPROOF HYDRATION HOOK
import { useHydratedCart } from "@/store/cartStoretemp";

// =========================================================
// STRICT INTERFACES (NO 'any')
// =========================================================
export interface Product {
    _id?: string;
    id?: string;
    name?: string;
    title?: string;
    brand?: string;
    price?: number;
    offerPrice?: number;
    imageUrl?: string;
    images?: string[];
    [key: string]: unknown; // Allows passthrough of other DB fields
}

interface AddToCartButtonProps {
    product: Product;
    className?: string; // Allows parent components to inject custom Tailwind classes
}

export default function AddToCartButton({ product, className = "" }: AddToCartButtonProps) {
    const [isAdded, setIsAdded] = useState(false);
    
    // Explicitly getting typed items and hydration state
    const { addItem, _hasHydrated } = useHydratedCart();

    const handleAddToCart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!_hasHydrated) return; // Prevent actions before Zustand syncs with localStorage

        // Ensure ID is properly mapped for the CartStore
        const cartItem = {
            ...product,
            id: product._id || product.id || Date.now().toString(),
            quantity: 1
        };

        // Call strict Zustand action
        addItem(cartItem as any);

        // 🚀 LUXURY UX: Animate button state instead of using alert()
        setIsAdded(true);

        // Optional: Dispatch global event for header/toast notifications
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("cart-updated", { 
                detail: { message: `${product.name || product.title || "Timepiece"} added to vault.` } 
            }));
        }

        // Reset visual state smoothly after 2 seconds
        setTimeout(() => {
            setIsAdded(false);
        }, 2000);

    }, [product, addItem, _hasHydrated]);

    return (
        <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAddToCart}
            disabled={isAdded || !_hasHydrated}
            className={`relative w-full overflow-hidden flex items-center justify-center gap-2 bg-[#D4AF37] text-black font-black uppercase tracking-[0.2em] text-[10px] md:text-xs py-4 lg:py-5 rounded-xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] disabled:opacity-90 disabled:cursor-not-allowed ${className}`}
        >
            <AnimatePresence mode="wait">
                {isAdded ? (
                    <motion.div 
                        key="added"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center gap-2"
                    >
                        <CheckCircle2 size={18} className="text-black" />
                        <span>Secured in Vault</span>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="add"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center gap-2"
                    >
                        {!_hasHydrated ? (
                            <Loader2 size={18} className="animate-spin text-black/50" />
                        ) : (
                            <ShoppingBag size={18} />
                        )}
                        <span>{!_hasHydrated ? "Initializing..." : "Add to Cart"}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
}