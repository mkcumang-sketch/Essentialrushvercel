"use client";

import React, { useMemo, useState } from "react";
import {
  Award,
  Plus,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  UserCheck,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  Sparkles,
  Crown,
  ExternalLink,
  Loader2,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Ambassador {
  _id?: string;
  name: string;
  title?: string;
  imageUrl: string;
  createdAt?: string;
}

interface NewCeleb {
  name: string;
  title: string;
  imageUrl: string;
}

interface BrandAmbassadorsTabProps {
  celebs: Ambassador[];
  newCeleb: NewCeleb;
  setNewCeleb: (val: NewCeleb) => void;
  handleAddCeleb?: () => void;
  handleDeleteCeleb?: (id: string) => void;
  PremiumUploadNode: any;
}

type ToastType = "success" | "error";

export default function BrandAmbassadorsTab({
  celebs,
  newCeleb,
  setNewCeleb,
  handleAddCeleb,
  handleDeleteCeleb,
  PremiumUploadNode,
}: BrandAmbassadorsTabProps) {
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [toast, setToast] = useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const filteredCelebs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return celebs;

    return celebs.filter(
      (celeb) =>
        celeb.name?.toLowerCase().includes(query) ||
        celeb.title?.toLowerCase().includes(query)
    );
  }, [celebs, searchTerm]);

  const hasImage = Boolean(newCeleb.imageUrl?.trim());

  const isValidImageUrl = (url: string) => {
    if (!url) return false;

    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const resetForm = () => {
    setNewCeleb({
      name: "",
      title: "",
      imageUrl: "",
    });

    setPreviewMode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = newCeleb.name.trim();
    const title = newCeleb.title.trim();
    const imageUrl = newCeleb.imageUrl.trim();

    if (!name) {
      showToast("error", "Ambassador name is required.");
      return;
    }

    if (!imageUrl) {
      showToast("error", "Please upload or provide a profile image.");
      return;
    }

    if (!isValidImageUrl(imageUrl)) {
      showToast("error", "Please provide a valid image URL.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/celebrity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          title,
          imageUrl,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message || "Failed to save brand ambassador."
        );
      }

      showToast(
        "success",
        `${name} has been added to the ambassador roster.`
      );

      resetForm();

      handleAddCeleb?.();
    } catch (error) {
      console.error("Add ambassador error:", error);

      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Failed to add ambassador."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const removeCeleb = async (id?: string) => {
    if (!id) {
      showToast("error", "Unable to identify this ambassador.");
      return;
    }

    const ambassador = celebs.find((celeb) => celeb._id === id);

    // Direct deletion for admin efficiency
    setDeletingId(id);

    try {
      const res = await fetch(`/api/celebrity?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message || "Failed to delete ambassador."
        );
      }

      showToast(
        "success",
        `${ambassador?.name || "Ambassador"} has been removed.`
      );

      handleDeleteCeleb?.(id);
    } catch (error) {
      console.error("Delete ambassador error:", error);

      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Failed to delete ambassador."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative space-y-8 pb-24"
    >
      {/* ========================================================= */}
      {/* TOAST */}
      {/* ========================================================= */}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className="fixed right-6 top-6 z-[100] w-[360px]"
          >
            <div
              className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
                toast.type === "success"
                  ? "border-emerald-500/20 bg-emerald-950/90"
                  : "border-red-500/20 bg-red-950/90"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-emerald-400"
                />
              ) : (
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-400"
                />
              )}

              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  {toast.type === "success" ? "Success" : "Action Failed"}
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-400">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-gray-500 transition hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* HERO HEADER */}
      {/* ========================================================= */}

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#D4AF37]/10 via-black/40 to-black/70 p-7 shadow-2xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 shadow-lg shadow-[#D4AF37]/5">
              <Crown
                size={30}
                className="text-[#D4AF37]"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                  VIP Management
                </span>

                <Sparkles
                  size={13}
                  className="text-[#D4AF37]"
                />
              </div>

              <h2 className="font-serif text-2xl font-medium tracking-tight text-white md:text-3xl">
                Brand Ambassadors
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                Manage celebrities, influencers, collectors and premium
                personalities representing your luxury timepiece brand.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard
              icon={<Users size={16} />}
              label="Total"
              value={celebs.length}
            />

            <StatCard
              icon={<Award size={16} />}
              label="Active"
              value={celebs.length}
            />

            <StatCard
              icon={<Sparkles size={16} />}
              label="Premium"
              value={celebs.length}
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MAIN CONTENT */}
      {/* ========================================================= */}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        {/* ======================================================= */}
        {/* FORM */}
        {/* ======================================================= */}

        <section className="xl:col-span-4">
          <div className="sticky top-6 overflow-hidden rounded-3xl border border-white/10 bg-black/50 shadow-2xl backdrop-blur-xl">
            <div className="border-b border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                    Roster Management
                  </p>

                  <h3 className="mt-2 flex items-center gap-2 text-lg font-bold text-white">
                    <UserCheck
                      size={18}
                      className="text-[#D4AF37]"
                    />
                    Add Ambassador
                  </h3>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10">
                  <Plus
                    size={18}
                    className="text-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-6"
            >
              {/* NAME */}
              <Field label="Ambassador Name" required>
                <input
                  type="text"
                  maxLength={80}
                  placeholder="e.g. Alexander V."
                  value={newCeleb.name}
                  onChange={(e) =>
                    setNewCeleb({
                      ...newCeleb,
                      name: e.target.value,
                    })
                  }
                  className="luxury-input"
                />

                <CharacterCount
                  current={newCeleb.name.length}
                  max={80}
                />
              </Field>

              {/* TITLE */}
              <Field label="Title / Role">
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Formula 1 Driver / Collector"
                  value={newCeleb.title}
                  onChange={(e) =>
                    setNewCeleb({
                      ...newCeleb,
                      title: e.target.value,
                    })
                  }
                  className="luxury-input"
                />

                <CharacterCount
                  current={newCeleb.title.length}
                  max={100}
                />
              </Field>

              {/* IMAGE */}
              <Field label="Profile Media" required>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black">
                        {hasImage ? (
                          <img
                            src={newCeleb.imageUrl}
                            alt="Preview"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <ImageIcon
                            size={20}
                            className="text-gray-600"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white">
                          Upload profile media
                        </p>

                        <p className="mt-1 text-[10px] leading-4 text-gray-500">
                          High-quality portrait recommended
                        </p>
                      </div>

                      <PremiumUploadNode
                        placeholder="Upload"
                        onUploadSuccess={(url: string) =>
                          setNewCeleb({
                            ...newCeleb,
                            imageUrl: url,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center">
                      <LinkIcon
                        size={14}
                        className="text-[#D4AF37]"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Or paste image URL..."
                      value={newCeleb.imageUrl}
                      onChange={(e) =>
                        setNewCeleb({
                          ...newCeleb,
                          imageUrl: e.target.value,
                        })
                      }
                      className="luxury-input pl-9"
                    />
                  </div>

                  {hasImage && (
                    <button
                      type="button"
                      onClick={() => setPreviewMode(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
                    >
                      <Eye size={14} />
                      Preview Profile
                    </button>
                  )}
                </div>
              </Field>

              {/* ACTIONS */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                >
                  Clear
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] rounded-xl bg-[#D4AF37] py-4 text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-lg shadow-[#D4AF37]/10 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex items-center justify-center gap-2">
                    {submitting ? (
                      <>
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus size={15} />
                        Save Ambassador
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ======================================================= */}
        {/* ROSTER */}
        {/* ======================================================= */}

        <section className="xl:col-span-8">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/50 shadow-2xl backdrop-blur-xl">
            {/* ROSTER HEADER */}
            <div className="border-b border-white/10 p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Award
                      size={19}
                      className="text-[#D4AF37]"
                    />

                    <h3 className="text-lg font-bold text-white">
                      Active Roster
                    </h3>

                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[9px] font-bold text-gray-400">
                      {filteredCelebs.length}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Your currently published brand representatives.
                  </p>
                </div>

                {/* SEARCH */}
                <div className="relative w-full lg:w-72">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />

                  <input
                    type="text"
                    placeholder="Search roster..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-9 pr-9 text-xs text-white outline-none transition placeholder:text-gray-600 focus:border-[#D4AF37]/40"
                  />

                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* GRID */}
            <div className="p-6">
              {filteredCelebs.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <AnimatePresence mode="popLayout">
                    {filteredCelebs.map((celeb, index) => {
                      const id = celeb._id || `ambassador-${index}`;
                      const isDeleting = deletingId === celeb._id;

                      return (
                        <motion.article
                          layout
                          key={id}
                          initial={{
                            opacity: 0,
                            scale: 0.97,
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.95,
                          }}
                          transition={{
                            duration: 0.25,
                          }}
                          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/25 hover:bg-white/[0.045]"
                        >
                          <div className="flex gap-4 p-4">
                            {/* IMAGE */}
                            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black">
                              <img
                                src={celeb.imageUrl}
                                alt={celeb.name}
                                loading="lazy"
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23111111'/%3E%3Ctext x='50%25' y='50%25' fill='%23666666' font-size='14' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                                }}
                              />

                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                                  VIP
                                </span>
                              </div>
                            </div>

                            {/* DETAILS */}
                            <div className="min-w-0 flex-1 pr-8">
                              <div className="mb-2 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />

                                <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                                  Active
                                </span>
                              </div>

                              <h4 className="truncate text-base font-bold text-white">
                                {celeb.name}
                              </h4>

                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#D4AF37]">
                                {celeb.title || "VIP Brand Ambassador"}
                              </p>

                              <div className="mt-3 flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-600">
                                <Award size={11} />
                                Official Partner
                              </div>
                            </div>

                            {/* DELETE */}
                            {celeb._id && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeCeleb(celeb._id)
                                }
                                disabled={isDeleting}
                                title="Remove ambassador"
                                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/70 text-gray-500 opacity-0 backdrop-blur transition-all group-hover:opacity-100 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isDeleting ? (
                                  <Loader2
                                    size={13}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={13} />
                                )}
                              </button>
                            )}
                          </div>

                          {/* BOTTOM ACCENT */}
                          <div className="h-px w-0 bg-[#D4AF37] transition-all duration-500 group-hover:w-full" />
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : searchTerm ? (
                <EmptyState
                  icon={<Search size={25} />}
                  title="No ambassadors found"
                  description={`No roster members match "${searchTerm}".`}
                  action={
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="rounded-xl border border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
                    >
                      Clear Search
                    </button>
                  }
                />
              ) : (
                <EmptyState
                  icon={<Crown size={25} />}
                  title="Your roster is empty"
                  description="Add your first celebrity, influencer or premium brand representative."
                />
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ========================================================= */}
      {/* PREVIEW MODAL */}
      {/* ========================================================= */}

      <AnimatePresence>
        {previewMode && hasImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewMode(false)}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-6 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white backdrop-blur"
              >
                <X size={16} />
              </button>

              <img
                src={newCeleb.imageUrl}
                alt={newCeleb.name || "Ambassador preview"}
                className="max-h-[75vh] w-full object-contain"
              />

              <div className="border-t border-white/10 p-5">
                <p className="text-lg font-bold text-white">
                  {newCeleb.name || "Ambassador Name"}
                </p>

                <p className="mt-1 text-xs text-[#D4AF37]">
                  {newCeleb.title || "VIP Brand Ambassador"}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* FOOTER INFO */}
      {/* ========================================================= */}

      <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.015] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4AF37]/10">
            <ShieldIcon />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-300">
              Premium Roster Management
            </p>

            <p className="mt-0.5 text-[10px] text-gray-600">
              Ambassador profiles are managed through your existing
              celebrity API.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-600">
          <CheckCircle2
            size={12}
            className="text-emerald-500"
          />
          System Operational
        </div>
      </div>
    </motion.div>
  );
}

/* =============================================================== */
/* REUSABLE COMPONENTS */
/* =============================================================== */

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
        {label}

        {required && (
          <span className="ml-1 text-[#D4AF37]">*</span>
        )}
      </label>

      {children}
    </div>
  );
}

function CharacterCount({
  current,
  max,
}: {
  current: number;
  max: number;
}) {
  return (
    <div className="mt-1 text-right text-[8px] text-gray-700">
      {current}/{max}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div
      className={`min-w-[100px] rounded-xl border border-white/10 bg-black/30 px-4 py-3 ${className}`}
    >
      <div className="flex items-center gap-2 text-[#D4AF37]">
        {icon}

        <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500">
          {label}
        </span>
      </div>

      <p className="mt-1 text-xl font-serif text-white">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[330px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 text-[#D4AF37]">
        {icon}
      </div>

      <h4 className="mt-5 text-sm font-bold text-gray-300">
        {title}
      </h4>

      <p className="mt-2 max-w-sm text-xs leading-5 text-gray-600">
        {description}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-[#D4AF37]"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
