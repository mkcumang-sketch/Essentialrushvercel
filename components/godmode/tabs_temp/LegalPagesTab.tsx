"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { motion, AnimatePresence } from "framer-motion";

import {
  AlertTriangle,
  Check,
  ChevronRight,
  Copy,
  FileCode2,
  FileText,
  Image as ImageIcon,
  Link2,
  Loader2,
  Mail,
  Eye,
  Pencil,
  Plus,
  Radar,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Video,
  X,
  Building2,
  Phone,
  MapPin,
  Globe2,
  Clock3,
} from "lucide-react";

import type {
  LegalPage,
  CorporateInfo,
} from "@/types/godmode";

interface LegalPagesProps {
  legalPages: LegalPage[];
  setLegalPages: (pages: LegalPage[]) => void;

  activeLegalPageId: string;
  setActiveLegalPageId: (id: string) => void;

  corporateInfo: CorporateInfo;
  setCorporateInfo: (info: CorporateInfo) => void;

  handleSaveCMS: () => void;

  PremiumUploadNode: React.ComponentType<{
    placeholder?: string;
    onUploadSuccess: (url: string) => void;
  }>;
}

type EditorMode = "code" | "preview";

interface Asset {
  url: string;
  type: "image" | "video";
  index: number;
}

const GOLD = "#D4AF37";

const VIDEO_REGEX = /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i;

const DEFAULT_POLICY_CONTENT = `
<h1>New Policy</h1>

<p>
Add your policy information for <strong>Essential Rush</strong> here.
</p>

<h2>Introduction</h2>

<p>
Write clear and simple information that your customers can easily understand.
</p>
`.trim();

const createId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const slugify = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const escapeRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const isVideoUrl = (url: string) => {
  return VIDEO_REGEX.test(url);
};

const getAssetsFromHTML = (html: string): Asset[] => {
  const assets: Asset[] = [];

  const regex =
    /<(img|video)\b[^>]*?\bsrc=["']([^"']+)["'][^>]*>/gi;

  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = regex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const url = match[2];

    if (!url) continue;

    assets.push({
      url,
      type:
        tag === "video" || isVideoUrl(url)
          ? "video"
          : "image",
      index,
    });

    index++;
  }

  return assets;
};

const getWordCount = (html: string) => {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return 0;

  return text.split(" ").length;
};

