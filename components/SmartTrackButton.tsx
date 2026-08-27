"use client";

import { useState } from 'react';
import { Loader2, Truck } from 'lucide-react';

export default function SmartTrackButton({ orderId, email }: { orderId: string, email: string }) {
    const [loading, setLoading] = useState(false);
    const [trackingData, setTrackingData] = useState<any>(null);

    const handleQuickTrack = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/track-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, email })
            });
            const data = await res.json();
            if (data.success) {
                setTrackingData(data.order);
            } else {
                alert(data.message || "Tracking details not available yet.");
            }
        } catch (error) {
            alert("Error fetching tracking details.");
        }
        setLoading(false);
    };

    // Agar data aa gaya, toh button ki jagah ye khoobsurat card dikhega
    if (trackingData) {
        return (
            <div className="mt-4 p-4 bg-[#111] border border-[#D4AF37]/30 rounded-xl w-full text-sm animate-fade-in shadow-lg md:col-span-full">
                <div className="flex items-center gap-2 mb-2">
                    <Truck size={16} className="text-[#D4AF37]" />
                    <span className="font-bold uppercase tracking-widest text-[10px] text-[#D4AF37]">Logistics Status</span>
                </div>
                <p className="text-gray-300 mb-3 text-xs">{trackingData.statusMessage}</p>
                <div className="bg-black p-3 rounded-lg border border-white/10 flex justify-between items-center">
                    <div>
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Courier AWB</p>
                        <p className="font-bold text-[#00F0FF] font-mono text-sm tracking-wider">
                            {trackingData.courierTrackingId}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Current State</p>
                        <p className="font-bold text-white text-xs tracking-widest uppercase">
                            {trackingData.displayStatus}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Default "TRACK ORDER" button
    return (
        <button 
            onClick={handleQuickTrack}
            disabled={loading}
            className="bg-[#D4AF37] text-black px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center min-w-[140px] shadow-[0_0_15px_rgba(212,175,55,0.3)]"
        >
            {loading ? <Loader2 size={14} className="animate-spin text-black" /> : "TRACK ORDER"}
        </button>
    );
}