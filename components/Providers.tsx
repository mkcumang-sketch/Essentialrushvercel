"use client";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "react-hot-toast"; // Error solved

export function CombinedProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <Toaster position="top-center" />
      </CartProvider>
    </SessionProvider>
  );
}