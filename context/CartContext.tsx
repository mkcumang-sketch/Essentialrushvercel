"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useCartStore, CartItem } from "@/store/cartStoretemp";
import { useSession } from "next-auth/react";

interface CartContextType {
  cart: CartItem[];
  cartItems: CartItem[];
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: Partial<CartItem> & { _id: string }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const cartStore = useCartStore();
  const { status } = useSession();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 🛡️ PREVENT OVERWRITE: Only inject DB cart if it actually has items, otherwise trust Zustand local storage.
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/cart/sync")
        .then(res => res.json())
        .then(data => {
           if (data.success && data.cart && data.cart.length > 0) {
             // Merge server cart with local cart
             data.cart.forEach((serverItem: CartItem) => {
               const existingItem = cartStore.items.find(item => item._id === serverItem._id);
               if (!existingItem) {
                 cartStore.addItem(serverItem);
               }
             });
           }
        })
        .catch(err => console.error("Error fetching initial cart", err));
    }
  }, [status, cartStore]); // Runs once when session authenticates

  // 🚀 FIXED: Using item.quantity strictly instead of qty
  const cartTotal = cartStore.items.reduce((total: number, item: CartItem) => total + (item.price || 0) * (item.quantity || 1), 0);

  return (
    <CartContext.Provider value={{
      cart: cartStore.items, 
      cartItems: cartStore.items, 
      cartTotal,
      isCartOpen, 
      setIsCartOpen, 
      openCart: () => setIsCartOpen(true), 
      closeCart: () => setIsCartOpen(false),
      addToCart: cartStore.addItem, 
      removeFromCart: cartStore.removeItem, 
      updateQuantity: cartStore.updateQuantity, 
      clearCart: cartStore.clearCart    
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};