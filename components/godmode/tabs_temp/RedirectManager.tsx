"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowRightLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Copy,
  ExternalLink,
  Filter,
  Link2,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";

export interface RedirectRule {
  _id: string;
  oldUrl: string;
  newUrl: string;
  isPermanent: boolean;
  createdAt?: string;
  updatedAt?: string;
}

type RedirectType = "301" | "302";
type FilterType = "ALL" | "301" | "302";

interface FormState {
  oldUrl: string;
  newUrl: string;
  isPermanent: boolean;
}

interface ToastState {
  type: "success" | "error" | "info";
  message: string;
}

const EMPTY_FORM: FormState = {
  oldUrl: "",
  newUrl: "",
  isPermanent: true,
};

export default function RedirectManager() {
  const [redirects, setRedirects] = useState<RedirectRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("ALL");

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = useCallback(
    (type: ToastState["type"], message: string) => {
      setToast({ type, message });

      window.setTimeout(() => {
        setToast(null);
      }, 3500);
    },
    []
  );

  const fetchRedirects = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/seo/redirects", {
        method: "GET",
        cache: "no-store",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to load redirects");
      }

      setRedirects(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      console.error("Failed to load redirects:", error);

      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to load redirect rules."
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRedirects();
  }, [fetchRedirects]);

  const normalizePath = (value: string) => {
    let path = value.trim();

    if (!path) return "";

    try {
      if (/^https?:\/\//i.test(path)) {
        const url = new URL(path);
        path = url.pathname + url.search + url.hash;
      }
    } catch {
      // Keep original value for validation.
    }

    if (!path.startsWith("/")) {
      path = `/${path}`;
    }

    return path.replace(/\s+/g, "-");
  };

  const validateUrl = (value: string) => {
    if (!value.trim()) {
      return "URL is required.";
    }

    if (!value.startsWith("/")) {
      return "URL must start with /";
    }

    if (/\s/.test(value)) {
      return "URL cannot contain spaces.";
    }

    return "";
  };

  const oldUrlError = validateUrl(form.oldUrl);
  const newUrlError = validateUrl(form.newUrl);

  const sameDestination =
    form.oldUrl.trim() !== "" &&
    form.newUrl.trim() !== "" &&
    form.oldUrl.trim() === form.newUrl.trim();

  const duplicateExists = useMemo(() => {
    const old = form.oldUrl.trim().toLowerCase();

    if (!old) return false;

    return redirects.some(
      (redirect) => redirect.oldUrl.trim().toLowerCase() === old
    );
  }, [form.oldUrl, redirects]);

  const canSubmit =
    !isSaving &&
    !oldUrlError &&
    !newUrlError &&
    !sameDestination &&
    !duplicateExists;

  const filteredRedirects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return redirects.filter((redirect) => {
      const matchesSearch =
        !query ||
        redirect.oldUrl.toLowerCase().includes(query) ||
        redirect.newUrl.toLowerCase().includes(query);

      const matchesFilter =
        filterType === "ALL" ||
        (filterType === "301" && redirect.isPermanent) ||
        (filterType === "302" && !redirect.isPermanent);

      return matchesSearch && matchesFilter;
    });
  }, [redirects, searchTerm, filterType]);

  const stats = useMemo(() => {
    const permanent = redirects.filter((r) => r.isPermanent).length;
    const temporary = redirects.filter((r) => !r.isPermanent).length;

    return {
      total: redirects.length,
      permanent,
      temporary,
    };
  }, [redirects]);

  const handleFormChange = (
    field: keyof FormState,
    value: string | boolean
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleAdd = async () => {
    const oldUrl = normalizePath(form.oldUrl);
    const newUrl = normalizePath(form.newUrl);

    if (!oldUrl || !newUrl) {
      showToast("error", "Both source and destination URLs are required.");
      return;
    }

    if (oldUrl === newUrl) {
      showToast("error", "Source and destination cannot be identical.");
      return;
    }

    const alreadyExists = redirects.some(
      (redirect) =>
        redirect.oldUrl.trim().toLowerCase() === oldUrl.toLowerCase()
    );

    if (alreadyExists) {
      showToast(
        "error",
        "A redirect with this source URL already exists."
      );
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        oldUrl,
        newUrl,
        isPermanent: form.isPermanent,
      };

      const res = await fetch("/api/seo/redirects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        throw new Error(
          json?.message ||
            "Failed to create redirect. The source URL may already exist."
        );
      }

      const createdRedirect = json.data as RedirectRule | undefined;

      if (createdRedirect) {
        setRedirects((previous) => [
          createdRedirect,
          ...previous.filter(
            (redirect) => redirect._id !== createdRedirect._id
          ),
        ]);
      } else {
        await fetchRedirects();
      }

      setForm(EMPTY_FORM);

      showToast(
        "success",
        `${payload.isPermanent ? "301" : "302"} redirect created successfully.`
      );
    } catch (error) {
      console.error("Failed to add redirect:", error);

      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Failed to create redirect."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const redirect = redirects.find((item) => item._id === id);

    if (!redirect) return;

    // Direct deletion for admin efficiency
    setDeletingId(id);

    try {
      const res = await fetch("/api/seo/redirects", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || (json && json.success === false)) {
        throw new Error(json?.message || "Failed to delete redirect.");
      }

      setRedirects((previous) =>
        previous.filter((redirect) => redirect._id !== id)
      );

      showToast("success", "Redirect rule removed successfully.");
    } catch (error) {
      console.error("Delete failed:", error);

      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to delete redirect."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = async (redirect: RedirectRule) => {
    try {
      await navigator.clipboard.writeText(
        `${redirect.oldUrl} → ${redirect.newUrl}`
      );

      setCopiedId(redirect._id);

      window.setTimeout(() => {
        setCopiedId(null);
      }, 1800);
    } catch {
      showToast("error", "Could not copy redirect.");
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
  };

  return (
    <div className="relative mt-8 overflow-hidden rounded-[32px] border border-white/10 bg-[#080808] text-white shadow-2xl">
      {/* BACKGROUND DECOR */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#00F0FF]/5 blur-3xl" />
        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-[#D4AF37]/5 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* TOAST */}
      {toast && (
        <div className="fixed right-5 top-5 z-[100] w-[min(420px,calc(100vw-40px))]">
          <div
            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
              toast.type === "success"
                ? "border-emerald-400/20 bg-emerald-500/10"
                : toast.type === "error"
                ? "border-red-400/20 bg-red-500/10"
                : "border-cyan-400/20 bg-cyan-500/10"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === "success" ? (
                <CheckCircle2 size={18} className="text-emerald-400" />
              ) : toast.type === "error" ? (
                <CircleAlert size={18} className="text-red-400" />
              ) : (
                <Shield size={18} className="text-cyan-400" />
              )}
            </div>
            <p className="flex-1 text-xs font-semibold leading-5 text-gray-200">
              {toast.message}
            </p>
            <button
              onClick={() => setToast(null)}
              className="rounded-lg p-1 text-gray-500 transition hover:bg-white/10 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 p-5 sm:p-7 lg:p-9">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-6 border-b border-white/10 pb-7 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
              <ArrowRightLeft size={25} className="text-[#00F0FF]" />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" />
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  Redirect Engine
                </h2>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-emerald-400">
                  SEO Active
                </span>
              </div>
              <p className="max-w-2xl text-xs leading-5 text-gray-500 sm:text-sm">
                Manage URL migrations, preserve link equity, and prevent broken routes.
              </p>
            </div>
          </div>

          <button
            onClick={fetchRedirects}
            disabled={loading}
            className="group flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/5 hover:text-cyan-300 disabled:opacity-50"
          >
            <RefreshCcw
              size={14}
              className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform"}
            />
            Refresh Engine
          </button>
        </div>

        {/* STATS */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={<Link2 size={18} />} label="Total Rules" value={stats.total} description="Active redirect mappings" accent="cyan" />
          <StatCard icon={<Shield size={18} />} label="Permanent" value={stats.permanent} description="301 SEO redirects" accent="gold" />
          <StatCard icon={<Clock3 size={18} />} label="Temporary" value={stats.temporary} description="302 temporary redirects" accent="blue" />
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* CREATE RULE */}
          <section className="xl:col-span-4">
            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0d0d0d]">
              <div className="border-b border-white/10 bg-white/[0.02] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Sparkles size={15} className="text-[#D4AF37]" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                        Rule Builder
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">Create Redirect</h3>
                  </div>
                  <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-3">
                    <Zap size={17} className="text-cyan-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                {/* OLD URL */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">Source URL</label>
                    <span className="text-[8px] uppercase tracking-wider text-red-400">Old route</span>
                  </div>
                  <div className={`group flex items-center rounded-xl border bg-black transition ${oldUrlError || duplicateExists ? "border-red-500/40" : "border-white/10 focus-within:border-red-400/40"}`}>
                    <div className="border-r border-white/10 px-3">
                      <ArrowRight size={14} className="rotate-180 text-red-400" />
                    </div>
                    <input
                      value={form.oldUrl}
                      onChange={(e) => handleFormChange("oldUrl", e.target.value)}
                      onBlur={() => setForm((previous) => ({ ...previous, oldUrl: normalizePath(previous.oldUrl) }))}
                      className="min-h-[48px] w-full bg-transparent px-3 text-sm text-red-300 outline-none placeholder:text-gray-700"
                      placeholder="/products/old-watch"
                    />
                  </div>
                  {oldUrlError && (
                    <p className="mt-2 flex items-center gap-1 text-[9px] font-semibold text-red-400">
                      <CircleAlert size={11} /> {oldUrlError}
                    </p>
                  )}
                  {duplicateExists && !oldUrlError && (
                    <p className="mt-2 flex items-center gap-1 text-[9px] font-semibold text-red-400">
                      <CircleAlert size={11} /> This source URL already has a redirect.
                    </p>
                  )}
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-red-500/10 via-white/10 to-emerald-500/10" />
                  <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#0d0d0d]">
                    <ArrowDown size={13} className="text-gray-500" />
                  </div>
                </div>

                {/* NEW URL */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">Destination URL</label>
                    <span className="text-[8px] uppercase tracking-wider text-emerald-400">New route</span>
                  </div>
                  <div className={`group flex items-center rounded-xl border bg-black transition ${newUrlError || sameDestination ? "border-red-500/40" : "border-white/10 focus-within:border-emerald-400/40"}`}>
                    <div className="border-r border-white/10 px-3">
                      <ArrowRight size={14} className="text-emerald-400" />
                    </div>
                    <input
                      value={form.newUrl}
                      onChange={(e) => handleFormChange("newUrl", e.target.value)}
                      onBlur={() => setForm((previous) => ({ ...previous, newUrl: normalizePath(previous.newUrl) }))}
                      className="min-h-[48px] w-full bg-transparent px-3 text-sm text-emerald-300 outline-none placeholder:text-gray-700"
                      placeholder="/products/new-watch"
                    />
                  </div>
                  {newUrlError && (
                    <p className="mt-2 flex items-center gap-1 text-[9px] font-semibold text-red-400">
                      <CircleAlert size={11} /> {newUrlError}
                    </p>
                  )}
                  {sameDestination && (
                    <p className="mt-2 flex items-center gap-1 text-[9px] font-semibold text-red-400">
                      <CircleAlert size={11} /> Destination must be different from source.
                    </p>
                  )}
                </div>

                {/* TYPE */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">Redirect Behaviour</label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleFormChange("isPermanent", true)}
                      className={`rounded-xl border p-3 text-left transition ${form.isPermanent ? "border-[#D4AF37]/40 bg-[#D4AF37]/10" : "border-white/10 bg-black hover:border-white/20"}`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className={`text-xs font-black ${form.isPermanent ? "text-[#D4AF37]" : "text-gray-300"}`}>301</span>
                        {form.isPermanent && <Check size={13} className="text-[#D4AF37]" />}
                      </div>
                      <p className="text-[8px] leading-4 text-gray-500">Permanent migration</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFormChange("isPermanent", false)}
                      className={`rounded-xl border p-3 text-left transition ${!form.isPermanent ? "border-blue-400/40 bg-blue-400/10" : "border-white/10 bg-black hover:border-white/20"}`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className={`text-xs font-black ${!form.isPermanent ? "text-blue-400" : "text-gray-300"}`}>302</span>
                        {!form.isPermanent && <Check size={13} className="text-blue-400" />}
                      </div>
                      <p className="text-[8px] leading-4 text-gray-500">Temporary redirect</p>
                    </button>
                  </div>
                </div>

                {/* ADVANCED */}
                <div className="rounded-xl border border-white/5 bg-black/40">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex min-h-[44px] w-full items-center justify-between px-4 text-left"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-500">SEO Recommendation</span>
                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                  </button>
                  {showAdvanced && (
                    <div className="border-t border-white/5 px-4 pb-4 pt-3">
                      <p className="text-[10px] leading-5 text-gray-500">
                        Use <strong className="text-[#D4AF37]">301</strong> when a page has permanently moved.
                      </p>
                      <p className="mt-2 text-[10px] leading-5 text-gray-600">
                        Use <strong className="text-blue-400">302</strong> only when the change is temporary.
                      </p>
                    </div>
                  )}
                </div>

                {/* BUTTONS */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={resetForm}
                    disabled={isSaving}
                    className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] text-[9px] font-bold uppercase tracking-[0.15em] text-gray-500 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                  >
                    <X size={13} /> Clear
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!canSubmit}
                    className="flex min-h-[48px] flex-[2] items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-[9px] font-black uppercase tracking-[0.15em] text-cyan-300 transition hover:bg-cyan-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSaving ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : <><Plus size={14} /> Create Rule</>}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* REDIRECT DIRECTORY */}
          <section className="min-w-0 xl:col-span-8">
            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0d0d0d]">
              <div className="border-b border-white/10 bg-white/[0.02] p-5 sm:p-6">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <ShieldAlert size={15} className="text-[#D4AF37]" />
                      <span className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">Redirect Directory</span>
                    </div>
                    <h3 className="text-lg font-semibold">
                      Active Rules <span className="ml-2 text-sm font-normal text-gray-600">{filteredRedirects.length}</span>
                    </h3>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest text-gray-500">
                    {stats.total} Total
                  </span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search source or destination..."
                      className="min-h-[44px] w-full rounded-xl border border-white/10 bg-black pl-10 pr-4 text-xs text-white outline-none transition placeholder:text-gray-700 focus:border-cyan-400/30"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white">
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto">
                    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black p-1">
                      <Filter size={13} className="ml-2 shrink-0 text-gray-600" />
                      {(["ALL", "301", "302"] as FilterType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={`rounded-lg px-3 py-2 text-[8px] font-black uppercase tracking-widest transition ${filterType === type ? (type === "301" ? "bg-[#D4AF37]/15 text-[#D4AF37]" : type === "302" ? "bg-blue-400/10 text-blue-400" : "bg-white/10 text-white") : "text-gray-600 hover:text-gray-300"}`}
                        >
                          {type === "ALL" ? "All" : type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-h-[360px] p-4 sm:p-5">
                {loading ? (
                  <div className="flex min-h-[330px] flex-col items-center justify-center">
                    <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                      <Loader2 size={25} className="animate-spin text-cyan-400" />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Synchronizing redirect engine</p>
                  </div>
                ) : filteredRedirects.length === 0 ? (
                  <EmptyState hasFilters={Boolean(searchTerm.trim()) || filterType !== "ALL"} onClear={() => { setSearchTerm(""); setFilterType("ALL"); }} />
                ) : (
                  <div className="space-y-2">
                    {filteredRedirects.map((redirect) => (
                      <RedirectRow key={redirect._id} redirect={redirect} deleting={deletingId === redirect._id} copied={copiedId === redirect._id} onDelete={handleDelete} onCopy={handleCopy} />
                    ))}
                  </div>
                )}
              </div>

              {!loading && redirects.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-white/10 bg-black/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-gray-600">Showing {filteredRedirects.length} of {redirects.length} redirect rules</p>
                  <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Engine Operational
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <InfoCard icon={<Shield size={15} />} title="SEO Preservation" text="301 redirects help permanently map old routes to new destinations." />
          <InfoCard icon={<Zap size={15} />} title="Clean Migrations" text="Move products, pages and slugs without leaving broken routes behind." />
          <InfoCard icon={<ExternalLink size={15} />} title="Route Control" text="Keep URL architecture centralized inside your admin system." />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, description, accent }: { icon: React.ReactNode; label: string; value: number; description: string; accent: "cyan" | "gold" | "blue" }) {
  const accentClasses = {
    cyan: "border-cyan-400/10 bg-cyan-400/[0.03] text-cyan-400",
    gold: "border-[#D4AF37]/10 bg-[#D4AF37]/[0.03] text-[#D4AF37]",
    blue: "border-blue-400/10 bg-blue-400/[0.03] text-blue-400",
  };
  return (
    <div className={`rounded-2xl border p-4 ${accentClasses[accent]}`}>
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-current/10 bg-current/5">{icon}</div>
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.17em] text-gray-500">{label}</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-2xl font-semibold leading-none text-white">{value.toLocaleString()}</span>
            <span className="truncate text-[8px] text-gray-600">{description}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RedirectRow({ redirect, deleting, copied, onDelete, onCopy }: { redirect: RedirectRule; deleting: boolean; copied: boolean; onDelete: (id: string) => void; onCopy: (redirect: RedirectRule) => void }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black transition hover:border-white/20 hover:bg-white/[0.015]">
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
        <div className="flex shrink-0 items-center gap-2 lg:w-[76px]">
          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[9px] font-black tracking-widest ${redirect.isPermanent ? "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]" : "border-blue-400/20 bg-blue-400/10 text-blue-400"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${redirect.isPermanent ? "bg-[#D4AF37]" : "bg-blue-400"}`} />
            {redirect.isPermanent ? "301" : "302"}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="min-w-0">
              <p className="mb-1 text-[7px] font-black uppercase tracking-[0.18em] text-red-400/70">Source</p>
              <p title={redirect.oldUrl} className="truncate font-mono text-xs text-red-300">{redirect.oldUrl}</p>
            </div>
            <div className="hidden h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] md:flex">
              <ArrowRight size={12} className="text-gray-600" />
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-[7px] font-black uppercase tracking-[0.18em] text-emerald-400/70">Destination</p>
              <p title={redirect.newUrl} className="truncate font-mono text-xs text-emerald-300">{redirect.newUrl}</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1 border-t border-white/5 pt-3 lg:border-t-0 lg:pt-0">
          <button onClick={() => onCopy(redirect)} title="Copy redirect" className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${copied ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400" : "border-white/5 bg-white/[0.02] text-gray-600 hover:border-white/10 hover:bg-white/5 hover:text-white"}`}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          <button onClick={() => onDelete(redirect._id)} disabled={deleting} title="Delete redirect" className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/10 bg-red-500/5 text-red-500/60 transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-wait disabled:opacity-50">
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 h-px w-0 transition-all duration-500 group-hover:w-full ${redirect.isPermanent ? "bg-[#D4AF37]" : "bg-blue-400"}`} />
    </div>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex min-h-[330px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
        {hasFilters ? <Search size={24} className="text-gray-600" /> : <Link2 size={24} className="text-gray-600" />}
      </div>
      <h4 className="text-sm font-semibold text-gray-300">{hasFilters ? "No matching redirects" : "No redirect rules yet"}</h4>
      <p className="mt-2 max-w-sm text-[10px] leading-5 text-gray-600">{hasFilters ? "Try a different search term or remove the active filter." : "Create your first redirect rule to start managing migrated URLs."}</p>
      {hasFilters && (
        <button onClick={onClear} className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-gray-400 transition hover:bg-white/10 hover:text-white">
          <X size={12} /> Clear filters
        </button>
      )}
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/5 bg-white/[0.015] p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-[#D4AF37]">
        {icon}
      </div>
      <div>
        <h5 className="text-xs font-bold text-white">{title}</h5>
        <p className="mt-1 text-[10px] leading-relaxed text-gray-500">{text}</p>
      </div>
    </div>
  );
}