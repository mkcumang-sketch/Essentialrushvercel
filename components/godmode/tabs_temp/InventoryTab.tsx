"use client";

import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

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

/* =========================================================
   TYPES
========================================================= */

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

/*
 * IMPORTANT:
 *
 * SeoPanel / ImageSeoPanel may have different prop definitions
 * in your current project.
 *
 * Casting ONLY these external panels keeps InventoryTab compatible
 * without changing their existing implementation.
 */
const SafeSeoPanel = SeoPanel as React.ComponentType<any>;
const SafeImageSeoPanel = ImageSeoPanel as React.ComponentType<any>;

/* =========================================================
   HELPERS
========================================================= */

const currency = (value: number = 0) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formattedNumber = (value: number = 0) =>
  Number(value || 0).toLocaleString("en-IN");

const getImages = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0
  );
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

  if (stock <= 10) {
    return {
      label: "Low Stock",
      shortLabel: "LOW",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
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

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function InventoryTab({
  watchForm,
  setWatchForm,
  handleSaveProduct,
  liveWatches,
  handleDeleteProduct,
  PremiumUploadNode,
  setIsImageUploading,
}: InventoryProps) {
  /* -------------------------------------------------------
     UI STATE
  ------------------------------------------------------- */

  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");

  const [showFilters, setShowFilters] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [previewProduct, setPreviewProduct] =
    useState<LiveWatch | null>(null);

  const [deleteProduct, setDeleteProduct] =
    useState<LiveWatch | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /* -------------------------------------------------------
     INVENTORY STATS
  ------------------------------------------------------- */

  const totalProducts = liveWatches.length;

  const totalUnits = useMemo(() => {
    return liveWatches.reduce(
      (total, product) =>
        total + Math.max(0, Number(product.stock || 0)),
      0
    );
  }, [liveWatches]);

  const lowStockProducts = useMemo(() => {
    return liveWatches.filter((product) => {
      const stock = Number(product.stock || 0);
      return stock > 0 && stock <= 3;
    }).length;
  }, [liveWatches]);

  const outOfStockProducts = useMemo(() => {
    return liveWatches.filter(
      (product) => Number(product.stock || 0) <= 0
    ).length;
  }, [liveWatches]);

  const inventoryValue = useMemo(() => {
    return liveWatches.reduce((total, product) => {
      const price = Number(
        product.offerPrice || product.price || 0
      );

      const stock = Number(product.stock || 0);

      return total + price * stock;
    }, 0);
  }, [liveWatches]);

  const brands = useMemo(() => {
    return Array.from(
      new Set(
        liveWatches
          .map((product) => product.brand?.trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a!.localeCompare(b!)) as string[];
  }, [liveWatches]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        liveWatches
          .map((product) => product.category?.trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a!.localeCompare(b!)) as string[];
  }, [liveWatches]);

  /* -------------------------------------------------------
     FILTERED PRODUCTS
  ------------------------------------------------------- */

  const filteredWatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    return liveWatches.filter((product) => {
      const searchableText = [
        product.name,
        product.brand,
        product.category,
        product.badge,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesBrand =
        brandFilter === "ALL" ||
        product.brand === brandFilter;

      const matchesCategory =
        categoryFilter === "ALL" ||
        product.category === categoryFilter;

      const stock = Number(product.stock || 0);

      const matchesStock =
        stockFilter === "ALL" ||
        (stockFilter === "IN_STOCK" && stock > 3) ||
        (stockFilter === "LOW" && stock > 0 && stock <= 3) ||
        (stockFilter === "OUT" && stock <= 0);

      return (
        matchesSearch &&
        matchesBrand &&
        matchesCategory &&
        matchesStock
      );
    });
  }, [
    liveWatches,
    search,
    brandFilter,
    categoryFilter,
    stockFilter,
  ]);

  /* -------------------------------------------------------
     FORM VALUES
  ------------------------------------------------------- */

  const basePrice = Number(watchForm.price || 0);
  const salePrice = Number(watchForm.offerPrice || 0);
  const stock = Number(watchForm.stock || 0);

  const discountAmount =
    basePrice > salePrice && salePrice > 0
      ? basePrice - salePrice
      : 0;

  const discountPercentage =
    basePrice > 0 &&
    salePrice > 0 &&
    salePrice < basePrice
      ? Math.round(
          ((basePrice - salePrice) / basePrice) * 100
        )
      : 0;

  const galleryImages = getImages(watchForm.images);

  /* -------------------------------------------------------
     SAFE FORM UPDATE
  ------------------------------------------------------- */

  const updateForm = useCallback(
    (updates: Partial<WatchFormState>) => {
      setWatchForm({
        ...watchForm,
        ...updates,
      });
    },
    [watchForm, setWatchForm]
  );

  /* -------------------------------------------------------
     SPECIFICATIONS
  ------------------------------------------------------- */

  const specifications = watchForm.amazonDetails || [];

  const updateSpecification = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const next = specifications.map((item, itemIndex) => {
      if (itemIndex !== index) return item;

      return {
        ...item,
        [field]: value,
      };
    });

    updateForm({
      amazonDetails: next,
    });
  };

  const addSpecification = () => {
    updateForm({
      amazonDetails: [
        ...specifications,
        {
          key: "",
          value: "",
        },
      ],
    });
  };

  const removeSpecification = (index: number) => {
    updateForm({
      amazonDetails: specifications.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    });
  };

  /* -------------------------------------------------------
     GALLERY
  ------------------------------------------------------- */

  const addGalleryImage = (url: string) => {
    const cleanUrl = url.trim();

    if (!cleanUrl) return;

    if (galleryImages.length >= 6) {
      console.log("Maximum 6 gallery images allowed.");
      return;
    }

    if (galleryImages.includes(cleanUrl)) {
      return;
    }

    updateForm({
      images: [...galleryImages, cleanUrl],
    });
  };

  const removeGalleryImage = (index: number) => {
    updateForm({
      images: galleryImages.filter(
        (_, imageIndex) => imageIndex !== index
      ),
    });
  };

  /* -------------------------------------------------------
     SAVE PRODUCT
  ------------------------------------------------------- */

  const saveProduct = async () => {
    const name = String(watchForm.name || "").trim();
    const brand = String(watchForm.brand || "").trim();
    const price = Number(watchForm.price || 0);
    const offerPrice = Number(watchForm.offerPrice || 0);

    if (!name) {
      console.log("Please enter a product name.");
      return;
    }

    if (!brand) {
      console.log("Please enter a brand name.");
      return;
    }

    if (price <= 0) {
      console.log("Please enter a valid base price.");
      return;
    }

    if (offerPrice < 0) {
      console.log("Sale price cannot be negative.");
      return;
    }

    if (offerPrice > price) {
      console.log("Sale price cannot be higher than base price.");
      return;
    }

    if (stock < 0) {
      console.log("Stock cannot be negative.");
      return;
    }

    setIsSaving(true);

    try {
      await Promise.resolve(handleSaveProduct());
    } catch (error) {
      console.error("Inventory save error:", error);
      console.log("Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  /* -------------------------------------------------------
     DELETE PRODUCT
  ------------------------------------------------------- */

  const confirmDelete = async () => {
    if (!deleteProduct?._id) return;

    setIsDeleting(true);

    try {
      await Promise.resolve(
        handleDeleteProduct(deleteProduct._id)
      );

      setDeleteProduct(null);
    } catch (error) {
      console.error("Delete product error:", error);
      console.log("Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  /* -------------------------------------------------------
     FILTER RESET
  ------------------------------------------------------- */

  const resetFilters = () => {
    setSearch("");
    setBrandFilter("ALL");
    setCategoryFilter("ALL");
    setStockFilter("ALL");
  };

  const hasFilters =
    Boolean(search.trim()) ||
    brandFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    stockFilter !== "ALL";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-7 pb-24 text-white"
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#161616] via-[#0d0d0d] to-black p-6 md:p-8">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#D4AF37]/10 blur-[100px]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.22em] text-[#D4AF37]">
                <Sparkles size={11} />
                Inventory Command Center
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Product Inventory
            </h2>

            <p className="mt-2 max-w-2xl text-xs leading-6 text-gray-400">
              Create, manage and monitor your luxury watch
              catalogue, pricing, stock, media, specifications
              and commercial metadata from one command center.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-right sm:block">
              <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
                Inventory Value
              </p>

              <p className="mt-1 font-mono text-lg text-[#D4AF37]">
                {currency(inventoryValue)}
              </p>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-[9px] font-bold uppercase tracking-widest text-gray-400 transition hover:border-[#D4AF37]/30 hover:text-white"
            >
              <RefreshCw size={15} />
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================
          KPI
      =================================================== */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <InventoryStat
          icon={<Package size={19} />}
          label="Products"
          value={formattedNumber(totalProducts)}
          description="Live catalogue"
          tone="gold"
        />

        <InventoryStat
          icon={<Boxes size={19} />}
          label="Total Units"
          value={formattedNumber(totalUnits)}
          description="Available quantity"
          tone="cyan"
        />

        <InventoryStat
          icon={<IndianRupee size={19} />}
          label="Inventory Value"
          value={currency(inventoryValue)}
          description="Current valuation"
          tone="green"
        />

        <InventoryStat
          icon={<AlertTriangle size={19} />}
          label="Critical Stock"
          value={formattedNumber(lowStockProducts)}
          description="3 units or less"
          tone="orange"
        />

        <InventoryStat
          icon={<XCircle size={19} />}
          label="Out of Stock"
          value={formattedNumber(outOfStockProducts)}
          description="Needs attention"
          tone="red"
        />
      </section>

      {/* ===================================================
          MAIN GRID
      =================================================== */}

      <div className="grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* =================================================
            PRODUCT BUILDER
        ================================================= */}

        <div className="min-w-0">
          <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#0b0b0b] shadow-2xl">
            <div className="border-b border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Layout
                    size={17}
                    className="text-[#D4AF37]"
                  />

                  <h3 className="text-base font-bold">
                    Product Builder
                  </h3>
                </div>

                <span className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-2 text-[8px] font-black uppercase tracking-widest text-[#D4AF37]">
                  Admin
                </span>
              </div>
            </div>

            <div className="space-y-7 p-5 md:p-7">
              {/* IDENTITY */}

              <FormSection
                icon={<Tag size={16} />}
                title="Identity & Classification"
                description="Core information used throughout the catalogue."
              >
                <div className="space-y-4">
                  <FormInput
                    label="Product Name"
                    value={watchForm.name}
                    onChange={(value) =>
                      updateForm({ name: value })
                    }
                    placeholder="e.g. Royal Oak Chronograph"
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormInput
                      label="Brand"
                      value={watchForm.brand}
                      onChange={(value) =>
                        updateForm({ brand: value })
                      }
                      placeholder="e.g. Rolex"
                    />

                    <FormInput
                      label="Category"
                      value={watchForm.category}
                      onChange={(value) =>
                        updateForm({ category: value })
                      }
                      placeholder="e.g. Rare Vintage"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="Display Priority"
                      value={watchForm.priority}
                      type="number"
                      onChange={(value) =>
                        updateForm({
                          priority: Number(value || 0),
                        })
                      }
                      placeholder="100"
                    />

                    <FormInput
                      label="Badge"
                      value={watchForm.badge}
                      onChange={(value) =>
                        updateForm({ badge: value })
                      }
                      placeholder="Limited"
                    />
                  </div>
                </div>
              </FormSection>

              {/* PRICING */}

              <FormSection
                icon={<CircleDollarSign size={16} />}
                title="Pricing & Stock"
                description="Control commercial value, sale pricing and available units."
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormInput
                    label="Base Price"
                    prefix="₹"
                    type="number"
                    value={watchForm.price}
                    onChange={(value) =>
                      updateForm({ price: value })
                    }
                    placeholder="0"
                  />

                  <FormInput
                    label="Sale Price"
                    prefix="₹"
                    accent
                    type="number"
                    value={watchForm.offerPrice}
                    onChange={(value) =>
                      updateForm({
                        offerPrice: value,
                      })
                    }
                    placeholder="0"
                  />

                  <FormInput
                    label="Stock"
                    type="number"
                    value={watchForm.stock}
                    onChange={(value) =>
                      updateForm({
                        stock: value,
                      })
                    }
                    placeholder="0"
                  />
                </div>

                {discountPercentage > 0 && (
                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
                        <Percent size={15} />
                      </div>

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                          Active Discount
                        </p>

                        <p className="mt-1 text-xs text-white">
                          Save {currency(discountAmount)}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-400">
                      -{discountPercentage}%
                    </span>
                  </div>
                )}
              </FormSection>

              {/* MEDIA */}

              <FormSection
                icon={<ImageIcon size={16} />}
                title="Visual Assets"
                description="Main product image, gallery, video and 3D model."
              >
                <div className="space-y-5">
                  {/* MAIN IMAGE */}

                  <div className="rounded-2xl border border-white/10 bg-[#111] p-4 md:p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                        Main Product Image
                      </label>

                      {watchForm.imageUrl && (
                        <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-emerald-400">
                          <CheckCircle2 size={11} />
                          Ready
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_150px]">
                      <div className="flex items-center justify-center md:justify-start">
                        <PremiumUploadNode
                          placeholder="Main Image"
                          onUploadSuccess={(url) =>
                            updateForm({
                              imageUrl: url,
                            })
                          }
                          onUploadStateChange={
                            setIsImageUploading
                          }
                        />
                      </div>

                      <div className="group relative h-36 overflow-hidden rounded-2xl border border-dashed border-white/20 bg-black">
                        {watchForm.imageUrl ? (
                          <>
                            <img
                              src={watchForm.imageUrl}
                              alt={
                                watchForm.name ||
                                "Product preview"
                              }
                              className="h-full w-full object-cover"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                updateForm({
                                  imageUrl: "",
                                })
                              }
                              className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-600/80 text-[9px] font-black uppercase tracking-widest text-white opacity-0 transition group-hover:opacity-100"
                            >
                              <Trash2 size={16} />
                              Remove
                            </button>
                          </>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center text-gray-500">
                            <ImageIcon size={25} />

                            <span className="mt-2 text-[8px] font-bold uppercase tracking-widest">
                              No Image
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* GALLERY */}

                  <div className="rounded-2xl border border-white/10 bg-[#111] p-4 md:p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                          Product Gallery
                        </label>

                        <p className="mt-1 text-[8px] text-gray-500">
                          {galleryImages.length}/6 images
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {galleryImages.map((image, index) => (
                        <div
                          key={`${image}-${index}`}
                          className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black"
                        >
                          <img
                            src={image}
                            alt={`Gallery ${index + 1}`}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeGalleryImage(index)
                            }
                            className="absolute right-1.5 top-1.5 rounded-lg bg-red-600 p-2 text-white opacity-100 transition md:opacity-0 md:group-hover:opacity-100"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}

                      {galleryImages.length < 6 && (
                        <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30">
                          <PremiumUploadNode
                            placeholder="Add Image"
                            onUploadSuccess={
                              addGalleryImage
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormInput
                      label="Cinematic Video URL"
                      value={watchForm.videoUrl}
                      onChange={(value) =>
                        updateForm({
                          videoUrl: value,
                        })
                      }
                      placeholder="https://..."
                    />

                    <FormInput
                      label="3D Model URL"
                      value={watchForm.model3DUrl}
                      onChange={(value) =>
                        updateForm({
                          model3DUrl: value,
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </FormSection>

              {/* SPECIFICATIONS */}

              <FormSection
                icon={<AlignJustify size={16} />}
                title="Specifications"
                description="Add structured product specifications."
              >
                <div className="space-y-3">
                  {specifications.map((detail, index) => (
                    <div
                      key={`spec-${index}`}
                      className="grid grid-cols-1 gap-2 rounded-2xl border border-white/5 bg-black/30 p-2 md:grid-cols-[0.8fr_1.2fr_auto]"
                    >
                      <input
                        value={detail.key || ""}
                        onChange={(event) =>
                          updateSpecification(
                            index,
                            "key",
                            event.target.value
                          )
                        }
                        placeholder="e.g. Dial Color"
                        className="min-h-[46px] rounded-xl border border-white/10 bg-black px-3 text-xs text-white outline-none transition focus:border-[#D4AF37]"
                      />

                      <input
                        value={detail.value || ""}
                        onChange={(event) =>
                          updateSpecification(
                            index,
                            "value",
                            event.target.value
                          )
                        }
                        placeholder="e.g. Matte Black"
                        className="min-h-[46px] rounded-xl border border-white/10 bg-black px-3 text-xs text-white outline-none transition focus:border-[#D4AF37]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeSpecification(index)
                        }
                        className="flex min-h-[46px] items-center justify-center rounded-xl border border-red-500/10 bg-red-500/5 px-4 text-red-400 transition hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addSpecification}
                    className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[9px] font-black uppercase tracking-widest text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black"
                  >
                    <Plus size={14} />
                    Add Specification
                  </button>
                </div>
              </FormSection>

              {/* CONTENT */}

              <FormSection
                icon={<Layers3 size={16} />}
                title="Content & Discovery"
                description="Description, tags and search-oriented metadata."
              >
                <div className="space-y-4">
                  <FormInput
                    label="SEO / Quick Tags"
                    value={watchForm.seoTags}
                    onChange={(value) =>
                      updateForm({
                        seoTags: value,
                      })
                    }
                    placeholder="luxury, automatic, swiss, premium..."
                  />

                  <div>
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-widest text-gray-400">
                      Detailed Description
                    </label>

                    <textarea
                      value={watchForm.description || ""}
                      onChange={(event) =>
                        updateForm({
                          description:
                            event.target.value,
                        })
                      }
                      rows={6}
                      placeholder="Describe the masterpiece..."
                      className="w-full resize-none rounded-2xl border border-white/10 bg-black p-4 text-xs leading-6 text-white outline-none transition placeholder:text-gray-600 focus:border-[#D4AF37]"
                    />

                    <div className="mt-2 text-right text-[8px] uppercase tracking-widest text-gray-500">
                      {watchForm.description?.length || 0}{" "}
                      characters
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* ADVANCED */}

              <section className="overflow-hidden rounded-[24px] border border-[#D4AF37]/20 bg-gradient-to-br from-[#111] to-black">
                <button
                  type="button"
                  onClick={() =>
                    setShowAdvanced(
                      (current) => !current
                    )
                  }
                  className="flex min-h-[64px] w-full items-center justify-between px-5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[#D4AF37]/10 p-2.5 text-[#D4AF37]">
                      <Settings2 size={16} />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-white">
                        Advanced Commercial Logic
                      </p>

                      <p className="mt-1 text-[8px] uppercase tracking-widest text-gray-400">
                        VIP • Tax • Transit
                      </p>
                    </div>
                  </div>

                  {showAdvanced ? (
                    <ChevronUp
                      size={17}
                      className="text-gray-400"
                    />
                  ) : (
                    <ChevronDown
                      size={17}
                      className="text-gray-400"
                    />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {showAdvanced && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        height: 0,
                      }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                      }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 border-t border-white/10 p-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <FormInput
                            label="VIP Product Code"
                            value={
                              watchForm.vipVaultKey
                            }
                            onChange={(value) =>
                              updateForm({
                                vipVaultKey:
                                  value.toUpperCase(),
                              })
                            }
                            placeholder="ROLEXVIP"
                          />

                          <FormInput
                            label="VIP Discount"
                            value={
                              watchForm.vipDiscount
                            }
                            type="number"
                            prefix="₹"
                            onChange={(value) =>
                              updateForm({
                                vipDiscount: value,
                              })
                            }
                            placeholder="5000"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <FormInput
                            label="Transit Fee"
                            value={
                              watchForm.transitFee
                            }
                            type="number"
                            prefix="₹"
                            onChange={(value) =>
                              updateForm({
                                transitFee: value,
                              })
                            }
                            placeholder="0"
                          />

                          <div>
                            <label className="mb-2 block text-[9px] font-black uppercase tracking-widest text-gray-400">
                              GST %
                            </label>

                            <select
                              value={
                                watchForm.taxPercentage
                              }
                              onChange={(event) =>
                                updateForm({
                                  taxPercentage:
                                    event.target.value,
                                })
                              }
                              className="min-h-[48px] w-full appearance-none rounded-xl border border-white/10 bg-black px-3 text-xs text-white outline-none focus:border-[#D4AF37]"
                            >
                              <option value="0">
                                0% — Exempt
                              </option>

                              <option value="3">
                                3% — Bullion
                              </option>

                              <option value="12">
                                12%
                              </option>

                              <option value="18">
                                18% — Standard
                              </option>

                              <option value="28">
                                28% — Luxury
                              </option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              updateForm({
                                taxInclusive:
                                  !watchForm.taxInclusive,
                              })
                            }
                            className={`min-h-[48px] self-end rounded-xl border px-4 text-[9px] font-black uppercase tracking-widest transition ${
                              watchForm.taxInclusive
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                : "border-orange-500/20 bg-orange-500/10 text-orange-400"
                            }`}
                          >
                            Tax{" "}
                            {watchForm.taxInclusive
                              ? "Inclusive"
                              : "Exclusive"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* SEO PANELS */}

              <section className="space-y-7 border-t border-white/10 pt-7">
                <SafeSeoPanel
                  entityData={watchForm}
                  setEntityData={setWatchForm}
                />

                <SafeImageSeoPanel
                  entityData={watchForm}
                  setEntityData={setWatchForm}
                />
              </section>

              {/* SAVE */}

              <button
                type="button"
                disabled={isSaving}
                onClick={saveProduct}
                className="group relative flex min-h-[62px] w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#D4AF37] text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_0_35px_rgba(212,175,55,0.2)] transition hover:scale-[1.01] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <RefreshCw
                      size={19}
                      className="animate-spin"
                    />
                    Saving Product...
                  </>
                ) : (
                  <>
                    <Save size={19} />
                    Push To Live Inventory
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* =================================================
            LIVE INVENTORY
        ================================================= */}

        <div className="min-w-0">
          <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#090909]">
            {/* HEADER */}

            <div className="border-b border-white/10 bg-[#090909]/95 p-5 backdrop-blur-xl md:p-6">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShoppingBag
                        size={17}
                        className="text-[#D4AF37]"
                      />

                      <h3 className="text-lg font-serif">
                        Live Inventory
                      </h3>
                    </div>

                    <p className="mt-1 text-[9px] uppercase tracking-widest text-gray-400">
                      {filteredWatches.length} of{" "}
                      {liveWatches.length} assets
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {outOfStockProducts > 0 && (
                      <span className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-[8px] font-black uppercase tracking-widest text-red-400">
                        {outOfStockProducts} Out
                      </span>
                    )}

                    <span className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-2 text-[8px] font-black uppercase tracking-widest text-[#D4AF37]">
                      {liveWatches.length} Total
                    </span>
                  </div>
                </div>

                {/* SEARCH */}

                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search product, brand, category..."
                    className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-black pl-11 pr-12 text-xs text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37]/40"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* FILTER TOGGLE */}

                <button
                  type="button"
                  onClick={() =>
                    setShowFilters(
                      (current) => !current
                    )
                  }
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border text-[8px] font-black uppercase tracking-widest transition ${
                    showFilters
                      ? "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"
                      : "border-white/10 bg-white/[0.02] text-gray-400 hover:text-white"
                  }`}
                >
                  <Filter size={13} />
                  Advanced Filters

                  {showFilters ? (
                    <ChevronUp size={13} />
                  ) : (
                    <ChevronDown size={13} />
                  )}
                </button>

                {/* FILTERS */}

                <AnimatePresence initial={false}>
                  {showFilters && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        height: 0,
                      }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                      }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 gap-3 border-t border-white/5 pt-4 md:grid-cols-3">
                        <FilterSelect
                          value={brandFilter}
                          onChange={setBrandFilter}
                          options={[
                            "ALL",
                            ...brands,
                          ]}
                          label="Brand"
                        />

                        <FilterSelect
                          value={categoryFilter}
                          onChange={setCategoryFilter}
                          options={[
                            "ALL",
                            ...categories,
                          ]}
                          label="Category"
                        />

                        <FilterSelect
                          value={stockFilter}
                          onChange={setStockFilter}
                          options={[
                            "ALL",
                            "IN_STOCK",
                            "LOW",
                            "OUT",
                          ]}
                          label="Stock"
                        />
                      </div>

                      {hasFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-3 text-[8px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#D4AF37]"
                        >
                          Reset all filters
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* PRODUCTS */}

            <div className="p-4 md:p-5">
              {filteredWatches.length === 0 ? (
                <EmptyInventory
                  hasFilters={hasFilters}
                  resetFilters={resetFilters}
                />
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {filteredWatches.map(
                    (watch, index) => (
                      <ProductCard
                        key={
                          watch._id ||
                          `watch-${index}`
                        }
                        watch={watch}
                        index={index}
                        onPreview={() =>
                          setPreviewProduct(watch)
                        }
                        onDelete={() =>
                          setDeleteProduct(watch)
                        }
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ===================================================
          PREVIEW MODAL
      =================================================== */}

      <AnimatePresence>
        {previewProduct && (
          <ProductPreviewModal
            product={previewProduct}
            onClose={() =>
              setPreviewProduct(null)
            }
          />
        )}
      </AnimatePresence>

      {/* ===================================================
          DELETE MODAL
      =================================================== */}

      <AnimatePresence>
        {deleteProduct && (
          <DeleteConfirmModal
            product={deleteProduct}
            loading={isDeleting}
            onCancel={() =>
              isDeleting
                ? undefined
                : setDeleteProduct(null)
            }
            onConfirm={confirmDelete}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* =========================================================
   INVENTORY STAT
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
  tone:
    | "gold"
    | "cyan"
    | "green"
    | "orange"
    | "red";
}) {
  const styles = {
    gold: {
      icon: "bg-[#D4AF37]/10 text-[#D4AF37]",
      value: "text-[#D4AF37]",
    },
    cyan: {
      icon: "bg-cyan-500/10 text-cyan-400",
      value: "text-cyan-400",
    },
    green: {
      icon: "bg-emerald-500/10 text-emerald-400",
      value: "text-emerald-400",
    },
    orange: {
      icon: "bg-orange-500/10 text-orange-400",
      value: "text-orange-400",
    },
    red: {
      icon: "bg-red-500/10 text-red-400",
      value: "text-red-400",
    },
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-[22px] border border-white/10 bg-black/40 p-5 backdrop-blur-md"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[tone].icon}`}
      >
        {icon}
      </div>

      <p className="mt-5 text-[8px] font-black uppercase tracking-[0.18em] text-gray-400">
        {label}
      </p>

      <p
        className={`mt-1 truncate font-mono text-lg font-bold ${styles[tone].value}`}
      >
        {value}
      </p>

      <p className="mt-1 text-[8px] text-gray-500">
        {description}
      </p>
    </motion.div>
  );
}

/* =========================================================
   FORM SECTION
========================================================= */

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
    <section className="rounded-[24px] border border-white/10 bg-white/[0.015] p-4 md:p-5">
      <div className="mb-5 flex items-start gap-3 border-b border-white/5 pb-4">
        <div className="rounded-xl bg-[#D4AF37]/10 p-2.5 text-[#D4AF37]">
          {icon}
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-white">
            {title}
          </h4>

          <p className="mt-1 text-[8px] leading-4 text-gray-400">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

/* =========================================================
   FORM INPUT
========================================================= */

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
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <label
        className={`mb-2 block text-[8px] font-black uppercase tracking-widest ${
          accent
            ? "text-cyan-400"
            : "text-gray-400"
        }`}
      >
        {label}
      </label>

      <div className="relative">
        {prefix && (
          <span
            className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold ${
              accent
                ? "text-cyan-400"
                : "text-gray-400"
            }`}
          >
            {prefix}
          </span>
        )}

        <input
          type={type}
          value={value ?? ""}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className={`min-h-[48px] w-full rounded-xl border bg-black px-3 text-xs text-white outline-none transition placeholder:text-gray-600 ${
            prefix ? "pl-8" : ""
          } ${
            accent
              ? "border-cyan-500/25 focus:border-cyan-400"
              : "border-white/10 focus:border-[#D4AF37]"
          }`}
        />
      </div>
    </div>
  );
}

/* =========================================================
   FILTER SELECT
========================================================= */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-[8px] font-black uppercase tracking-widest text-gray-400">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="min-h-[44px] w-full rounded-xl border border-white/10 bg-black px-3 text-[10px] text-white outline-none focus:border-[#D4AF37]"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option === "ALL"
              ? "All"
              : option === "IN_STOCK"
              ? "In Stock"
              : option === "LOW"
              ? "Low Stock"
              : option === "OUT"
              ? "Out of Stock"
              : option}
          </option>
        ))}
      </select>
    </div>
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  watch,
  index,
  onPreview,
  onDelete,
}: {
  watch: LiveWatch;
  index: number;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const status = getStockStatus(
    Number(watch.stock || 0)
  );

  const StatusIcon = status.icon;

  const image =
    watch.imageUrl ||
    watch.images?.find(Boolean);

  const currentPrice = Number(
    watch.offerPrice || watch.price || 0
  );

  const oldPrice = Number(watch.price || 0);

  const discount =
    oldPrice > currentPrice &&
    currentPrice > 0
      ? Math.round(
          ((oldPrice - currentPrice) /
            oldPrice) *
            100
        )
      : 0;

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: Math.min(index * 0.04, 0.3),
      }}
      whileHover={{
        y: -4,
      }}
      className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-[#111] transition-all duration-300 hover:border-[#D4AF37]/30 hover:shadow-[0_15px_60px_rgba(0,0,0,0.35)]"
    >
      {/* BADGES */}

      <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
        {watch.badge && (
          <span className="rounded-full bg-[#D4AF37] px-3 py-1.5 text-[7px] font-black uppercase tracking-widest text-black shadow-lg">
            {watch.badge}
          </span>
        )}

        <span
          className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[7px] font-black uppercase tracking-widest ${status.bg} ${status.border} ${status.color}`}
        >
          <StatusIcon size={10} />
          {status.label}
        </span>
      </div>

      {/* IMAGE */}

      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[#181818] to-black">
        {image ? (
          <img
            src={image}
            alt={watch.name || "Product"}
            className="h-full w-full object-contain p-8 transition duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-gray-500">
            <ImageIcon size={36} />

            <span className="mt-2 text-[8px] font-bold uppercase tracking-widest">
              No Media
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70" />

        {discount > 0 && (
          <span className="absolute bottom-4 right-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[8px] font-black text-emerald-400">
            -{discount}%
          </span>
        )}
      </div>

      {/* CONTENT */}

      <div className="p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[8px] font-black uppercase tracking-widest text-[#D4AF37]">
            {watch.brand ||
              "Unknown Brand"}
          </span>

          <span className="text-gray-500">
            •
          </span>

          <span className="truncate text-[8px] font-bold uppercase tracking-widest text-gray-400">
            {watch.category ||
              "Uncategorized"}
          </span>
        </div>

        <h4 className="min-h-[44px] text-base font-bold leading-tight text-white">
          {watch.name ||
            "Untitled Product"}
        </h4>

        <div className="mt-5 grid grid-cols-2 gap-3 border-y border-white/10 py-4">
          <div>
            <p className="text-[7px] font-black uppercase tracking-widest text-gray-400">
              Price
            </p>

            <p className="mt-1 font-mono text-lg text-emerald-400">
              {currency(currentPrice)}
            </p>

            {oldPrice >
              currentPrice && (
              <p className="mt-0.5 font-mono text-[9px] text-gray-500 line-through">
                {currency(oldPrice)}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-[7px] font-black uppercase tracking-widest text-gray-400">
              Stock
            </p>

            <p
              className={`mt-1 font-mono text-lg ${status.color}`}
            >
              {formattedNumber(
                Number(watch.stock || 0)
              )}
            </p>

            <p className="text-[8px] text-gray-500">
              units
            </p>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] text-[8px] font-black uppercase tracking-widest text-gray-300 transition hover:bg-white hover:text-black"
          >
            <Eye size={13} />
            View
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="flex min-h-[44px] min-w-[46px] items-center justify-center rounded-xl border border-red-500/10 bg-red-500/5 text-red-400 transition hover:bg-red-500 hover:text-white"
            title="Delete product"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   PRODUCT PREVIEW
========================================================= */

function ProductPreviewModal({
  product,
  onClose,
}: {
  product: LiveWatch;
  onClose: () => void;
}) {
  const image =
    product.imageUrl ||
    product.images?.find(Boolean);

  const price = Number(
    product.offerPrice ||
      product.price ||
      0
  );

  const status = getStockStatus(
    Number(product.stock || 0)
  );

  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl"
      onMouseDown={onClose}
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.96,
          y: 15,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.96,
          y: 15,
        }}
        onMouseDown={(event) =>
          event.stopPropagation()
        }
        className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[30px] border border-white/10 bg-[#0b0b0b] shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/70 text-gray-400 backdrop-blur-md transition hover:bg-white hover:text-black"
        >
          <X size={17} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="flex min-h-[380px] items-center justify-center bg-gradient-to-br from-[#171717] to-black p-8">
            {image ? (
              <img
                src={image}
                alt={
                  product.name ||
                  "Product"
                }
                className="max-h-[430px] w-full object-contain"
              />
            ) : (
              <ImageIcon
                size={60}
                className="text-gray-600"
              />
            )}
          </div>

          <div className="p-7 md:p-9">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-[#D4AF37]">
                {product.brand ||
                  "Brand"}
              </span>

              <span
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-widest ${status.bg} ${status.border} ${status.color}`}
              >
                <StatusIcon size={10} />
                {status.label}
              </span>
            </div>

            <p className="mt-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
              {product.category ||
                "Luxury Collection"}
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              {product.name ||
                "Untitled Product"}
            </h2>

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                Current Valuation
              </p>

              <p className="mt-2 font-mono text-3xl text-[#D4AF37]">
                {currency(price)}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[8px] uppercase tracking-widest text-gray-500">
                  Stock
                </p>

                <p
                  className={`mt-2 font-mono text-xl ${status.color}`}
                >
                  {formattedNumber(
                    Number(
                      product.stock || 0
                    )
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[8px] uppercase tracking-widest text-gray-500">
                  Badge
                </p>

                <p className="mt-2 truncate text-sm font-bold text-white">
                  {product.badge ||
                    "None"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   DELETE CONFIRMATION
========================================================= */

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl"
      onMouseDown={onCancel}
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.96,
          y: 12,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.96,
          y: 12,
        }}
        onMouseDown={(event) =>
          event.stopPropagation()
        }
        className="w-full max-w-md rounded-[28px] border border-red-500/20 bg-[#0b0b0b] p-6 shadow-2xl"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
          <AlertTriangle size={22} />
        </div>

        <h3 className="mt-5 text-lg font-bold text-white">
          Delete Product?
        </h3>

        <p className="mt-2 text-xs leading-6 text-gray-400">
          You are about to remove{" "}
          <span className="font-bold text-white">
            {product.name ||
              "this product"}
          </span>{" "}
          from the live inventory.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="min-h-[46px] flex-1 rounded-xl border border-white/10 bg-white/[0.03] text-[9px] font-black uppercase tracking-widest text-gray-300 transition hover:bg-white hover:text-black disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-[9px] font-black uppercase tracking-widest text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw
                  size={14}
                  className="animate-spin"
                />
                Deleting
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Delete
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyInventory({
  hasFilters,
  resetFilters,
}: {
  hasFilters: boolean;
  resetFilters: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] text-gray-500">
        {hasFilters ? (
          <Search size={28} />
        ) : (
          <Package size={28} />
        )}
      </div>

      <h4 className="mt-5 text-sm font-bold uppercase tracking-widest text-gray-400">
        {hasFilters
          ? "No matching products"
          : "Vault is empty"}
      </h4>

      <p className="mx-auto mt-2 max-w-sm text-[9px] leading-5 text-gray-500">
        {hasFilters
          ? "Try changing your search or inventory filters."
          : "Your live product inventory will appear here once products are published."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="mt-5 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-5 py-3 text-[8px] font-black uppercase tracking-widest text-[#D4AF37]"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}