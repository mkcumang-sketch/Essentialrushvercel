"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Product {
  id: string;
  name: string;
  price: number;
  img: string;
  brand?: string;
  original?: number;
}

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (id: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  // 🔧 HYDRATION GUARD STATE
  const [isMounted, setIsMounted] = useState(false); 
  const { data: session } = useSession();

  // 🔧 1. Wait for client mount before reading localStorage
  useEffect(() => {
    setIsMounted(true); // Mark as hydrated
    const saved = localStorage.getItem("wishlist");
    if (saved) {
      try { 
        setWishlist(JSON.parse(saved)); 
      } catch (e) { 
        console.error(e); 
      }
    }
  }, []);

  // 🔧 2. Only write to localStorage after component is mounted
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist, isMounted]);

  const toggleWishlist = async (product: Product) => {
    const exists = wishlist.find((item) => item.id === product.id);
    const newWishlist = exists ? wishlist.filter((item) => item.id !== product.id) : [...wishlist, product];
    setWishlist(newWishlist);

    if (session?.user) {
        try {
            const method = exists ? 'DELETE' : 'POST';
            await fetch('/api/user/wishlist', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id })
            });
        } catch (err) {
            console.error("Wishlist sync failed", err);
        }
    }
  };

  const isInWishlist = (id: string) => wishlist.some((item) => item.id === id);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, wishlistCount: wishlist.length }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};