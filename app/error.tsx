"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { ShieldAlert, RefreshCcw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Yahan aap future mein bug report karne ka logic laga sakte ho (Sentry etc.)
    console.error("Bug Caught by Shield:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white font-sans p-6 text-center">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-8 border border-red-500/20">
        <ShieldAlert size={40} />
      </div>
      <h2 className="text-4xl font-serif italic mb-4">A temporary anomaly occurred.</h2>
      <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-10 max-w-md">
        Our automated systems have caught a glitch. You don&apos;t need to worry, the vault is still secure.
      </p>
      <button 
        onClick={() => reset()} 
        className="bg-[#D4AF37] text-black px-10 py-4 rounded-full font-black uppercase tracking-[4px] text-[10px] hover:bg-white transition-all flex items-center gap-3"
      >
        <RefreshCcw size={16} /> Restore Session
      </button>
    </div>
  );
}