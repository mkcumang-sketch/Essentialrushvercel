"use client";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { X, ShoppingBag, Trash2, ArrowRight } from "lucide-react";

export default function CartSidebar() {
  const { cart, isCartOpen, closeCart, removeFromCart, cartTotal } = useCart();

  return (
    <>
      {/* 🌑 Dark Overlay (Blur Effect ke saath) */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] transition-opacity duration-500 ${
          isCartOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={closeCart}
      />

      {/* 🛒 Sliding Drawer (Right Side) */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white z-[70] shadow-2xl transform transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] flex flex-col ${
        isCartOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-white">
          <h2 className="text-2xl font-serif font-bold text-royal-900 italic">Your cart</h2>
          <button 
            onClick={closeCart} 
            className="p-2 text-gray-400 hover:text-royal-900 hover:rotate-90 transition-all duration-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cart Items List Area */}
        <div className="flex-grow overflow-y-auto p-6 bg-ivory relative">
          {cart.length === 0 ? (
            
            // 👑 LUXURY EMPTY STATE (Jab Cart Khaali ho)
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-80">
              <div className="w-24 h-24 rounded-full bg-royal-900/5 flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-royal-900 opacity-50" />
              </div>
              
              <div>
                <p className="text-xl font-serif font-bold text-royal-900">Your cart is empty</p>
                <p className="text-xs text-gray-500 mt-2 max-w-[250px] mx-auto leading-relaxed tracking-wide">
                  Good watches go fast. <br/> Add one you love before it sells out.
                </p>
              </div>

              <button 
                onClick={closeCart} 
                className="group flex items-center gap-2 px-8 py-4 bg-royal-900 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-gold-500 transition-all duration-500 shadow-xl"
              >
                Browse watches <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
              </button>
            </div>

          ) : (
            
            // ⌚ FILLED STATE (Jab Cart mein Items hon)
            <div className="space-y-6">
              {cart.map((item: { _id: string; images?: string[]; title?: string; brand?: string; price?: number }, index: number) => (
                <div key={index} className="flex gap-4 items-center bg-white p-4 border border-gray-100 shadow-sm relative group hover:border-gold-500/30 transition-all duration-300">
                  
                  {/* Image */}
                  <div className="w-20 h-20 bg-gray-50 flex items-center justify-center overflow-hidden">
                    <img 
                      src={item.images?.[0]} 
                      alt={item.title} 
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-grow">
                    <p className="text-[10px] font-bold text-gold-600 uppercase tracking-widest mb-1">{item.brand}</p>
                    <h4 className="text-sm font-serif font-bold text-royal-900 leading-tight">{item.title}</h4>
                    <p className="text-sm font-bold text-gray-500 mt-2">₹{item.price?.toLocaleString("en-IN")}</p>
                  </div>
                  
                  {/* Remove Button */}
                  <button 
                    onClick={() => removeFromCart(item._id)} 
                    className="text-gray-300 hover:text-red-500 transition-colors p-2"
                    title="Remove from cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer (Checkout Button) */}
        {cart.length > 0 && (
          <div className="p-8 border-t border-gray-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Subtotal</span>
              <span className="text-2xl font-serif font-bold text-royal-900">₹{cartTotal.toLocaleString("en-IN")}</span>
            </div>
            
            <p className="text-[10px] text-gray-400 text-center mb-4 uppercase tracking-widest">
              Shipping & Taxes Calculated at Checkout
            </p>

            <Link 
              href="/checkout" 
              onClick={closeCart} 
              className="block w-full text-center bg-royal-900 text-white text-xs font-bold uppercase tracking-[0.3em] py-5 hover:bg-gold-500 transition-all duration-500 shadow-lg"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}