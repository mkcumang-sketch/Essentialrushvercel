"use client";
import React, { useState, useEffect } from "react";
import CelebritySpotlight from "@/components/CelebritySpotlight";

// Client Component
export default function CelebrityPage() {
  const [celebrities, setCelebrities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCelebrities() {
      try {
        const res = await fetch(`/api/site-content?key=celebrities`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setCelebrities(data.content || []);
        }
      } catch (error) {
        console.error('Failed to fetch celebrity data', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCelebrities();
  }, []);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white italic font-serif">Authenticating Elite Access…</div>;

  return (
    <main className="pt-20 bg-black min-h-screen">
      <CelebritySpotlight celebrities={celebrities} />
      
      {/* Dynamic CTA */}
      <div className="pb-32 text-center">
        <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.5em] mb-8 italic">Get a similar style</p>
        <button className="bg-white text-black px-12 py-5 rounded-full font-black uppercase text-[10px] tracking-[0.3em] hover:bg-gold-500 transition-all">
          Shop the edit
        </button>
      </div>
    </main>
  );
}
