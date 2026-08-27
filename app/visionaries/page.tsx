"use client";
import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const CELEBS = [
  { id:1, name: "Virat Kohli", watch: "Rolex Daytona", img: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=1974" },
  { id:2, name: "Shah Rukh Khan", watch: "Patek Philippe", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974" },
  { id:3, name: "Deepika Padukone", watch: "Cartier Tank", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974" },
];

export default function VisionariesPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 md:p-20">
      <Link href="/" className="inline-flex items-center gap-2 text-[#D4AF37] mb-12 text-xs font-bold uppercase tracking-widest">
        <ChevronLeft size={16}/> Home
      </Link>
      
      <div className="mb-20">
        <h1 className="text-7xl font-serif mb-6">The Visionaries</h1>
        <p className="text-gray-500 max-w-2xl italic">"Time is the only true luxury. These are the people who have mastered it."</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {CELEBS.map(c => (
          <div key={c.id} className="group relative aspect-[3/4] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
            <img src={c.img} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent p-8 flex flex-col justify-end">
              <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-1">{c.watch}</span>
              <h3 className="text-2xl font-serif">{c.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
