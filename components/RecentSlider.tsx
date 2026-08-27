"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function RecentSlider() {
  const [recent, setRecent] = useState<any[]>([]);

  // Page load hone par browser ki memory padho
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("essential_recent") || "[]");
    setRecent(stored);
  }, []);

  // Agar user ne kuch dekha hi nahi, toh ye hissa gayab rahega
  if (recent.length === 0) return null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-100 dark:border-gray-900">
      <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-black dark:text-white mb-8">
        Recently Viewed
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {recent.map((watch, i) => (
          <Link href={`/products/${watch._id}`} key={i} className="group cursor-pointer">
            <div className="relative aspect-[4/5] bg-[#f8f8f8] dark:bg-[#111] overflow-hidden mb-4">
              <img 
                src={watch.image} 
                alt={watch.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
              />
            </div>
            <div className="text-left space-y-1">
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-black dark:text-white line-clamp-1 group-hover:text-gray-500">
                {watch.title}
              </h4>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                ₹{watch.price?.toLocaleString("en-IN")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}