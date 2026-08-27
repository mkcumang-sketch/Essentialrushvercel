"use client";
import { useState } from "react";
import { Search, Package, Truck, CheckCircle2, MapPin } from "lucide-react";

export default function OrderTracker() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e: any) => {
    e.preventDefault();
    if (orderId.length < 10) return setError("Please enter a valid Order ID.");
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/track/${orderId}`);
      const data = await res.json();
      if (data.success) setOrder(data.order);
      else setError(data.message);
    } catch (err) {
      setError("Could not connect. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Status Progress Logic
  const steps = ["Pending", "Shipped", "Delivered"];
  const currentIdx = order ? steps.indexOf(order.status) : -1;

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-serif py-20 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        
        <div className="text-center space-y-4">
          <h1 className="text-5xl uppercase tracking-tighter italic">Track your order</h1>
          <p className="text-gold text-[10px] font-bold uppercase tracking-[0.4em]">Essential Rush shipping</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleTrack} className="bg-white p-8 shadow-sm border border-gray-100 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
            <input 
              placeholder="Paste your Order ID (e.g. 65f...)" 
              className="w-full pl-12 py-4 border-b outline-none focus:border-gold font-sans text-sm"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>
          <button className="bg-black text-white px-10 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-gold transition-all">
            {loading ? "Loading..." : "Track"}
          </button>
        </form>

        {error && <p className="text-center text-swiss-red text-xs uppercase font-bold">{error}</p>}

        {/* Tracking Result */}
        {order && (
          <div className="bg-white p-10 md:p-16 border border-gold/10 shadow-xl space-y-16 animate-in fade-in duration-700">
            
            {/* 1. Header Info */}
            <div className="flex flex-col md:flex-row justify-between border-b pb-8 gap-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status Update</p>
                <h3 className="text-2xl italic uppercase tracking-tight">{order.status}</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Destination</p>
                <p className="text-sm font-bold">{order.city}, India</p>
              </div>
            </div>

            {/* 2. Visual Progress Bar */}
            <div className="relative pt-10">
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-100 -translate-y-1/2"></div>
              <div 
                className="absolute top-1/2 left-0 h-[2px] bg-gold -translate-y-1/2 transition-all duration-1000" 
                style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
              ></div>
              
              <div className="relative flex justify-between">
                {steps.map((step, i) => (
                  <div key={step} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-white ${i <= currentIdx ? 'border-gold text-gold shadow-lg' : 'border-gray-100 text-gray-300'}`}>
                      {i === 0 && <Package className="w-5 h-5" />}
                      {i === 1 && <Truck className="w-5 h-5" />}
                      {i === 2 && <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <p className={`mt-4 text-[9px] font-bold uppercase tracking-widest ${i <= currentIdx ? 'text-black' : 'text-gray-300'}`}>{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Items Summary */}
            <div className="pt-10 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase text-gold tracking-widest">Acquired Timepieces</h4>
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center space-x-4">
                       <img src={item.image} className="w-12 h-12 object-contain mix-blend-multiply" />
                       <p className="text-xs font-bold uppercase">{item.title}</p>
                    </div>
                  ))}
               </div>
               <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase text-gold tracking-widest">Logistics Hub</h4>
                  <div className="flex items-start space-x-3 text-xs italic text-gray-500">
                    <MapPin className="w-4 h-4 text-gold flex-shrink-0" />
                    <p>{order.address}</p>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}