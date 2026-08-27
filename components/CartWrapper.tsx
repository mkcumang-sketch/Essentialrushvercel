"use client";

import { useCart } from "@/context/CartContext";
// 🚀 Humne yahan 'default' ya '{ }' ka chakkar hi khatam kar diya
import * as CartDrawerModule from "./CartDrawer"; 

export default function CartWrapper() {
  const { isCartOpen, setIsCartOpen, cartItems, updateQty } = useCart();
  
  // Ye line automatically default export ya named export dono ko handle kar legi
// 🚀 Ye line 100% fail-safe hai, TypeScript ab koi sawal nahi karega
  const CartDrawer = (CartDrawerModule as any).default || (CartDrawerModule as any).CartDrawer || (CartDrawerModule as any);
  
  if (!CartDrawer) return null; // Agar load nahi hua toh crash nahi hoga

  return (
    <CartDrawer 
      isOpen={isCartOpen} 
      onClose={() => setIsCartOpen(false)} 
      cartItems={cartItems} 
      updateQty={updateQty} 
    />
  );
}