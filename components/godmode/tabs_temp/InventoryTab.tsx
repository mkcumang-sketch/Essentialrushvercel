"use client";

import React, { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  AlignJustify,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Eye,
  Filter,
  ImageIcon,
  IndianRupee,
  Layers3,
  Layout,
  Package,
  Percent,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import SeoPanel from "./SeoPanel";
import ImageSeoPanel from "./ImageSeoPanel";
import type { WatchFormState } from "@/types/godmode";

export interface LiveWatch {
  _id: string;
  name?: string;
  brand?: string;
  category?: string;
  badge?: string;
  price?: number;
  offerPrice?: number;
  stock?: number;
  imageUrl?: string;
  images?: string[];
}

interface InventoryProps {
  watchForm: WatchFormState;
  setWatchForm: (form: WatchFormState) => void;
  handleSaveProduct: () => void | Promise<void>;
  liveWatches: LiveWatch[];
  handleDeleteProduct: (id: string) => void | Promise<void>;
  PremiumUploadNode: React.ComponentType<{
    placeholder?: string;
    onUploadSuccess: (url: string) => void;
    onUploadStateChange?: (state: boolean) => void;
  }>;
  setIsImageUploading: (val: boolean) => void;
}

const SafeSeoPanel = SeoPanel as React.ComponentType<any>;
const SafeImageSeoPanel = ImageSeoPanel as React.ComponentType<any>;

const currency = (value: number = 0) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const formattedNumber = (value: number = 0) => Number(value || 0).toLocaleString("en-IN");

const getImages = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
};

const getStockStatus = (stockValue: number) => {
  const stock = Number(stockValue || 0);

  if (stock <= 0) {
    return {
      label: "Out of Stock",
      shortLabel: "OUT",
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      icon: XCircle,
    };
  }

  if (stock <= 3) {
    return {
      label: "Critical Stock",
      shortLabel: "CRITICAL",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      icon: AlertTriangle,
    };
  }

  return {
    label: "In Stock",
    shortLabel: "LIVE",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  };
};

