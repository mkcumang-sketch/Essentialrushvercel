"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowLeft, Heart, ShoppingBag } from 'lucide-react';
import dynamic from 'next/dynamic';

function WishlistPage() {
    const router = useRouter();
    const [wishlist, setWishlist] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Safe Client-Side Loading
        setWishlist(JSON.parse(localStorage.getItem('luxury_wishlist') || '[]'));
        setCart(JSON.parse(localStorage.getItem('luxury_cart') || '[]'));
        setIsLoaded(true);
    }, []);

    const removeItem = (id: string) => {
        const newWishlist = wishlist.filter(item => item._id !== id);
        setWishlist(newWishlist);
        localStorage.setItem('luxury_wishlist', JSON.stringify(newWishlist));
    };

    const moveToCart = (product: any) => {
        const newCart = [...cart, { ...product, qty: 1 }];
        setCart(newCart);
        localStorage.setItem('luxury_cart', JSON.stringify(newCart));
        removeItem(product._id);
        router.push('/cart');
    };

    if (!isLoaded) return <div className="h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-black">
            <header className="w-full bg-white border-b border-gray-200 py-6 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black"><ArrowLeft size={16}/> Home</Link>
                <h1 className="text-2xl font-serif font-black tracking-[5px] uppercase absolute left-1/2 -translate-x-1/2">Essential</h1>
            </header>

            <main className="max-w-4xl mx-auto pt-16 pb-20 px-6">
                <h2 className="text-4xl font-serif text-black mb-10 flex items-center gap-4"><Heart size={32} className="text-[#D4AF37]"/> Wishlist</h2>
                
                {wishlist.length === 0 ? (
                    <div className="bg-white p-12 rounded-[30px] border border-gray-200 text-center shadow-sm">
                        <Heart size={60} className="mx-auto text-gray-300 mb-6"/>
                        <h3 className="text-2xl font-serif mb-2">Your wishlist is empty</h3>
                        <p className="text-gray-500 text-sm mb-8">Save watches you like and come back anytime.</p>
                        <Link href="/" className="px-8 py-4 bg-black text-white font-bold uppercase text-xs rounded-full hover:bg-[#D4AF37] hover:text-black transition-colors inline-block">Browse watches</Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {wishlist.map((item, i) => (
                            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} key={i} className="bg-white p-6 rounded-[25px] border border-gray-200 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                                <div className="w-24 h-24 bg-gray-50 rounded-xl p-2 shrink-0">
                                    <img src={item.imageUrl || (item.images && item.images[0])} className="w-full h-full object-contain mix-blend-multiply" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{item.brand}</p>
                                    <h4 className="text-lg font-serif font-bold text-black">{item.name}</h4>
                                    <p className="text-sm font-bold mt-2">₹{Number(item.offerPrice || item.price).toLocaleString('en-IN')}</p>
                                </div>
                                <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto">
                                    <button onClick={() => moveToCart(item)} className="flex-1 md:flex-none px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#D4AF37] hover:text-black transition-colors flex items-center justify-center gap-2"><ShoppingBag size={14}/> Move to Cart</button>
                                    <button onClick={() => removeItem(item._id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={18}/></button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

// 🌟 THIS BYPASSES VERCEL SERVER BUILD CRASH 🌟
export default dynamic(() => Promise.resolve(WishlistPage), { ssr: false });