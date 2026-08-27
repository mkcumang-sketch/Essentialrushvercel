"use client";
import { motion } from "framer-motion";
import { Heart, Plus } from "lucide-react";

export default function FeaturedGrid({ products }: { products: any[] }) {
  return (
    <section className="py-32 px-10 max-w-[1600px] mx-auto bg-white">
      <div className="text-center mb-24 space-y-4">
        <h2 className="text-5xl font-light italic tracking-tight">The Stellar Series</h2>
        <div className="w-24 h-[1px] bg-[#C9A24D] mx-auto" />
        <p className="text-zinc-400 text-xs font-bold uppercase tracking-[0.3em]">Masterpieces of engineering</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-16">
        {products.map((product, idx) => (
          <motion.div 
            key={product._id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group relative"
          >
            {/* Wishlist Icon */}
            <button className="absolute top-4 right-4 z-10 p-3 bg-white/50 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#C9A24D] hover:text-white">
              <Heart size={16} />
            </button>

            {/* Product Image */}
            <div className="aspect-[4/5] bg-[#F9F7F2] overflow-hidden rounded-sm relative border border-[#F2F0EB]">
              <img 
                src={product.images[0]} 
                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-1000 p-8"
              />
              <motion.button 
                whileHover={{ scale: 1.05 }}
                className="absolute bottom-0 left-0 w-full bg-black text-white py-5 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-3"
              >
                <Plus size={14} /> Add to Luxury Bag
              </motion.button>
            </div>

            {/* Metadata */}
            <div className="mt-8 space-y-2 text-center">
              <span className="text-[9px] font-black text-[#C9A24D] uppercase tracking-[0.3em]">{product.brand}</span>
              <h3 className="text-sm font-medium text-zinc-800 uppercase tracking-tight group-hover:text-[#C9A24D] transition-colors">{product.title}</h3>
              <div className="flex justify-center items-center gap-4 mt-4">
                <span className="text-xl font-bold italic text-black">₹{product.price.toLocaleString()}</span>
                <span className="text-zinc-300 line-through text-xs font-medium">₹{(product.price * 1.25).toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}