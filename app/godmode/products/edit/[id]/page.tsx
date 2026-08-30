"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Save,
  Trash2,
  RefreshCw,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Tag,
  IndianRupee,
  AlignLeft,
  Sliders,
} from "lucide-react";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "Investment Grade",
    badge: "Masterpiece",
    price: 0,
    offerPrice: 0,
    stock: 1,
    description: "",
    imageUrl: "",
    images: [] as string[],
    amazonDetails: [] as Array<{ key: string; value: string }>,
    seo: {
      metaTitle: "",
      metaDescription: "",
      focusKeyword: "",
      slug: "",
    },
  });

  // Fetch Product on Mount
  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      try {
        setLoading(true);
        setFeedback(null);
        const res = await fetch(`/api/products?id=${id}`, { cache: "no-store" });
        const json = await res.json();

        if (json.success && json.data) {
          const p = json.data;
          setFormData({
            name: p.name || p.title || "",
            brand: p.brand || "",
            category: p.category || "Investment Grade",
            badge: p.badge || "",
            price: Number(p.price || 0),
            offerPrice: Number(p.offerPrice || p.price || 0),
            stock: Number(p.stock || 0),
            description: p.description || "",
            imageUrl: p.imageUrl || (p.images && p.images[0]) || "",
            images: Array.isArray(p.images) ? p.images : [],
            amazonDetails: Array.isArray(p.amazonDetails) && p.amazonDetails.length > 0 ? p.amazonDetails : [
              { key: "Movement", value: "Automatic Calibre" },
              { key: "Case Material", value: "Oystersteel / Sapphire" },
            ],
            seo: {
              metaTitle: p.seo?.metaTitle || "",
              metaDescription: p.seo?.metaDescription || "",
              focusKeyword: p.seo?.focusKeyword || "",
              slug: p.slug || "",
            },
          });
        } else {
          setFeedback({ type: "error", message: json.error || "Timepiece not found in database." });
        }
      } catch (err: any) {
        setFeedback({ type: "error", message: "Network connection disrupted while retrieving timepiece data." });
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  // AI Generation with Groq
  const handleGenerateAiCopy = async () => {
    if (!formData.name || !formData.brand) {
      setFeedback({ type: "error", message: "Please specify Timepiece Name and Brand first." });
      return;
    }

    setGeneratingAi(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          brand: formData.brand,
          category: formData.category,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setFormData((prev) => ({
          ...prev,
          description: json.data.description || prev.description,
          badge: json.data.badge || prev.badge,
          amazonDetails: json.data.specifications || prev.amazonDetails,
          seo: {
            ...prev.seo,
            metaTitle: json.data.metaTitle || prev.seo.metaTitle,
            metaDescription: json.data.metaDescription || prev.seo.metaDescription,
          },
        }));
        setFeedback({ type: "success", message: "✨ Groq AI generated editorial description & horological specs!" });
      } else {
        setFeedback({ type: "error", message: json.error || "AI generation failed." });
      }
    } catch {
      setFeedback({ type: "error", message: "AI generation network error." });
    } finally {
      setGeneratingAi(false);
    }
  };

  // Save Product to DB
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.brand || !formData.price) {
      setFeedback({ type: "error", message: "Name, Brand, and Base Price are required." });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: id,
          ...formData,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setFeedback({ type: "success", message: "Timepiece successfully updated in active inventory!" });
        setTimeout(() => router.push("/godmode"), 1200);
      } else {
        setFeedback({ type: "error", message: json.error || "Failed to update timepiece." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error occurred while saving." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090b] text-white flex items-center justify-center font-mono text-xs uppercase tracking-widest">
        <RefreshCw size={20} className="animate-spin text-[#D4AF37] mr-3" /> Retrieving Vault Item...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090b] text-gray-200 font-sans p-6 md:p-12 selection:bg-[#D4AF37] selection:text-black">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* TOP BAR */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link
            href="/godmode"
            className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[#D4AF37] flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Godmode
          </Link>
          <h1 className="text-xl md:text-2xl font-serif font-black uppercase tracking-wider text-[#D4AF37]">
            Edit Timepiece
          </h1>
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* SECTION 1: GENERAL DETAILS */}
          <div className="bg-[#0A0D10] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                <Tag size={16} className="text-[#D4AF37]" /> 1. General Details
              </div>
              <button
                type="button"
                onClick={handleGenerateAiCopy}
                disabled={generatingAi}
                className="px-4 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black border border-[#D4AF37]/30 text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={14} className={generatingAi ? "animate-spin" : ""} />
                {generatingAi ? "Consulting Groq..." : "✨ Auto-Fill with Groq AI"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] uppercase font-bold tracking-widest text-gray-400 block mb-1.5">Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold tracking-widest text-gray-400 block mb-1.5">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] uppercase font-bold tracking-widest text-gray-400 block mb-1.5">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold tracking-widest text-gray-400 block mb-1.5">Badge / Tag</label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] uppercase font-bold tracking-widest text-gray-400 block mb-1.5">Luxury Description</label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#D4AF37] leading-relaxed font-serif"
              />
            </div>
          </div>

          {/* SECTION 2: VALUATION & STOCK */}
          <div className="bg-[#0A0D10] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider border-b border-white/10 pb-4">
              <IndianRupee size={16} className="text-[#D4AF37]" /> 2. Valuation & Inventory Pricing
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[9px] uppercase font-bold tracking-widest text-gray-400 block mb-1.5">Original Price (₹)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold tracking-widest text-cyan-400 block mb-1.5">Offer Price (₹)</label>
                <input
                  type="number"
                  value={formData.offerPrice}
                  onChange={(e) => setFormData({ ...formData, offerPrice: Number(e.target.value) })}
                  className="w-full bg-white/[0.03] border border-cyan-500/30 rounded-xl px-4 py-3 text-xs text-white font-mono outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold tracking-widest text-gray-400 block mb-1.5">Available Stock Units</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: SPECIFICATIONS */}
          <div className="bg-[#0A0D10] border border-white/10 rounded-3xl p-6 md:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                <Sliders size={16} className="text-[#D4AF37]" /> 3. Horological Specifications
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, amazonDetails: [...formData.amazonDetails, { key: "", value: "" }] })}
                className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-wider hover:underline flex items-center gap-1"
              >
                <Plus size={12} /> Add Field
              </button>
            </div>

            <div className="space-y-3">
              {formData.amazonDetails.map((spec, index) => (
                <div key={index} className="grid grid-cols-[1fr_1.5fr_auto] gap-3">
                  <input
                    type="text"
                    value={spec.key}
                    placeholder="Key (e.g., Calibre)"
                    onChange={(e) => {
                      const copy = [...formData.amazonDetails];
                      copy[index].key = e.target.value;
                      setFormData({ ...formData, amazonDetails: copy });
                    }}
                    className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    placeholder="Value (e.g., Automatic 3235)"
                    onChange={(e) => {
                      const copy = [...formData.amazonDetails];
                      copy[index].value = e.target.value;
                      setFormData({ ...formData, amazonDetails: copy });
                    }}
                    className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, amazonDetails: formData.amazonDetails.filter((_, i) => i !== index) })}
                    className="p-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-4 bg-[#D4AF37] hover:bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xl disabled:opacity-50"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "Synchronizing to Vault..." : "Save & Update Timepiece"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}