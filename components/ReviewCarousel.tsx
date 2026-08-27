"use client";
import { useState, useEffect } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

const reviews = [
  {
    name: "Aaryan Kapoor",
    location: "Mumbai, India",
    watch: "Heritage Diver 1924",
    text: "The weight, the finish, and the mechanical precision—Essential Rush has managed to capture the true soul of Swiss watchmaking. It's not just a watch; it's an heirloom.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974"
  },
  {
    name: "Zoya Vardhan",
    location: "London, UK",
    watch: "Royal Ceramic Gold",
    text: "Exquisite craftsmanship. The way the light hits the ceramic dial is mesmerizing. The white-glove delivery experience was the icing on the cake.",
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070"
  },
  {
    name: "Rishabh Malhotra",
    location: "Dubai, UAE",
    watch: "Pinnacle Skeleton",
    text: "I've owned several luxury brands, but the attention to detail in the Essential Rush skeleton series is on another level. Truly a masterpiece for any serious collector.",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070"
  }
];

export default function ReviewCarousel() {
  const [active, setActive] = useState(0);

  const next = () => setActive((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
  const prev = () => setActive((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));

  useEffect(() => {
    const timer = setInterval(next, 8000); // Har 8 second mein change hoga
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-32 bg-[#FDFBF7] overflow-hidden border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        
        <div className="text-center mb-20 space-y-4">
          <p className="text-gold text-[10px] font-bold uppercase tracking-[0.5em]">The Inner Circle</p>
          <h2 className="text-4xl md:text-6xl font-serif italic uppercase tracking-tighter">Voices of Distinction</h2>
        </div>

        <div className="relative">
          {/* Main Review Content */}
          <div className="flex flex-col items-center text-center space-y-10 min-h-[450px] justify-center">
            
            {/* Customer Photo with Gold Border */}
            <div className="relative group">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-gold p-1">
                <img 
                  src={reviews[active].img} 
                  className="w-full h-full object-cover rounded-full grayscale hover:grayscale-0 transition-all duration-700"
                  alt={reviews[active].name}
                />
              </div>
              <Quote className="absolute -bottom-2 -right-2 w-8 h-8 text-gold bg-white rounded-full p-2 shadow-lg" />
            </div>

            {/* Quote and Rating */}
            <div className="max-w-3xl space-y-6 animate-in fade-in zoom-in duration-1000">
              <div className="flex justify-center space-x-1 mb-4">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-gold text-gold" />)}
              </div>
              <h3 className="text-xl md:text-3xl font-serif italic leading-relaxed text-gray-800">
                "{reviews[active].text}"
              </h3>
              <div className="space-y-1">
                <p className="text-sm font-bold uppercase tracking-widest">{reviews[active].name}</p>
                <p className="text-[10px] text-gold font-bold uppercase tracking-[0.3em]">{reviews[active].watch} Owner</p>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest">{reviews[active].location}</p>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-4 md:-px-10 pointer-events-none">
            <button onClick={prev} className="pointer-events-auto p-4 hover:text-gold transition-colors">
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button onClick={next} className="pointer-events-auto p-4 hover:text-gold transition-colors">
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          {/* Indicators */}
          <div className="flex justify-center space-x-3 mt-16">
            {reviews.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setActive(i)}
                className={`h-[2px] transition-all duration-500 ${active === i ? "w-12 bg-gold" : "w-6 bg-gray-200"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}