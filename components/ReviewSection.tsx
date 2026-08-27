"use client";

import React, { useState, useEffect } from "react";
import { Star, User } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface ReviewItem {
  _id: string;
  userName?: string;
  customerName?: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

export default function ReviewSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [form, setForm] = useState({ name: "", rating: 5, comment: "" });
  const [loading, setLoading] = useState(false);
  const toastContext = useToast();

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    if (!toastContext) return;
    if (typeof toastContext.showToast === "function") {
      try {
        (toastContext.showToast as any)({ message, type });
      } catch {
        (toastContext.showToast as any)(message, type);
      }
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userName: form.name, 
          rating: form.rating, 
          comment: form.comment, 
          product: productId || 'GLOBAL',
          visibility: 'pending' 
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Review Shared! ✨", "success");
        setForm({ name: "", rating: 5, comment: "" });
        fetchReviews();
      } else {
        triggerToast(data.error || "Failed to share review", "error");
      }
    } catch {
      triggerToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-24 border-t border-gray-100 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-2xl font-serif italic uppercase tracking-tighter">Share Your Experience</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              required 
              placeholder="Your Name" 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              className="w-full border-b py-3 text-xs outline-none focus:border-[#D4AF37] font-sans bg-transparent" 
            />
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star 
                  key={s} 
                  onClick={() => setForm({ ...form, rating: s })} 
                  className={`w-4 h-4 cursor-pointer transition-colors ${form.rating >= s ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-200'}`} 
                />
              ))}
            </div>
            <textarea 
              required 
              placeholder="Write your masterpiece review..." 
              rows={4} 
              value={form.comment} 
              onChange={(e) => setForm({ ...form, comment: e.target.value })} 
              className="w-full border border-gray-200 p-4 text-xs outline-none focus:border-[#D4AF37] font-sans resize-none rounded-xl bg-transparent" 
            />
            <button 
              disabled={loading} 
              type="submit"
              className="bg-black text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all disabled:opacity-50 rounded-xl"
            >
              {loading ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <h3 className="text-xl font-serif uppercase tracking-tight border-b border-gray-100 pb-4">
            Collector Testimonials ({reviews.length})
          </h3>
          {reviews.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No reviews yet.</p>
          ) : (
            reviews.map((r) => (
              <div key={r._id} className="space-y-3 pb-8 border-b border-gray-50 last:border-0">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest flex items-center">
                    <User className="w-3 h-3 mr-2 text-gray-400" /> {r.userName || r.customerName || "Verified Collector"}
                  </span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3 h-3 ${r.rating >= s ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm font-light italic text-gray-600 font-serif">"{r.comment}"</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}