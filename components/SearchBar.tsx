"use client";
import { useState, useEffect } from "react";
import { Search, X, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function SearchBar({ isOpen, onClose }: any) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${query}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setResults(data.results);
          setLoading(false);
        });
    }, 300); // 300ms wait taaki har letter par API call na ho

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className={`fixed inset-0 bg-white z-[150] transition-all duration-500 ${isOpen ? "translate-y-0" : "-translate-y-full"}`}>
      <div className="max-w-6xl mx-auto px-6 py-12 h-full flex flex-col">
        
        {/* Search Input Area */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <div className="flex items-center flex-1">
            <Search className="w-8 h-8 mr-6 text-gold" />
            <input 
              autoFocus
              placeholder="Search by model or brand..." 
              className="text-4xl md:text-6xl font-serif italic uppercase outline-none w-full placeholder:text-gray-100"
              onChange={(e) => setQuery(e.target.value)}
              value={query}
            />
          </div>
          <button onClick={onClose} className="p-4 hover:rotate-90 transition-transform"><X className="w-10 h-10" /></button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto mt-12 space-y-8">
          {loading && <p className="text-center font-serif italic text-gold animate-pulse">Searching…</p>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {results.map((watch: any) => (
              <Link 
                href={`/products/${watch._id}`} 
                key={watch._id} 
                onClick={onClose}
                className="flex items-center space-x-8 group border-b border-gray-50 pb-8 hover:border-gold transition-all"
              >
                <div className="w-32 h-32 bg-[#FDFBF7] p-4 flex-shrink-0">
                  <img src={watch.images[0]} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gold uppercase tracking-[0.3em] mb-1">{watch.brand}</p>
                  <h4 className="text-xl font-serif italic uppercase tracking-tighter flex items-center">
                    {watch.title} <ArrowUpRight className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-sm font-bold font-sans mt-2">₹{watch.price.toLocaleString("en-IN")}</p>
                </div>
              </Link>
            ))}
          </div>

          {!loading && query.length > 2 && results.length === 0 && (
            <p className="text-center text-gray-400 font-serif italic">No matching timepieces found in our collection.</p>
          )}
        </div>
      </div>
    </div>
  );
}