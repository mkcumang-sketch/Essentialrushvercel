"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface ProductData {
  _id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  offerPrice?: number;
  imageUrl: string;
  images?: string[];
  description?: string;
  badge?: string;
  metaTitle?: string;
  metaDescription?: string;
  amazonDetails?: Array<{ key: string; value: string }>;
}

export default function EditProductClient({ initialProduct }: { initialProduct: ProductData }) {
  const router = useRouter();
  const [formData, setFormData] = useState<ProductData>(initialProduct);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/products/${formData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ type: "success", text: "Product & SEO details updated successfully!" });
        setTimeout(() => router.push("/godmode"), 1500);
      } else {
        setStatusMsg({ type: "error", text: data.error || "Update failed." });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Network error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const autoGenerateSEO = () => {
    setFormData((prev) => ({
      ...prev,
      metaTitle: `${prev.brand} ${prev.name} | Authentic Luxury Timepiece - Essential Rush`,
      metaDescription: `Acquire the genuine ${prev.brand} ${prev.name}. Certified luxury watch with international warranty and complimentary express shipping.`,
    }));
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
          <Link
            href="/godmode"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[#D4AF37] transition-colors"
          >
            <ArrowLeft size={16} /> Back to Godmode
          </Link>
          <h1 className="text-xl font-bold font-serif uppercase tracking-wider text-[#D4AF37]">
            Edit Timepiece
          </h1>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-center gap-3 text-sm ${
              statusMsg.type === "success"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {statusMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* General Information */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] border-b border-white/10 pb-3">
              1. General Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Badge / Tag</label>
                <input
                  type="text"
                  value={formData.badge || ""}
                  placeholder="e.g. Masterpiece, Limited Edition"
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Description</label>
              <textarea
                rows={4}
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-black/40 border border-white/15 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none"
              />
            </div>
          </div>

          {/* Pricing & Valuation */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] border-b border-white/10 pb-3">
              2. Valuation & Inventory Pricing
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Original Price (₹)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Offer Price (₹) - Optional</label>
                <input
                  type="number"
                  value={formData.offerPrice || ""}
                  placeholder="Leave empty if regular price"
                  onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* SEO Optimization Section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]">
                3. SEO Meta Optimization
              </h2>
              <button
                type="button"
                onClick={autoGenerateSEO}
                className="flex items-center gap-2 text-xs text-[#D4AF37] hover:underline font-bold uppercase"
              >
                <Sparkles size={14} /> Auto-Generate SEO
              </button>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Meta Title</label>
              <input
                type="text"
                value={formData.metaTitle || ""}
                placeholder="Product SEO Title for Google"
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                className="w-full bg-black/40 border border-white/15 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Meta Description</label>
              <textarea
                rows={3}
                value={formData.metaDescription || ""}
                placeholder="Brief summary for Search Engine Results"
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                className="w-full bg-black/40 border border-white/15 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Link
              href="/godmode"
              className="px-8 py-4 bg-white/10 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-10 py-4 bg-[#D4AF37] text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2 disabled:opacity-50 shadow-xl cursor-pointer"
            >
              <Save size={16} /> {saving ? "Saving Changes..." : "Save Timepiece"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}