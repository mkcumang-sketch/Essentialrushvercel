"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function SearchOverlay({ onClose = () => {} }: { onClose?: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔎 Real-time Search Logic (Debounced)
  useEffect(() => {
    // User ke rukne ka wait karo (500ms) phir search karo
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1) {
        setLoading(true);
        try {
          const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
          const data = await res.json();
          if (data.success) setResults(data.products);
        } catch (error) {
          console.error("Search Error", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col pt-24 px-6 animate-fade-in text-white font-serif overflow-hidden">
      
      {/* Close Button (X) */}
      <button onClick={onClose} className="absolute top-6 right-6 md:top-10 md:right-10 text-gray-400 hover:text-white transition-colors">
        <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>

      {/* Input Field */}
      <div className="max-w-4xl mx-auto w-full text-center mt-10">
        <input 
          autoFocus
          type="text" 
          placeholder="Search watches (e.g. Rolex, gold, sport)..." 
          className="w-full bg-transparent border-b border-gray-700 text-2xl md:text-5xl py-4 text-center focus:outline-none focus:border-yellow-600 transition-colors uppercase tracking-widest italic placeholder:normal-case placeholder:text-gray-600 placeholder:italic"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Results List */}
      <div className="max-w-6xl mx-auto w-full mt-16 overflow-y-auto pb-20 custom-scrollbar h-full">
        {loading ? (
          <div className="text-center text-yellow-600 animate-pulse tracking-[0.3em] text-xs uppercase font-bold">Searching…</div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((product) => (
              <Link 
                key={product._id} 
                href={`/product/${product._id}`} 
                onClick={onClose}
                className="flex items-center gap-4 bg-white/5 p-4 hover:bg-white/10 transition-all border border-white/5 hover:border-yellow-600/50 group"
              >
                <div className="w-20 h-20 bg-white p-2 flex items-center justify-center flex-shrink-0">
                   <img src={product.images?.[0]} className="w-full h-full object-contain mix-blend-multiply" alt={product.title} />
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest group-hover:text-yellow-500 mb-1">{product.brand}</p>
                  <h4 className="text-sm font-bold uppercase tracking-tight leading-tight mb-1">{product.title}</h4>
                  <p className="text-xs text-yellow-600 font-bold">₹{product.price?.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : query.length > 1 ? (
          <div className="text-center text-gray-500 italic mt-10">
            No masterpieces found matching "{query}".
          </div>
        ) : null}
      </div>

    </div>
  );
}