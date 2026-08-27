"use client";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function OrderSuccess() {
  return (
    <div className="min-h-screen bg-royal-900 text-white flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-gold-500/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px]"></div>

      <div className="max-w-lg w-full bg-white/5 backdrop-blur-lg border border-white/10 p-10 md:p-16 text-center rounded-2xl shadow-2xl relative z-10">
        
        {/* Animated Icon */}
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="w-20 h-20 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(212,175,55,0.6)]"
        >
          <Check className="w-10 h-10 text-royal-900 stroke-[3]" />
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl font-serif italic mb-4 text-white"
        >
          Payment Successful
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-300 text-sm leading-relaxed mb-10"
        >
          Congratulations. You have successfully acquired a timeless masterpiece. 
          A confirmation email has been sent to your inbox.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col gap-4"
        >
          <Link href="/collection" className="w-full bg-white text-royal-900 py-4 font-bold uppercase tracking-widest hover:bg-gold-500 hover:text-white transition-all duration-300 shadow-lg flex items-center justify-center gap-2">
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/" className="text-xs text-gray-400 hover:text-gold-500 uppercase tracking-widest mt-4">
            Return to Home
          </Link>
        </motion.div>

      </div>
    </div>
  );
}