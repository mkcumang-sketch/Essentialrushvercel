"use client";
import { motion } from "framer-motion";
import { Plus, Heart, Eye } from "lucide-react";

export default function ProductShowcase({ products }: any) {
  return (
    <section className="py-40 bg-white">
      <div className="max-w-[1500px] mx-auto px-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-10">
          <div className="max-w-xl">
            <h2 className="text-6xl font-serif italic mb-6">The Curator&apos;s Selection</h2>
            <p className="text-zinc-500 leading-loose text-sm font-medium">
              Every timepiece in our collection is a testament to the relentless pursuit of horological excellence, hand-selected for the discerning few.
            </p>
          </div>
          <div className="flex gap-4">
            {["AUTOMATIC", "CHRONOGRAPH", "GOLD", "LIMITED"].map(tag => (
              <span key={tag} className="px-6 py-2 border border-zinc-100 rounded-full text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-zinc-50 transition">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
          {products.map((p: any, i: number) => (
            <motion.div 
              key={p._id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="relative aspect-[3/4] bg-[#F9F8F6] rounded-sm overflow-hidden border border-transparent group-hover:border-[#C9A24D]/20 transition-all duration-700">
                {/* Product Image Layer */}
                <img src={p.images[0]} className="w-full h-full object-contain p-12 group-hover:scale-110 transition duration-1000 mix-blend-multiply" />
                
                {/* Interactive HUD */}
                <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                  <button className="p-3 bg-white rounded-full shadow-lg hover:bg-[#C9A24D] hover:text-white transition"><Heart size={16}/></button>
                  <button className="p-3 bg-white rounded-full shadow-lg hover:bg-black hover:text-white transition"><Eye size={16}/></button>
                </div>

                {/* Direct Action Button */}
                <button className="absolute bottom-0 left-0 w-full bg-black text-white py-6 text-[10px] font-bold uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 translate-y-full group-hover:translate-y-0 transition-all duration-500">
                   Inquire Availability
                </button>
              </div>

              <div className="mt-10 space-y-3 text-center">
                <p className="text-[#C9A24D] text-[9px] font-black uppercase tracking-[0.3em]">{p.brand}</p>
                <h3 className="text-sm font-semibold text-zinc-800 uppercase group-hover:text-[#C9A24D] transition-colors">{p.title}</h3>
                <div className="flex justify-center items-center gap-4">
                  <span className="text-xl font-bold italic">₹{p.price.toLocaleString()}</span>
                  <span className="text-zinc-300 line-through text-xs italic">₹{(p.price * 1.3).toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}