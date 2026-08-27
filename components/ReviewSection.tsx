"use client";
import { useState, useEffect } from "react";
import { Star, User } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function ReviewSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ name: "", rating: 5, comment: "" });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const fetchReviews = () => {
    fetch(`/api/reviews?productId=${productId}`)
      .then(res => res.json())
      .then(data => data.success && setReviews(data.data || []));
  };

  useEffect(() => { fetchReviews(); }, [productId]);

  const handleSubmit = async (e: any) => {
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
          showToast("Review Shared! ✨", "success");
          setForm({ name: "", rating: 5, comment: "" });
          fetchReviews();
        } else {
            showToast(data.error || "Failed to share review", "error");
        }
    } catch (err) {
        showToast("Network error", "error");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-24 border-t border-gray-100">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-2xl font-serif italic uppercase tracking-tighter">Share Your Experience</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required placeholder="Your Name" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="w-full border-b py-3 text-xs outline-none focus:border-gold font-sans" />
            <div className="flex space-x-2">
              {[1,2,3,4,5].map(s => (
                <Star key={s} onClick={()=>setForm({...form, rating: s})} className={`w-4 h-4 cursor-pointer ${form.rating >= s ? 'fill-gold text-gold' : 'text-gray-200'}`} />
              ))}
            </div>
            <textarea required placeholder="Write your masterpiece review..." rows={4} value={form.comment} onChange={(e)=>setForm({...form, comment: e.target.value})} className="w-full border p-4 text-xs outline-none focus:border-gold font-sans" />
            <button disabled={loading} className="bg-black text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-gold transition-all">Submit Review</button>
          </form>
        </div>
        <div className="lg:col-span-2 space-y-8">
          <h3 className="text-xl font-serif uppercase tracking-tight border-b pb-4">Collector Testimonials ({reviews.length})</h3>
          {reviews.length === 0 ? <p className="text-xs text-gray-400 italic">No reviews yet.</p> : reviews.map((r: any) => (
            <div key={r._id} className="space-y-3 pb-8 border-b border-gray-50 last:border-0">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest flex items-center"><User className="w-3 h-3 mr-2" /> {r.userName || r.customerName}</span>
                <div className="flex space-x-1">
                  {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${r.rating >= s ? 'fill-gold text-gold' : 'text-gray-100'}`} />)}
                </div>
              </div>
              <p className="text-sm font-light italic text-gray-600">"{r.comment}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}