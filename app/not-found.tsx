import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center text-center px-6 font-sans">
      <h1 className="text-8xl md:text-9xl font-serif text-gray-900 mb-4">404</h1>
      <h2 className="text-sm font-bold uppercase tracking-[5px] text-gray-400 mb-8">Page Not Found</h2>
      
      <p className="text-gray-500 mb-10 max-w-md leading-relaxed text-sm">
        The luxury vault you are looking for has been moved, secured, or does not exist.
      </p>
      
      <Link 
        href="/" 
        className="px-8 py-4 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-all shadow-lg"
      >
        Return to Storefront
      </Link>
    </div>
  );
}