export default function LegalPages({
  legalPages,
  setLegalPages,
  activeLegalPageId,
  setActiveLegalPageId,
  corporateInfo,
  setCorporateInfo,
  handleSaveCMS,
  PremiumUploadNode,
}: LegalPagesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editorMode, setEditorMode] =
    useState<EditorMode>("code");

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [pageToDelete, setPageToDelete] =
    useState<LegalPage | null>(null);

  const [copied, setCopied] = useState(false);

  const [lastSaved, setLastSaved] =
    useState<Date | null>(null);

  /*
   * ---------------------------------------------------------
   * ACTIVE PAGE
   * ---------------------------------------------------------
   */

  const activePage = useMemo(() => {
    return legalPages.find(
      (page) => page.id === activeLegalPageId
    );
  }, [legalPages, activeLegalPageId]);

  /*
   * ---------------------------------------------------------
   * FILTERED PAGES
   * ---------------------------------------------------------
   */

  const filteredPages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return legalPages;

    return legalPages.filter((page) => {
      return (
        page.title?.toLowerCase().includes(query) ||
        page.slug?.toLowerCase().includes(query)
      );
    });
  }, [legalPages, searchTerm]);

  /*
   * ---------------------------------------------------------
   * ACTIVE CONTENT STATS
   * ---------------------------------------------------------
   */

  const assets = useMemo(() => {
    return getAssetsFromHTML(activePage?.content || "");
  }, [activePage?.content]);

  const wordCount = useMemo(() => {
    return getWordCount(activePage?.content || "");
  }, [activePage?.content]);

  const characterCount = activePage?.content?.length || 0;

  /*
   * ---------------------------------------------------------
   * PAGE UPDATE
   * ---------------------------------------------------------
   */

  const updateActivePage = useCallback(
    (updates: Partial<LegalPage>) => {
      if (!activeLegalPageId) return;

      const updatedPages = legalPages.map((page) => {
        if (page.id !== activeLegalPageId) {
          return page;
        }

        return {
          ...page,
          ...updates,
        };
      });

      setLegalPages(updatedPages);
      setIsDirty(true);
    },
    [
      activeLegalPageId,
      legalPages,
      setLegalPages,
    ]
  );

  /*
   * ---------------------------------------------------------
   * CREATE PAGE
   * ---------------------------------------------------------
   */

  const handleCreatePage = () => {
    const newId = createId();

    let baseSlug = "new-policy";
    let finalSlug = baseSlug;
    let counter = 2;

    while (
      legalPages.some(
        (page) => page.slug === finalSlug
      )
    ) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const newPage: LegalPage = {
      id: newId,
      title: "New Policy",
      slug: finalSlug,
      content: DEFAULT_POLICY_CONTENT,
    };

    setLegalPages([...legalPages, newPage]);
    setActiveLegalPageId(newId);
    setEditorMode("code");
    setIsDirty(true);
  };

  /*
   * ---------------------------------------------------------
   * DUPLICATE PAGE
   * ---------------------------------------------------------
   */

  const handleDuplicatePage = () => {
    if (!activePage) return;

    const newId = createId();

    const baseSlug =
      slugify(activePage.title || "policy") ||
      "policy";

    let finalSlug = `${baseSlug}-copy`;
    let counter = 2;

    while (
      legalPages.some(
        (page) => page.slug === finalSlug
      )
    ) {
      finalSlug = `${baseSlug}-copy-${counter}`;
      counter++;
    }

    const duplicatedPage: LegalPage = {
      ...activePage,
      id: newId,
      title: `${activePage.title} Copy`,
      slug: finalSlug,
    };

    const currentIndex = legalPages.findIndex(
      (page) => page.id === activePage.id
    );

    const nextPages = [...legalPages];

    nextPages.splice(
      currentIndex + 1,
      0,
      duplicatedPage
    );

    setLegalPages(nextPages);
    setActiveLegalPageId(newId);
    setIsDirty(true);
  };

  /*
   * ---------------------------------------------------------
   * DELETE
   * ---------------------------------------------------------
   */

  const requestDeletePage = (page: LegalPage) => {
    setPageToDelete(page);
    setShowDeleteModal(true);
  };

  const confirmDeletePage = () => {
    if (!pageToDelete) return;

    const remainingPages = legalPages.filter(
      (page) => page.id !== pageToDelete.id
    );

    setLegalPages(remainingPages);

    if (
      activeLegalPageId === pageToDelete.id
    ) {
      setActiveLegalPageId(
        remainingPages[0]?.id || ""
      );
    }

    setPageToDelete(null);
    setShowDeleteModal(false);
    setIsDirty(true);
  };

  /*
   * ---------------------------------------------------------
   * SAVE
   * ---------------------------------------------------------
   */

  const handleSave = async () => {
    try {
      setIsSaving(true);

      await Promise.resolve(handleSaveCMS());

      setIsDirty(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error(
        "Failed to save CMS settings:",
        error
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * COPY URL
   * ---------------------------------------------------------
   */

  const copyPageUrl = async () => {
    if (!activePage) return;

    const url = `/policies/${activePage.slug}`;

    try {
      await navigator.clipboard.writeText(url);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error(
        "Failed to copy URL:",
        error
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * MEDIA UPLOAD
   * ---------------------------------------------------------
   */

  const insertMedia = (url: string) => {
    if (!activePage || !url) return;

    const mediaTag = isVideoUrl(url)
      ? `\n\n<video src="${url}" autoplay loop muted playsinline controls></video>\n\n`
      : `\n\n<img src="${url}" alt="Policy image" loading="lazy" />\n\n`;

    updateActivePage({
      content:
        (activePage.content || "") +
        mediaTag,
    });
  };

  /*
   * ---------------------------------------------------------
   * REMOVE ASSET
   * ---------------------------------------------------------
   */

  const removeAsset = (url: string) => {
    if (!activePage) return;

    const escapedUrl =
      escapeRegExp(url);

    const imageRegex = new RegExp(
      `<img\\b[^>]*\\bsrc=["']${escapedUrl}["'][^>]*\\/?>`,
      "gi"
    );

    const videoRegex = new RegExp(
      `<video\\b[^>]*\\bsrc=["']${escapedUrl}["'][^>]*>[\\s\\S]*?<\\/video>`,
      "gi"
    );

    const updatedContent =
      activePage.content
        .replace(imageRegex, "")
        .replace(videoRegex, "");

    updateActivePage({
      content: updatedContent,
    });
  };

  /*
   * ---------------------------------------------------------
   * AUTO SLUG
   * ---------------------------------------------------------
   */

  const handleTitleChange = (
    title: string
  ) => {
    const currentSlug =
      activePage?.slug || "";

    const shouldAutoSlug =
      !currentSlug ||
      currentSlug ===
        slugify(activePage?.title || "");

    updateActivePage({
      title,
      ...(shouldAutoSlug
        ? {
            slug: slugify(title),
          }
        : {}),
    });
  };

  /*
   * ---------------------------------------------------------
   * KEYBOARD SHORTCUT
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();
        handleSave();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, [handleSave]);

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full pb-24 space-y-6"
      >
        {/* =====================================================
            TOP COMMAND HEADER
        ===================================================== */}

        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0d0d0d]">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.10),transparent_35%)]" />

          <div className="relative p-5 md:p-7">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                    <ShieldCheck
                      size={21}
                      className="text-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-white">
                      Legal & Corporate CMS
                    </h2>

                    <p className="text-[10px] md:text-xs text-gray-500 mt-1">
                      Manage policies, legal documents,
                      corporate information and media.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isDirty && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    Unsaved changes
                  </div>
                )}

                {!isDirty && lastSaved && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                    <Check size={13} />
                    Saved
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="min-h-[42px] px-4 rounded-xl bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={15} />
                  )}

                  {isSaving
                    ? "Saving..."
                    : "Save CMS"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            MAIN GRID
        ===================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* ===================================================
              LEFT SIDEBAR
          =================================================== */}

          <aside className="xl:col-span-3 space-y-5">
            <div className="bg-[#101010] border border-white/10 rounded-[24px] overflow-hidden">
              {/* Sidebar Header */}

              <div className="p-5 border-b border-white/10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.22em] text-gray-500 font-black">
                      Content Library
                    </p>

                    <h3 className="text-white font-bold mt-1">
                      Policy Pages
                    </h3>
                  </div>

                  <span className="min-w-8 h-8 px-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs text-[#D4AF37] font-bold">
                    {legalPages.length}
                  </span>
                </div>

                {/* Search */}

                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                  />

                  <input
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(
                        e.target.value
                      )
                    }
                    placeholder="Search pages..."
                    className="w-full h-10 pl-9 pr-9 rounded-xl bg-black border border-white/10 text-xs text-white outline-none focus:border-[#D4AF37]/50 transition-all"
                  />

                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearchTerm("")
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Add Page */}

                <button
                  type="button"
                  onClick={handleCreatePage}
                  className="w-full mt-3 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={15} />
                  Create Policy Page
                </button>
              </div>

              {/* Pages */}

              <div className="p-3 max-h-[520px] overflow-y-auto custom-scrollbar">
                {filteredPages.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <FileText
                      size={28}
                      className="mx-auto text-gray-700 mb-3"
                    />

                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
                      {searchTerm
                        ? "No matching pages"
                        : "No policy pages"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPages.map(
                      (page) => {
                        const isActive =
                          activeLegalPageId ===
                          page.id;

                        const pageAssets =
                          getAssetsFromHTML(
                            page.content || ""
                          ).length;

                        return (
                          <motion.div
                            layout
                            key={page.id}
                            onClick={() =>
                              setActiveLegalPageId(
                                page.id
                              )
                            }
                            className={`group relative rounded-2xl border cursor-pointer p-3.5 transition-all ${
                              isActive
                                ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 shadow-[0_0_25px_rgba(212,175,55,0.06)]"
                                : "bg-black/40 border-white/5 hover:border-white/15 hover:bg-white/[0.03]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  isActive
                                    ? "bg-[#D4AF37]/15 text-[#D4AF37]"
                                    : "bg-white/5 text-gray-600"
                                }`}
                              >
                                <FileCode2
                                  size={16}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4
                                    className={`text-xs font-bold truncate ${
                                      isActive
                                        ? "text-[#D4AF37]"
                                        : "text-white"
                                    }`}
                                  >
                                    {page.title ||
                                      "Untitled Page"}
                                  </h4>

                                  {isActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0 animate-pulse" />
                                  )}
                                </div>

                                <p className="text-[9px] text-gray-600 font-mono truncate mt-1">
                                  /policies/
                                  {page.slug}
                                </p>

                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-[8px] uppercase tracking-wider text-gray-600">
                                    {pageAssets} assets
                                  </span>

                                  <span className="text-[8px] uppercase tracking-wider text-gray-600">
                                    {getWordCount(
                                      page.content ||
                                        ""
                                    )}{" "}
                                    words
                                  </span>
                                </div>
                              </div>

                              <ChevronRight
                                size={14}
                                className={`mt-1 shrink-0 transition-transform ${
                                  isActive
                                    ? "text-[#D4AF37] translate-x-0.5"
                                    : "text-gray-700"
                                }`}
                              />
                            </div>

                            {/* Hover Actions */}

                            <div className="absolute right-3 bottom-3 hidden group-hover:flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  requestDeletePage(
                                    page
                                  );
                                }}
                                className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                title="Delete page"
                              >
                                <Trash2
                                  size={12}
                                />
                              </button>
                            </div>
                          </motion.div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* =================================================
                CORPORATE INFO
            ================================================= */}

            <div className="bg-[#101010] border border-white/10 rounded-[24px] overflow-hidden">
              <div className="p-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                    <Building2
                      size={16}
                      className="text-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Corporate Identity
                    </h3>

                    <p className="text-[9px] text-gray-600 uppercase tracking-wider mt-0.5">
                      Footer & Legal Information
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="relative">
                  <Building2
                    size={14}
                    className="absolute left-3 top-3.5 text-gray-600"
                  />

                  <input
                    value={
                      corporateInfo.companyName
                    }
                    onChange={(e) =>
                      setCorporateInfo({
                        ...corporateInfo,
                        companyName:
                          e.target.value,
                      })
                    }
                    placeholder="Company name"
                    className="w-full h-11 pl-9 pr-3 rounded-xl bg-black border border-white/10 text-xs text-white outline-none focus:border-[#D4AF37]/50"
                  />
                </div>

                <div className="relative">
                  <MapPin
                    size={14}
                    className="absolute left-3 top-3.5 text-gray-600"
                  />

                  <textarea
                    value={corporateInfo.address}
                    onChange={(e) =>
                      setCorporateInfo({
                        ...corporateInfo,
                        address:
                          e.target.value,
                      })
                    }
                    placeholder="Business address"
                    rows={3}
                    className="w-full pl-9 pr-3 py-3 rounded-xl bg-black border border-white/10 text-xs text-white outline-none focus:border-[#D4AF37]/50 resize-none"
                  />
                </div>

                <div className="relative">
                  <Phone
                    size={14}
                    className="absolute left-3 top-3.5 text-gray-600"
                  />

                  <input
                    value={
                      corporateInfo.phone1
                    }
                    onChange={(e) =>
                      setCorporateInfo({
                        ...corporateInfo,
                        phone1:
                          e.target.value,
                      })
                    }
                    placeholder="Primary phone"
                    className="w-full h-11 pl-9 pr-3 rounded-xl bg-black border border-white/10 text-xs text-white outline-none focus:border-[#D4AF37]/50"
                  />
                </div>

                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3 top-3.5 text-gray-600"
                  />

                  <input
                    value={
                      corporateInfo.email
                    }
                    onChange={(e) =>
                      setCorporateInfo({
                        ...corporateInfo,
                        email:
                          e.target.value,
                      })
                    }
                    placeholder="Corporate email"
                    type="email"
                    className="w-full h-11 pl-9 pr-3 rounded-xl bg-black border border-white/10 text-xs text-white outline-none focus:border-[#D4AF37]/50"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* ===================================================
              MAIN EDITOR
          =================================================== */}

          <main className="xl:col-span-9">
            <AnimatePresence mode="wait">
              {!activePage ? (
                <motion.div
                  key="empty"
                  initial={{
                    opacity: 0,
                    scale: 0.98,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  className="min-h-[650px] bg-[#101010] border border-white/10 rounded-[28px] flex items-center justify-center relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.07),transparent_35%)]" />

                  <div className="relative text-center px-6">
                    <div className="w-20 h-20 rounded-[26px] bg-[#D4AF37]/10 border border-[#D4AF37]/20 mx-auto flex items-center justify-center mb-6">
                      <Radar
                        size={36}
                        className="text-[#D4AF37] opacity-80"
                      />
                    </div>

                    <h3 className="text-lg md:text-xl font-bold text-white">
                      Select a policy page
                    </h3>

                    <p className="text-xs text-gray-600 max-w-sm mx-auto mt-2 leading-relaxed">
                      Choose a document from the
                      content library to start
                      editing your legal content.
                    </p>

                    <button
                      type="button"
                      onClick={handleCreatePage}
                      className="mt-6 px-5 h-11 rounded-xl bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
                    >
                      Create First Page
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={activePage.id}
                  initial={{
                    opacity: 0,
                    x: 10,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  className="bg-[#101010] border border-white/10 rounded-[28px] overflow-hidden"
                >
                  {/* =================================================
                      EDITOR HEADER
                  ================================================= */}

                  <div className="p-5 md:p-7 border-b border-white/10">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] text-[#D4AF37] uppercase tracking-[0.22em] font-black">
                            Editing Document
                          </span>

                          <span className="w-1 h-1 rounded-full bg-gray-700" />

                          <span className="text-[9px] text-gray-600 font-mono">
                            ID: {activePage.id}
                          </span>
                        </div>

                        <h1 className="text-xl md:text-2xl font-bold text-white truncate">
                          {activePage.title ||
                            "Untitled Policy"}
                        </h1>

                        <button
                          type="button"
                          onClick={copyPageUrl}
                          className="flex items-center gap-2 mt-2 text-[9px] text-gray-500 hover:text-[#D4AF37] transition-colors font-mono"
                        >
                          <Link2 size={11} />

                          /policies/
                          {activePage.slug}

                          {copied ? (
                            <Check
                              size={11}
                              className="text-green-400"
                            />
                          ) : (
                            <Copy
                              size={11}
                            />
                          )}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDuplicatePage}
                          className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-[9px] uppercase tracking-wider font-bold flex items-center gap-2 transition-all"
                        >
                          <Copy size={13} />
                          Duplicate
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            requestDeletePage(
                              activePage
                            )
                          }
                          className="h-9 px-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-[9px] uppercase tracking-wider font-bold flex items-center gap-2 transition-all"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* =================================================
                        PAGE META
                    ================================================= */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase tracking-[0.18em] font-black mb-2 block">
                          Page Title
                        </label>

                        <div className="relative">
                          <Pencil
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                          />

                          <input
                            value={
                              activePage.title ||
                              ""
                            }
                            onChange={(e) =>
                              handleTitleChange(
                                e.target.value
                              )
                            }
                            className="w-full h-12 pl-9 pr-3 rounded-xl bg-black border border-white/10 text-sm text-white outline-none focus:border-[#D4AF37]/50 transition-all"
                            placeholder="Privacy Policy"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] text-gray-500 uppercase tracking-[0.18em] font-black mb-2 block">
                          URL Slug
                        </label>

                        <div className="relative">
                          <Globe2
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                          />

                          <input
                            value={
                              activePage.slug ||
                              ""
                            }
                            onChange={(e) =>
                              updateActivePage({
                                slug: slugify(
                                  e.target
                                    .value
                                ),
                              })
                            }
                            className="w-full h-12 pl-9 pr-3 rounded-xl bg-black border border-white/10 text-xs text-[#00D9FF] font-mono outline-none focus:border-[#D4AF37]/50 transition-all"
                            placeholder="privacy-policy"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      EDITOR TOOLBAR
                  ================================================= */}

                  <div className="px-5 md:px-7 py-3 border-b border-white/10 bg-black/20 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-black border border-white/10 w-fit">
                      <button
                        type="button"
                        onClick={() =>
                          setEditorMode("code")
                        }
                        className={`h-8 px-3 rounded-lg text-[9px] uppercase tracking-wider font-bold flex items-center gap-2 transition-all ${
                          editorMode === "code"
                            ? "bg-[#D4AF37] text-black"
                            : "text-gray-500 hover:text-white"
                        }`}
                      >
                        <FileCode2
                          size={13}
                        />
                        HTML
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEditorMode(
                            "preview"
                          )
                        }
                        className={`h-8 px-3 rounded-lg text-[9px] uppercase tracking-wider font-bold flex items-center gap-2 transition-all ${
                          editorMode ===
                          "preview"
                            ? "bg-[#D4AF37] text-black"
                            : "text-gray-500 hover:text-white"
                        }`}
                      >
                        <Eye size={13} />
                        Preview
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[9px] font-mono text-gray-600">
                      <span>
                        {wordCount} words
                      </span>

                      <span>
                        {characterCount.toLocaleString()}{" "}
                        chars
                      </span>

                      <span>
                        {assets.length} assets
                      </span>

                      <span className="hidden sm:flex items-center gap-1">
                        <Clock3
                          size={10}
                        />
                        {lastSaved
                          ? lastSaved.toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute:
                                  "2-digit",
                              }
                            )
                          : "Not saved"}
                      </span>
                    </div>
                  </div>

                  {/* =================================================
                      MEDIA UPLOAD BAR
                  ================================================= */}

                  <div className="px-5 md:px-7 py-4 border-b border-white/10 bg-[#0c0c0c]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.18em] font-black text-gray-500">
                          Media Injection
                        </p>

                        <p className="text-[9px] text-gray-700 mt-1">
                          Upload an image or video
                          directly into this
                          document.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Upload
                          size={14}
                          className="text-[#D4AF37]"
                        />

                        <div className="scale-75 origin-right">
                          <PremiumUploadNode
                            placeholder="Upload Media"
                            onUploadSuccess={
                              insertMedia
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      CONTENT AREA
                  ================================================= */}

                  <div className="p-5 md:p-7">
                    {editorMode === "code" ? (
                      <div className="relative">
                        <textarea
                          value={
                            activePage.content ||
                            ""
                          }
                          onChange={(e) =>
                            updateActivePage({
                              content:
                                e.target.value,
                            })
                          }
                          spellCheck={false}
                          className="w-full min-h-[480px] md:min-h-[560px] resize-y bg-black border border-white/10 rounded-2xl p-5 md:p-6 text-xs md:text-sm text-gray-300 font-mono leading-7 outline-none focus:border-[#D4AF37]/40 transition-all custom-scrollbar selection:bg-[#D4AF37]/20"
                          placeholder={`<h1>Privacy Policy</h1>

<p>Enter your legal content here...</p>`}
                        />

                        <div className="absolute right-4 bottom-4 px-2.5 py-1.5 rounded-lg bg-black/80 border border-white/10 text-[8px] text-gray-600 uppercase tracking-wider font-bold pointer-events-none">
                          HTML SOURCE
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 overflow-hidden bg-white">
                        <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center gap-1.5 px-4">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />

                          <span className="ml-3 text-[9px] text-gray-400 font-mono truncate">
                            /policies/
                            {activePage.slug}
                          </span>
                        </div>

                        <iframe
                          title="Policy Preview"
                          srcDoc={`
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <style>
                                  body {
                                    margin: 0;
                                    padding: 40px;
                                    font-family: Arial, Helvetica, sans-serif;
                                    line-height: 1.7;
                                    color: #222;
                                    background: #fff;
                                  }

                                  h1 {
                                    font-size: 32px;
                                    margin-bottom: 24px;
                                  }

                                  h2 {
                                    font-size: 22px;
                                    margin-top: 32px;
                                  }

                                  h3 {
                                    font-size: 18px;
                                    margin-top: 24px;
                                  }

                                  p {
                                    font-size: 15px;
                                    margin: 12px 0;
                                  }

                                  img,
                                  video {
                                    max-width: 100%;
                                    height: auto;
                                    border-radius: 12px;
                                    margin: 20px 0;
                                  }

                                  a {
                                    color: #997b18;
                                  }

                                  @media(max-width: 640px) {
                                    body {
                                      padding: 24px;
                                    }

                                    h1 {
                                      font-size: 26px;
                                    }
                                  }
                                </style>
                              </head>
                              <body>
                                ${
                                  activePage.content ||
                                  "<p>No content yet.</p>"
                                }
                              </body>
                            </html>
                          `}
                          className="w-full h-[560px] border-0"
                        />
                      </div>
                    )}
                  </div>

                  {/* =================================================
                      ASSET DETECTION
                  ================================================= */}

                  <div className="mx-5 md:mx-7 mb-7 rounded-2xl border border-[#D4AF37]/10 bg-black/30 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                          <Radar
                            size={15}
                            className="text-[#D4AF37]"
                          />
                        </div>

                        <div>
                          <h4 className="text-[10px] text-white uppercase tracking-[0.18em] font-black">
                            Asset Detection Stream
                          </h4>

                          <p className="text-[8px] text-gray-600 mt-1">
                            Embedded media discovered
                            inside this document.
                          </p>
                        </div>
                      </div>

                      <span className="text-[9px] font-mono text-[#D4AF37]">
                        {assets.length} detected
                      </span>
                    </div>

                    <div className="p-4">
                      {assets.length === 0 ? (
                        <div className="py-10 text-center border border-dashed border-white/10 rounded-xl">
                          <ImageIcon
                            size={25}
                            className="mx-auto text-gray-700 mb-3"
                          />

                          <p className="text-[9px] text-gray-600 uppercase tracking-[0.18em] font-black">
                            Stream Clear
                          </p>

                          <p className="text-[8px] text-gray-700 mt-1">
                            No embedded assets found.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {assets.map(
                            (asset, index) => (
                              <motion.div
                                layout
                                key={`${asset.url}-${index}`}
                                className="group relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black"
                              >
                                {asset.type ===
                                "video" ? (
                                  <video
                                    src={
                                      asset.url
                                    }
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                  />
                                ) : (
                                  <img
                                    src={
                                      asset.url
                                    }
                                    alt={`Asset ${
                                      index +
                                      1
                                    }`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                )}

                                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black via-black/70 to-transparent">
                                  <div className="flex items-center gap-1.5">
                                    {asset.type ===
                                    "video" ? (
                                      <Video
                                        size={10}
                                        className="text-[#D4AF37]"
                                      />
                                    ) : (
                                      <ImageIcon
                                        size={10}
                                        className="text-[#D4AF37]"
                                      />
                                    )}

                                    <span className="text-[7px] text-gray-300 uppercase tracking-wider truncate">
                                      {asset.type}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeAsset(
                                      asset.url
                                    )
                                  }
                                  className="absolute inset-0 bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2"
                                >
                                  <Trash2
                                    size={18}
                                  />

                                  <span className="text-[8px] font-black uppercase tracking-widest">
                                    Remove Asset
                                  </span>
                                </button>
                              </motion.div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* =================================================
                      BOTTOM ACTION BAR
                  ================================================= */}

                  <div className="sticky bottom-0 z-10 border-t border-white/10 bg-[#101010]/95 backdrop-blur-xl px-5 md:px-7 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {isDirty ? (
                          <>
                            <AlertTriangle
                              size={14}
                              className="text-orange-400"
                            />

                            <span className="text-[9px] text-gray-500">
                              Changes are not yet
                              published.
                            </span>
                          </>
                        ) : (
                          <>
                            <Check
                              size={14}
                              className="text-green-400"
                            />

                            <span className="text-[9px] text-gray-500">
                              All changes saved.
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="min-h-[46px] px-7 rounded-xl bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-[0.18em] hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSaving ? (
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <Save size={16} />
                        )}

                        {isSaving
                          ? "Publishing..."
                          : "Save & Publish"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </motion.div>

      {/* =========================================================
          DELETE MODAL
      ========================================================= */}

      <AnimatePresence>
        {showDeleteModal &&
          pageToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-5"
              onClick={() =>
                setShowDeleteModal(false)
              }
            >
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.95,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  y: 10,
                }}
                onClick={(e) =>
                  e.stopPropagation()
                }
                className="w-full max-w-md rounded-[26px] border border-white/10 bg-[#111] shadow-2xl overflow-hidden"
              >
                <div className="p-6">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
                    <AlertTriangle
                      size={22}
                      className="text-red-400"
                    />
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    Delete policy page?
                  </h3>

                  <p className="text-xs text-gray-500 leading-relaxed mt-2">
                    You are about to permanently
                    remove{" "}
                    <strong className="text-gray-300">
                      {pageToDelete.title}
                    </strong>
                    . This action cannot be
                    undone from this editor.
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-black border border-white/10">
                    <p className="text-[9px] text-gray-600 uppercase tracking-wider">
                      URL
                    </p>

                    <p className="text-[10px] text-[#00D9FF] font-mono mt-1 break-all">
                      /policies/
                      {pageToDelete.slug}
                    </p>
                  </div>
                </div>

                <div className="p-4 border-t border-white/10 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setShowDeleteModal(false)
                    }
                    className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-[9px] font-black uppercase tracking-widest hover:text-white transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      confirmDeletePage
                    }
                    className="flex-1 h-11 rounded-xl bg-red-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-red-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete Page
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
      </AnimatePresence>
    </>
  );
}