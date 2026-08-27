"use client";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight, Heart } from "lucide-react";
import { useSession } from "next-auth/react";

export default function ProductGrid({ products }: { products: any[] }) {
  const { data: session } = useSession();

  return (
    <section className="py-24 px-10 max-w-[1400px] mx-auto bg-[#FAFAFA]">
      <div className="flex justify-between items-end mb-16 border-b border-gray-200 pb-8">
        <div>
          <h2 className="text-4xl font-serif font-light text-gray-900">Curated Masterpieces</h2>
          <p className="text-gray-500 text-sm mt-2 uppercase tracking-widest">Hand-picked by our Master Horologists</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05, x: 5 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 text-[#D4AF37] font-bold text-xs uppercase tracking-widest transition-all"
        >
          View All <ArrowRight size={16} />
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        {products.map((p, idx) => (
          <motion.div 
            key={p._id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ 
              delay: idx * 0.1,
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="group cursor-pointer"
          >
            <div className="relative aspect-[4/5] bg-white overflow-hidden border border-gray-100 rounded-3xl shadow-sm group-hover:shadow-xl transition-all duration-700">
              {/* Wishlist Heart */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 backdrop-blur-sm rounded-full border border-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-300"
              >
                <Heart size={16} className="text-gray-400 hover:text-red-500 transition-colors" />
              </motion.button>

              <motion.img 
                src={p.images?.[0] || p.imageUrl} 
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full object-contain mix-blend-multiply p-8" 
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
              
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-white px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-500 shadow-xl flex items-center gap-2"
              >
                <ShoppingBag size={14} /> Add to Cart
              </motion.button>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 + 0.2 }}
              className="mt-6 text-center"
            >
              <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-[0.3em] mb-2">{p.brand || 'Essential'}</p>
              <motion.h3 
                whileHover={{ color: "#D4AF37", x: 2 }}
                transition={{ duration: 0.3 }}
                className="text-sm font-serif font-medium tracking-tight text-gray-900 uppercase mb-2"
              >
                {p.title || p.name}
              </motion.h3>
              <p className="font-bold text-xl font-serif text-gray-900">₹{p.price?.toLocaleString() || '0'}</p>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}