"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';

// 🚀 1. STRICT TYPESCRIPT INTERFACE
export interface CartItem {
  _id: string; // MongoDB use kar rahe hain, toh _id primary hoga
  name: string;
  brand?: string;
  price: number;
  offerPrice?: number;
  quantity: number; // Standardized (removed 'qty' confusion)
  imageUrl?: string;
  category?: string;
  slug?: string;
  badge?: string;
  stock?: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Partial<CartItem> & { _id: string }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setCartFromServer: (serverCart: CartItem[]) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// 🚀 2. ZUSTAND STORE CREATION (With LocalStorage Persistence)
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find((i) => i._id === item._id);
          
          if (existingItem) {
            // Agar pehle se hai toh sirf quantity badhao
            return {
              items: state.items.map((i) =>
                i._id === item._id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          
          // Naya item add karo default quantity 1 ke saath
          return { 
            items: [...state.items, { ...item, quantity: 1 } as CartItem] 
          };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i._id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i._id === id ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      setCartFromServer: (serverCart) => set({ items: serverCart }),

      getTotalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce(
          (sum, item) => sum + Number(item.offerPrice || item.price || 0) * item.quantity,
          0
        ),
    }),
    {
      name: 'essential-cart-storage', // Tumhare brand ka storage name
    }
  )
);

// 🚀 3. HYDRATION SAFE CUSTOM HOOK (Next.js SSR Fix)
export function useHydratedCart() {
  const store = useCartStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Jab tak client par mount na ho, empty data do taaki HTML mismatch (hydration error) na ho
  if (!isHydrated) {
    return {
      items: [],
      addItem: () => {},
      removeItem: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      setCartFromServer: () => {},
      getTotalItems: () => 0,
      getTotalPrice: () => 0,
      _hasHydrated: false,
    };
  }

  return { ...store, _hasHydrated: true };
}