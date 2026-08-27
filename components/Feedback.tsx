"use client";
import { motion } from "framer-motion";

const texts = ["PREMIUM QUALITY", "•", "LIFETIME WARRANTY", "•", "FREE SHIPPING", "•", "24/7 SUPPORT", "•"];

export default function Feedback() {
  return (
    <div className="bg-red-600 py-6 overflow-hidden">
      <motion.div 
        className="flex whitespace-nowrap gap-8"
        animate={{ x: [0, -1000] }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
      >
        {[...texts, ...texts, ...texts, ...texts].map((text, i) => (
          <span key={i} className="text-white text-lg md:text-2xl font-black uppercase italic tracking-widest">
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
}