export default function InventoryTab({
  watchForm,
  setWatchForm,
  handleSaveProduct,
  liveWatches,
  handleDeleteProduct,
  PremiumUploadNode,
  setIsImageUploading,
}: InventoryProps) {
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<LiveWatch | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<LiveWatch | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const totalProducts = liveWatches.length;

  const totalUnits = useMemo(() => {
    return liveWatches.reduce((total, product) => total + Math.max(0, Number(product.stock || 0)), 0);
  }, [liveWatches]);

  const lowStockProducts = useMemo(() => {
    return liveWatches.filter((product) => {
      const stock = Number(product.stock || 0);
      return stock > 0 && stock <= 3;
    }).length;
  }, [liveWatches]);

  const outOfStockProducts = useMemo(() => {
    return liveWatches.filter((product) => Number(product.stock || 0) <= 0).length;
  }, [liveWatches]);

  const inventoryValue = useMemo(() => {
    return liveWatches.reduce((total, product) => {
      const price = Number(product.offerPrice || product.price || 0);
      const stock = Number(product.stock || 0);
      return total + price * stock;
    }, 0);
  }, [liveWatches]);

  const brands = useMemo(() => {
    return Array.from(new Set(liveWatches.map((product) => product.brand?.trim()).filter(Boolean))).sort() as string[];
  }, [liveWatches]);

  const categories = useMemo(() => {
    return Array.from(new Set(liveWatches.map((product) => product.category?.trim()).filter(Boolean))).sort() as string[];
  }, [liveWatches]);

  const filteredWatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    return liveWatches.filter((product) => {
      const searchableText = [product.name, product.brand, product.category, product.badge].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = !query || searchableText.includes(query);
      const matchesBrand = brandFilter === "ALL" || product.brand === brandFilter;
      const matchesCategory = categoryFilter === "ALL" || product.category === categoryFilter;

      const stock = Number(product.stock || 0);
      const matchesStock =
        stockFilter === "ALL" ||
        (stockFilter === "IN_STOCK" && stock > 3) ||
        (stockFilter === "LOW" && stock > 0 && stock <= 3) ||
        (stockFilter === "OUT" && stock <= 0);

      return matchesSearch && matchesBrand && matchesCategory && matchesStock;
    });
  }, [liveWatches, search, brandFilter, categoryFilter, stockFilter]);

  const basePrice = Number(watchForm.price || 0);
  const salePrice = Number(watchForm.offerPrice || 0);
  const stock = Number(watchForm.stock || 0);

  const discountAmount = basePrice > salePrice && salePrice > 0 ? basePrice - salePrice : 0;
  const discountPercentage = basePrice > 0 && salePrice > 0 && salePrice < basePrice ? Math.round(((basePrice - salePrice) / basePrice) * 100) : 0;
  const galleryImages = getImages(watchForm.images);

  const updateForm = useCallback(
    (updates: Partial<WatchFormState>) => {
      setWatchForm({ ...watchForm, ...updates });
    },
    [watchForm, setWatchForm]
  );

  const specifications = watchForm.amazonDetails || [];

  const updateSpecification = (index: number, field: "key" | "value", value: string) => {
    const next = specifications.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      return { ...item, [field]: value };
    });
    updateForm({ amazonDetails: next });
  };

  const addSpecification = () => {
    updateForm({ amazonDetails: [...specifications, { key: "", value: "" }] });
  };

  const removeSpecification = (index: number) => {
    updateForm({ amazonDetails: specifications.filter((_, itemIndex) => itemIndex !== index) });
  };

  const addGalleryImage = (url: string) => {
    const cleanUrl = url.trim();
    if (!cleanUrl || galleryImages.length >= 6 || galleryImages.includes(cleanUrl)) return;
    updateForm({ images: [...galleryImages, cleanUrl] });
  };

  const removeGalleryImage = (index: number) => {
    updateForm({ images: galleryImages.filter((_, imageIndex) => imageIndex !== index) });
  };

  const saveProduct = async () => {
    setFeedbackMsg(null);
    const name = String(watchForm.name || "").trim();
    const brand = String(watchForm.brand || "").trim();
    const price = Number(watchForm.price || 0);
    const offerPrice = Number(watchForm.offerPrice || 0);

    if (!name || !brand || price <= 0) {
      setFeedbackMsg({ type: "error", text: "Please enter product name, brand, and valid base price." });
      return;
    }

    if (offerPrice > price) {
      setFeedbackMsg({ type: "error", text: "Sale price cannot exceed base price." });
      return;
    }

    setIsSaving(true);
    try {
      await Promise.resolve(handleSaveProduct());
      setFeedbackMsg({ type: "success", text: "Product successfully synchronized to live inventory." });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (error) {
      setFeedbackMsg({ type: "error", text: "Failed to save product to database." });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteProduct?._id) return;
    setIsDeleting(true);
    try {
      await Promise.resolve(handleDeleteProduct(deleteProduct._id));
      setDeleteProduct(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setBrandFilter("ALL");
    setCategoryFilter("ALL");
    setStockFilter("ALL");
  };

  const hasFilters = Boolean(search.trim()) || brandFilter !== "ALL" || categoryFilter !== "ALL" || stockFilter !== "ALL";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-7 pb-24 text-white font-sans">
      {/* HEADER */}
      <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#0a0a0a] p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-[#D4AF37]">
                <Sparkles size={11} /> Inventory Command Suite
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight text-white">Product & Vault Inventory</h2>
            <p className="mt-1 text-xs text-gray-400 max-w-2xl leading-relaxed">
              Configure luxury timepieces, real-time pricing tiers, media assets, structured specifications, and stock limits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/60 px-5 py-3 text-right">
              <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Inventory Valuation</p>
              <p className="font-mono text-lg text-[#D4AF37] font-bold mt-0.5">{currency(inventoryValue)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* KPI GRID */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <InventoryStat icon={<Package size={19} />} label="Products" value={formattedNumber(totalProducts)} description="Catalogue Count" tone="gold" />
        <InventoryStat icon={<Boxes size={19} />} label="Total Stock" value={formattedNumber(totalUnits)} description="Units Available" tone="cyan" />
        <InventoryStat icon={<IndianRupee size={19} />} label="Valuation" value={currency(inventoryValue)} description="Total Asset Worth" tone="green" />
        <InventoryStat icon={<AlertTriangle size={19} />} label="Critical Stock" value={formattedNumber(lowStockProducts)} description="≤ 3 Units Remaining" tone="orange" />
        <InventoryStat icon={<XCircle size={19} />} label="Out of Stock" value={formattedNumber(outOfStockProducts)} description="Depleted Items" tone="red" />
      </section>

      {/* MAIN TWO COLUMN GRID */}
      <div className="grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* PRODUCT BUILDER */}
        <div className="min-w-0">
          <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#0a0a0a] shadow-2xl">
            <div className="border-b border-white/10 p-5 md:p-6 bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layout size={17} className="text-[#D4AF37]" />
                  <h3 className="text-base font-bold">Timepiece Constructor</h3>
                </div>
                <span className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-[#D4AF37]">
                  Live Sync
                </span>
              </div>
            </div>

            <div className="space-y-6 p-5 md:p-7">
              {feedbackMsg && (
                <div
                  className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                    feedbackMsg.type === "success"
                      ? "bg-green-500/10 border border-green-500/30 text-green-400"
                      : "bg-red-500/10 border border-red-500/30 text-red-400"
                  }`}
                >
                  {feedbackMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  {feedbackMsg.text}
                </div>
              )}

              {/* IDENTITY */}
              <FormSection icon={<Tag size={16} />} title="Identity & Classification" description="Core brand and catalogue categorization.">
                <div className="space-y-4">
                  <FormInput label="Timepiece Title" value={watchForm.name} onChange={(value) => updateForm({ name: value })} placeholder="e.g. Royal Oak Selfwinding" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput label="Brand" value={watchForm.brand} onChange={(value) => updateForm({ brand: value })} placeholder="e.g. Audemars Piguet" />
                    <FormInput label="Category" value={watchForm.category} onChange={(value) => updateForm({ category: value })} placeholder="e.g. Investment Grade" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput label="Priority Weight" value={watchForm.priority} type="number" onChange={(value) => updateForm({ priority: Number(value || 0) })} placeholder="100" />
                    <FormInput label="Badge Tag" value={watchForm.badge} onChange={(value) => updateForm({ badge: value })} placeholder="Masterpiece" />
                  </div>
                </div>
              </FormSection>

              {/* PRICING & STOCK */}
              <FormSection icon={<CircleDollarSign size={16} />} title="Valuation & Inventory" description="Specify MSRP, offer pricing, and inventory count.">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput label="Base Price" prefix="₹" type="number" value={watchForm.price} onChange={(value) => updateForm({ price: value })} placeholder="0" />
                  <FormInput label="Offer Price" prefix="₹" accent type="number" value={watchForm.offerPrice} onChange={(value) => updateForm({ offerPrice: value })} placeholder="0" />
                  <FormInput label="Stock Units" type="number" value={watchForm.stock} onChange={(value) => updateForm({ stock: value })} placeholder="0" />
                </div>
                {discountPercentage > 0 && (
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs">
                    <span className="text-emerald-400 font-bold">Active Customer Discount: Save {currency(discountAmount)}</span>
                    <span className="bg-emerald-500/10 px-2.5 py-1 rounded text-emerald-400 font-mono font-bold">-{discountPercentage}%</span>
                  </div>
                )}
              </FormSection>

              {/* VISUAL MEDIA */}
              <FormSection icon={<ImageIcon size={16} />} title="Media Assets" description="Main thumbnail, high-res gallery, and video reel.">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <PremiumUploadNode
                      placeholder="Main Dial Image"
                      onUploadSuccess={(url) => updateForm({ imageUrl: url })}
                      onUploadStateChange={setIsImageUploading}
                    />
                    {watchForm.imageUrl ? (
                      <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-white/20">
                        <img src={watchForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => updateForm({ imageUrl: "" })}
                          className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-xs font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">No main image uploaded</span>
                    )}
                  </div>

                  {/* GALLERY ARRAY */}
                  <div>
                    <label className="text-[9px] uppercase font-black tracking-widest text-gray-400 block mb-2">
                      Gallery ({galleryImages.length}/6)
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {galleryImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                          <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-red-600 rounded text-white"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                      {galleryImages.length < 6 && (
                        <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/40">
                          <PremiumUploadNode placeholder="Add" onUploadSuccess={addGalleryImage} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* SPECIFICATIONS */}
              <FormSection icon={<AlignJustify size={16} />} title="Horological Specifications" description="Case material, movement, dial color, and complications.">
                <div className="space-y-3">
                  {specifications.map((detail, index) => (
                    <div key={index} className="grid grid-cols-[1fr_1.5fr_auto] gap-2">
                      <input
                        value={detail.key || ""}
                        onChange={(e) => updateSpecification(index, "key", e.target.value)}
                        placeholder="e.g. Movement"
                        className="rounded-xl border border-white/10 bg-black px-3 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none"
                      />
                      <input
                        value={detail.value || ""}
                        onChange={(e) => updateSpecification(index, "value", e.target.value)}
                        placeholder="e.g. Automatic Calibre 3126"
                        className="rounded-xl border border-white/10 bg-black px-3 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeSpecification(index)}
                        className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSpecification}
                    className="w-full py-3 border border-dashed border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#D4AF37] hover:text-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} /> Add Specification Field
                  </button>
                </div>
              </FormSection>

              {/* SEO & IMAGE PANELS */}
              <section className="space-y-6 border-t border-white/10 pt-6">
                <SafeSeoPanel entityData={watchForm} setEntityData={setWatchForm} />
                <SafeImageSeoPanel entityData={watchForm} setEntityData={setWatchForm} />
              </section>

              {/* SUBMIT BUTTON */}
              <button
                type="button"
                disabled={isSaving}
                onClick={saveProduct}
                className="w-full py-4 bg-[#D4AF37] text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-white transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? "Synchronizing to Vault..." : "Publish To Live Inventory"}
              </button>
            </div>
          </section>
        </div>

        {/* LIVE INVENTORY EXPLORER */}
        <div className="min-w-0">
          <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#0a0a0a] shadow-2xl">
            <div className="border-b border-white/10 p-5 md:p-6 bg-white/[0.02]">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={17} className="text-[#D4AF37]" />
                    <h3 className="text-base font-bold">Catalog Assets</h3>
                  </div>
                  <span className="font-mono text-xs text-gray-400">
                    {filteredWatches.length} of {liveWatches.length}
                  </span>
                </div>

                {/* SEARCH */}
                <div className="relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter catalogue by title, brand, badge..."
                    className="w-full rounded-xl border border-white/10 bg-black pl-10 pr-4 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* PRODUCT GRID */}
            <div className="p-5 md:p-6">
              {filteredWatches.length === 0 ? (
                <div className="py-20 text-center text-gray-500 text-xs uppercase tracking-widest font-bold">
                  No catalog items match your search.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredWatches.map((watch, index) => (
                    <ProductCard
                      key={watch._id || index}
                      watch={watch}
                      index={index}
                      onPreview={() => setPreviewProduct(watch)}
                      onDelete={() => setDeleteProduct(watch)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      <AnimatePresence>
        {previewProduct && <ProductPreviewModal product={previewProduct} onClose={() => setPreviewProduct(null)} />}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {deleteProduct && (
          <DeleteConfirmModal
            product={deleteProduct}
            loading={isDeleting}
            onCancel={() => setDeleteProduct(null)}
            onConfirm={confirmDelete}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* =========================================================
   SUPPORTING ATOMIC COMPONENTS
========================================================= */

function InventoryStat({
  icon,
  label,
  value,
  description,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  tone: "gold" | "cyan" | "green" | "orange" | "red";
}) {
  const tones = {
    gold: "text-[#D4AF37] bg-[#D4AF37]/10",
    cyan: "text-cyan-400 bg-cyan-500/10",
    green: "text-emerald-400 bg-emerald-500/10",
    orange: "text-orange-400 bg-orange-500/10",
    red: "text-red-400 bg-red-500/10",
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-widest font-black text-gray-400">{label}</span>
        <div className={`p-2 rounded-xl ${tones[tone]}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold font-mono mt-4 text-white">{value}</p>
      <p className="text-[10px] text-gray-500 mt-1">{description}</p>
    </div>
  );
}

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
        <div className="text-[#D4AF37]">{icon}</div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider">{title}</h4>
          <p className="text-[10px] text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
  accent = false,
}: {
  label: string;
  value: string | number | undefined | null;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <label className={`text-[9px] font-black uppercase tracking-widest block mb-1.5 ${accent ? "text-cyan-400" : "text-gray-400"}`}>
        {label}
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">{prefix}</span>}
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-black border rounded-xl py-2.5 px-3.5 text-xs text-white outline-none transition-colors ${
            prefix ? "pl-8" : ""
          } ${accent ? "border-cyan-500/30 focus:border-cyan-400" : "border-white/10 focus:border-[#D4AF37]"}`}
        />
      </div>
    </div>
  );
}

function ProductCard({
  watch,
  onPreview,
  onDelete,
}: {
  watch: LiveWatch;
  index: number;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const status = getStockStatus(Number(watch.stock || 0));
  const image = watch.imageUrl || (watch.images && watch.images[0]);
  const currentPrice = Number(watch.offerPrice || watch.price || 0);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-[#D4AF37]/30 transition-colors group">
      <div>
        <div className="relative aspect-square bg-black rounded-xl overflow-hidden mb-3 p-4 flex items-center justify-center">
          {image ? (
            <img src={image} alt={watch.name || "Watch"} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
          ) : (
            <ImageIcon size={24} className="text-gray-600" />
          )}
          <span className={`absolute top-2 left-2 text-[7px] font-black uppercase px-2 py-0.5 rounded-full border ${status.bg} ${status.border} ${status.color}`}>
            {status.shortLabel}
          </span>
        </div>

        <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-wider">{watch.brand || "Brand"}</p>
        <h4 className="text-xs font-bold text-white line-clamp-1 mt-0.5">{watch.name || "Untitled"}</h4>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        <p className="font-mono text-sm text-emerald-400 font-bold">{currency(currentPrice)}</p>
        <div className="flex gap-1.5">
          <button onClick={onPreview} className="p-2 bg-white/5 hover:bg-white hover:text-black rounded-lg transition-colors text-gray-400">
            <Eye size={12} />
          </button>
          <button onClick={onDelete} className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded-lg transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductPreviewModal({ product, onClose }: { product: LiveWatch; onClose: () => void }) {
  const image = product.imageUrl || (product.images && product.images[0]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="bg-[#0c0c0c] border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="aspect-square bg-black rounded-2xl p-6 flex items-center justify-center">
          {image ? <img src={image} alt="Product" className="w-full h-full object-contain" /> : <ImageIcon size={36} />}
        </div>
        <div>
          <span className="text-[9px] font-mono text-[#D4AF37] uppercase">{product.brand}</span>
          <h3 className="text-lg font-serif font-bold text-white">{product.name}</h3>
          <p className="font-mono text-2xl text-emerald-400 font-bold mt-2">{currency(product.offerPrice || product.price)}</p>
          <p className="text-xs text-gray-400 mt-1">Stock: {product.stock || 0} Units Available</p>
        </div>
        <button onClick={onClose} className="w-full py-3 bg-white/10 hover:bg-white hover:text-black rounded-xl text-xs font-bold uppercase transition-all">
          Close Preview
        </button>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  product,
  loading,
  onCancel,
  onConfirm,
}: {
  product: LiveWatch;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onClick={onCancel}>
      <div className="bg-[#0c0c0c] border border-red-500/30 rounded-3xl max-w-sm w-full p-6 space-y-4 text-center" onClick={(e) => e.stopPropagation()}>
        <AlertTriangle size={32} className="text-red-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Delete Timepiece?</h3>
        <p className="text-xs text-gray-400">Are you sure you want to purge "{product.name}" from active inventory?</p>
        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase">
            {loading ? "Deleting..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}