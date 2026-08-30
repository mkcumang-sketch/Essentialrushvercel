"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  BarChart3,
  Package,
  Landmark,
  Users,
  RefreshCcw,
  Layout,
  Link as LinkIcon,
  ShieldCheck,
  Truck,
  Zap,
  Activity,
  ShieldAlert,
  FileText,
  Star,
  Globe,
  Award,
  Lock,
  Tag,
  Archive,
  Brain,
  ChevronRight,
  Search,
  Sliders,
  CheckCircle2,
  Terminal,
  LogOut,
} from "lucide-react";

// TABS IMPORTS
import DashboardTab from "@/components/godmode/tabs_temp/DashboardTab";
import AiCommandCenterTab from "@/components/godmode/tabs_temp/AiCommandCenterTab";
import MyrioLearningTab from "@/components/godmode/tabs_temp/MyrioLearningTab";
import MyrioHealthTab from "@/components/godmode/tabs_temp/MyrioHealthTab";
import MyrioArchiveTab from "@/components/godmode/tabs_temp/MyrioArchiveTab";
import InventoryTab from "@/components/godmode/tabs_temp/InventoryTab";
import OrderTrackerTab from "@/components/godmode/tabs_temp/OrderTrackerTab";
import CustomersCrm from "@/components/godmode/tabs_temp/CustomersCrm";
import CouponMarketingTab from "@/components/godmode/tabs_temp/CouponMarketing";
import WebsiteBuilderTab from "@/components/godmode/tabs_temp/WebsiteBuilderTab";
import BrandAmbassadors from "@/components/godmode/tabs_temp/BrandAmbassadorsTab";
import ReviewsTab from "@/components/godmode/tabs_temp/ReviewsTab";
import SeoEngineTab from "@/components/godmode/tabs_temp/SeoEngineTab";
import SalesForceTab from "@/components/godmode/tabs_temp/SalesForceTab";
import WithdrawalTab from "@/components/godmode/tabs_temp/WithdrawalTab";
import LegalPagesTab from "@/components/godmode/tabs_temp/LegalPagesTab";
import SecurityTab from "@/components/godmode/tabs_temp/SecurityTab";

// TYPES
import type {
  HeroSlide,
  AboutConfig,
  UiConfig,
  SocialLinks,
  CorporateInfo,
  LegalPage,
  ManualReview,
  WatchFormState,
  AgentForm,
} from "@/types/godmode";

// ============================================================================
// MODULE ARCHITECTURE & CATEGORIZATION
// ============================================================================
interface ModuleItem {
  id: string;
  icon: any;
  label: string;
  badge?: string;
}

interface ModuleCategory {
  category: string;
  modules: ModuleItem[];
}

const MODULE_CATEGORIES: ModuleCategory[] = [
  {
    category: "Command & Intelligence",
    modules: [
      { id: "FULL_DASHBOARD", icon: BarChart3, label: "Overview & Analytics" },
      { id: "AI_COMMAND_CENTER", icon: Zap, label: "AI Command Console", badge: "MYRIO" },
      { id: "MYRIO_LEARNING", icon: Brain, label: "Learning & Trends" },
      { id: "MYRIO_HEALTH", icon: Activity, label: "Self-Health Diagnostics" },
      { id: "MYRIO_ARCHIVE", icon: Archive, label: "Data Lifecycle Archive" },
    ],
  },
  {
    category: "Commerce & Logistics",
    modules: [
      { id: "INVENTORY", icon: Package, label: "Vault Inventory" },
      { id: "ORDER_TRACKER", icon: Truck, label: "Order Management" },
      { id: "CRM", icon: Users, label: "Patron Directory (CRM)" },
      { id: "COUPONS", icon: Tag, label: "Privilege Codes & Offers" },
      { id: "WITHDRAWALS", icon: Landmark, label: "Withdrawal Requests" },
    ],
  },
  {
    category: "Storefront & Identity",
    modules: [
      { id: "PAGE_BUILDER", icon: Layout, label: "Storefront CMS" },
      { id: "SEO_ENGINE", icon: Globe, label: "Search Visibility (SEO)" },
      { id: "AMBASSADORS", icon: Award, label: "Brand Ambassadors" },
      { id: "REVIEWS", icon: Star, label: "Patron Reviews" },
    ],
  },
  {
    category: "Security & Governance",
    modules: [
      { id: "SALES_FORCE", icon: LinkIcon, label: "Affiliates & Partners" },
      { id: "LEGAL_PAGES", icon: FileText, label: "Compliance & Policies" },
      { id: "SECURITY", icon: ShieldAlert, label: "Perimeter Security" },
    ],
  },
];

// ============================================================================
// UPLOAD NODE COMPONENT
// ============================================================================
interface PremiumUploadNodeProps {
  onUploadSuccess: (url: string) => void;
  placeholder?: string;
  onUploadStateChange?: (state: boolean) => void;
}

const PremiumUploadNode = ({
  onUploadSuccess,
  placeholder = "Image/Video",
  onUploadStateChange,
}: PremiumUploadNodeProps) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const [inputId] = useState(`up-${Math.random().toString(36).substring(2, 9)}`);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    onUploadStateChange?.(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        setPreview(data.url);
        onUploadSuccess(data.url);
      }
    } catch (error) {
      console.error("Upload Error:", error);
    } finally {
      setUploading(false);
      onUploadStateChange?.(false);
    }
  };

  const isVideo = preview.match(/\.(mp4|webm|mov)$/i);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleUpload(file);
      }}
      className={`w-28 h-28 shrink-0 rounded-2xl border transition-all flex flex-col items-center justify-center p-3 cursor-pointer group ${
        dragging
          ? "border-[#D4AF37] bg-[#D4AF37]/10"
          : "border-white/10 bg-white/[0.02] hover:border-[#D4AF37]/50"
      }`}
    >
      <input
        id={inputId}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
      <label htmlFor={inputId} className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
        {uploading ? (
          <RefreshCcw size={18} className="animate-spin text-[#D4AF37]" />
        ) : preview ? (
          isVideo ? (
            <video src={preview} className="w-full h-full object-cover rounded-xl" muted autoPlay loop />
          ) : (
            <img src={preview} alt="Uploaded" className="w-full h-full object-cover rounded-xl" />
          )
        ) : (
          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold group-hover:text-gray-300">
            {placeholder}
          </span>
        )}
      </label>
    </div>
  );
};

// ============================================================================
// ADMIN CONSOLE CORE
// ============================================================================
function AdminDashboard() {
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState("FULL_DASHBOARD");
  const [navSearch, setNavSearch] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [dashboardView, setDashboardView] = useState<"orders" | "abandoned">("orders");
  const [systemLogs, setSystemLogs] = useState<string[]>(["Core initialization completed."]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [vipDispatchingKey, setVipDispatchingKey] = useState<string | null>(null);

  // Live Data States
  const [leads, setLeads] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [liveWatches, setLiveWatches] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [fullAnalytics, setFullAnalytics] = useState<any>(null);
  const [celebs, setCelebs] = useState<any[]>([]);
  const [isImageUploading, setIsImageUploading] = useState(false);

  // Form States
  const [newCeleb, setNewCeleb] = useState({ name: "", title: "", imageUrl: "" });
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentForm, setAgentForm] = useState<AgentForm>({
    name: "",
    email: "",
    code: "",
    tier: "Partner",
    commissionRate: 5,
  });

  const [watchForm, setWatchForm] = useState<WatchFormState>({
    name: "",
    brand: "",
    category: "Investment Grade",
    price: "",
    offerPrice: "",
    stock: "",
    imageUrl: "",
    images: ["", "", "", "", "", "", ""],
    videoUrl: "",
    model3DUrl: "",
    description: "",
    seoTags: "",
    specifications: "",
    priority: 0,
    badge: "New Arrival",
    amazonDetails: [{ key: "Dial Color", value: "Black" }],
    vipVaultKey: "",
    vipDiscount: "",
    transitFee: "0",
    taxPercentage: "18",
    taxInclusive: true,
    seo: { metaTitle: "", metaDescription: "", focusKeyword: "", slug: "", noindex: false, imageAltTexts: {} },
  });

  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([
    { id: 1, type: "video", url: "", heading: "Masterpieces" },
  ]);
  const [aboutConfig, setAboutConfig] = useState<AboutConfig>({
    content: "",
    alignment: "center",
    style: "luxury",
    boldWords: "",
  });
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [promoVideos, setPromoVideos] = useState<string[]>(["", "", "", "", ""]);
  const [uiConfig, setUiConfig] = useState<UiConfig>({
    primaryColor: "#D4AF37",
    bgColor: "#050505",
    fontFamily: "serif",
    buttonRadius: "full",
  });
  const [categories, setCategories] = useState<string[]>(["Investment Grade", "Rare Vintage"]);
  const [faqs, setFaqs] = useState([{ q: "Are these authentic?", a: "100% verified." }]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({ instagram: "", facebook: "", twitter: "", youtube: "", linkedin: "" });
  const [corporateInfo, setCorporateInfo] = useState<CorporateInfo>({
    companyName: "Essential Rush Pvt Ltd",
    address: "",
    phone1: "",
    phone2: "",
    email: "",
  });
  const [legalPages, setLegalPages] = useState<LegalPage[]>([
    { id: "1", title: "Privacy Policy", slug: "privacy-policy", content: "" },
  ]);
  const [activeLegalPageId, setActiveLegalPageId] = useState("1");
  const [manualReview, setManualReview] = useState<ManualReview>({
    userName: "",
    comment: "",
    rating: 5,
    product: "GLOBAL",
    visibility: "public",
    isAdminGenerated: true,
    media: [],
  });

  const addLog = useCallback((msg: string) => {
    setSystemLogs((prev) => [msg, ...prev].slice(0, 8));
  }, []);

  // Sync Database
  const fetchDashboardData = useCallback(
    async (silent = false) => {
      if (!silent) setIsSyncing(true);
      try {
        const ts = Date.now();
        const [
          resLeads,
          resCms,
          resProducts,
          resAgents,
          resOrders,
          resAnalytics,
          resReviews,
          resMarketing,
          resCust,
          resCelebs,
        ] = await Promise.all([
          fetch(`/api/abandoned-carts?t=${ts}`).then((r) => (r.ok ? r.json() : { leads: [] })),
          fetch(`/api/cms?t=${ts}`).then((r) => (r.ok ? r.json() : { data: null })),
          fetch(`/api/products?t=${ts}`).then((r) => (r.ok ? r.json() : { data: [] })),
          fetch(`/api/agents?t=${ts}`).then((r) => (r.ok ? r.json() : { data: [] })),
          fetch(`/api/orders?t=${ts}`).then((r) => (r.ok ? r.json() : { data: [] })),
          fetch(`/api/dashboard/full-analytics?t=${ts}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/reviews?admin=true&t=${ts}`).then((r) => (r.ok ? r.json() : { data: [] })),
          fetch(`/api/coupons?t=${ts}`).then((r) => (r.ok ? r.json() : { data: [] })),
          fetch(`/api/customers?t=${ts}`).then((r) => (r.ok ? r.json() : { data: [] })),
          fetch(`/api/celebrity?t=${ts}`).then((r) => (r.ok ? r.json() : { data: [] })),
        ]);

        if (resLeads.leads) setLeads(resLeads.leads);
        if (resProducts.data) setLiveWatches(resProducts.data);
        if (resAgents.data) setAgents(resAgents.data);
        if (resOrders.data) setOrders(resOrders.data);
        if (resAnalytics?.success) setFullAnalytics(resAnalytics);
        if (resCelebs.data) setCelebs(resCelebs.data);
        if (resMarketing.data) setCoupons(resMarketing.data);
        if (resCust.data) setCustomers(resCust.data);
        if (resReviews.data) setAllReviews(resReviews.data);

        if (resCms.data && !silent) {
          const cms = resCms.data;
          if (cms.heroSlides) setHeroSlides(cms.heroSlides);
          if (cms.aboutConfig) setAboutConfig(cms.aboutConfig);
          if (cms.galleryImages) setGalleryImages(cms.galleryImages);
          if (cms.promotionalVideos) setPromoVideos(cms.promotionalVideos);
          if (cms.uiConfig) setUiConfig(cms.uiConfig);
          if (cms.categories) setCategories(cms.categories);
          if (cms.faqs) setFaqs(cms.faqs);
          if (cms.socialLinks) setSocialLinks(cms.socialLinks);
          if (cms.corporateInfo) setCorporateInfo(cms.corporateInfo);
          if (cms.legalPages) setLegalPages(cms.legalPages);
        }
      } catch (err) {
        console.error("Dashboard Sync Error:", err);
      } finally {
        if (!silent) setIsSyncing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (session?.user && (session.user as any)?.role === "SUPER_ADMIN") {
      fetchDashboardData();
    }
  }, [session, fetchDashboardData]);

  // Product Handlers
  const handleSaveProduct = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(watchForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      addLog(`Timepiece "${watchForm.name}" updated.`);
      setWatchForm({
        name: "",
        brand: "",
        category: "Investment Grade",
        price: "",
        offerPrice: "",
        stock: "",
        imageUrl: "",
        images: ["", "", "", "", "", "", ""],
        videoUrl: "",
        model3DUrl: "",
        description: "",
        seoTags: "",
        specifications: "",
        priority: 0,
        badge: "New Arrival",
        amazonDetails: [{ key: "Dial Color", value: "Black" }],
        vipVaultKey: "",
        vipDiscount: "",
        transitFee: "0",
        taxPercentage: "18",
        taxInclusive: true,
        seo: { metaTitle: "", metaDescription: "", focusKeyword: "", slug: "", noindex: false, imageAltTexts: {} },
      });
      await fetchDashboardData(true);
    } catch (err: any) {
      console.error(err);
      addLog(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      setIsSyncing(true);
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        addLog("Catalog item purged.");
        await fetchDashboardData(true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Order Handlers
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      if (res.ok) {
        addLog(`Order updated to ${status}.`);
        await fetchDashboardData(true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateTracking = async (orderId: string, trackingData: any) => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, ...trackingData }),
      });
      if (res.ok) {
        addLog("Courier telemetry mapped.");
        await fetchDashboardData(true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setIsSyncing(true);
      await fetch(`/api/orders?id=${orderId}`, { method: "DELETE" });
      addLog("Consignment purged.");
      await fetchDashboardData(true);
    } finally {
      setIsSyncing(false);
    }
  };

  // CMS Handlers
  const handleSaveCMS = async () => {
    setIsSyncing(true);
    try {
      await fetch("/api/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroSlides,
          aboutConfig,
          galleryImages,
          promotionalVideos: promoVideos,
          uiConfig,
          categories,
          faqs,
          socialLinks,
          corporateInfo,
          legalPages,
        }),
      });
      addLog("Storefront configuration synchronized.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtered Navigation
  const filteredCategories = useMemo(() => {
    const q = navSearch.trim().toLowerCase();
    if (!q) return MODULE_CATEGORIES;
    return MODULE_CATEGORIES.map((cat) => ({
      ...cat,
      modules: cat.modules.filter((m) => m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)),
    })).filter((cat) => cat.modules.length > 0);
  }, [navSearch]);

  const activeModuleLabel = useMemo(() => {
    for (const cat of MODULE_CATEGORIES) {
      const match = cat.modules.find((m) => m.id === activeTab);
      if (match) return match.label;
    }
    return "Operations Center";
  }, [activeTab]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#07090b] text-white flex items-center justify-center font-mono text-xs uppercase tracking-[4px]">
        Authenticating Cryptographic Node...
      </div>
    );
  }

  if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-screen bg-[#07090b] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-6 shadow-2xl">
          <Lock size={28} />
        </div>
        <h1 className="text-2xl font-serif font-bold tracking-wide mb-2">Restricted Vault Gateway</h1>
        <p className="text-xs text-gray-400 mb-8 max-w-sm">Elevated administrative clearance is mandatory to access this terminal.</p>
        <button
          onClick={() => signIn("google")}
          className="bg-[#D4AF37] hover:bg-white text-black px-10 py-4 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-xl cursor-pointer"
        >
          Authenticate Identity
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#07090b] text-gray-200 flex font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* BACKGROUND MESH */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* =====================================================================
          SIDEBAR: ENTERPRISE LUXURY
      ====================================================================== */}
      <aside className="hidden lg:flex w-[320px] bg-[#0A0D10] border-r border-white/10 flex-col z-50 shrink-0 select-none">
        {/* Identity Badge */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">{session.user?.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[9px] text-[#D4AF37] font-mono uppercase tracking-widest">Master Authority</p>
            </div>
          </div>
        </div>

        {/* Quick Navigation Filter */}
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search console modules..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>
        </div>

        {/* Categorized Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10">
          {filteredCategories.map((cat, idx) => (
            <div key={idx} className="space-y-1.5">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-500 px-3 pb-1">
                {cat.category}
              </p>
              {cat.modules.map((m) => {
                const Icon = m.icon;
                const isActive = activeTab === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveTab(m.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#D4AF37] text-black font-bold shadow-[0_4px_20px_rgba(212,175,55,0.25)]"
                        : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={isActive ? "text-black" : "text-gray-400"} />
                      <span>{m.label}</span>
                    </div>
                    {m.badge && (
                      <span
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          isActive ? "bg-black text-[#D4AF37]" : "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30"
                        }`}
                      >
                        {m.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={14} /> Terminate Session
          </button>
        </div>
      </aside>

      {/* =====================================================================
          MAIN EXECUTIVE VIEWPORT
      ====================================================================== */}
      <main className="flex-1 min-w-0 flex flex-col h-screen min-h-0 overflow-hidden relative z-10 bg-[#07090b]">
        {/* Top Header Status Bar */}
        <header className="sticky top-0 z-40 bg-[#07090b]/80 backdrop-blur-xl border-b border-white/10 px-6 lg:px-10 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-mono text-gray-500">
              <span>Security Clearance</span>
              <span>•</span>
              <span className="text-emerald-400">Encrypted</span>
            </div>
            <h1 className="text-xl md:text-2xl font-serif font-bold text-white mt-0.5">{activeModuleLabel}</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDashboardData(false)}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-white/[0.04] hover:bg-[#D4AF37] hover:text-black border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-300 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCcw size={14} className={isSyncing ? "animate-spin text-[#D4AF37]" : ""} />
              {isSyncing ? "Syncing..." : "Sync Database"}
            </button>
          </div>
        </header>

        {/* Main Work Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:p-10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10">
          <AnimatePresence mode="wait">
            {activeTab === "FULL_DASHBOARD" && (
              <DashboardTab
                fullAnalytics={fullAnalytics}
                dashboardView={dashboardView}
                setDashboardView={setDashboardView}
                leads={leads}
                orders={orders}
                dispatchVIPRecovery={async () => {}}
                vipDispatchingKey={vipDispatchingKey}
                handleDeleteLead={async () => {}}
                systemLogs={systemLogs}
              />
            )}

            {activeTab === "AI_COMMAND_CENTER" && <AiCommandCenterTab />}
            {activeTab === "MYRIO_LEARNING" && <MyrioLearningTab />}
            {activeTab === "MYRIO_HEALTH" && <MyrioHealthTab />}
            {activeTab === "MYRIO_ARCHIVE" && <MyrioArchiveTab />}

            {activeTab === "INVENTORY" && (
              <InventoryTab
                watchForm={watchForm}
                setWatchForm={setWatchForm}
                handleSaveProduct={handleSaveProduct}
                liveWatches={liveWatches}
                handleDeleteProduct={handleDeleteProduct}
                PremiumUploadNode={PremiumUploadNode}
                setIsImageUploading={setIsImageUploading}
              />
            )}

            {activeTab === "ORDER_TRACKER" && (
              <OrderTrackerTab
                orders={orders}
                exportToCSV={() => {}}
                handleUpdateOrderStatus={handleUpdateOrderStatus}
                handleUpdateTracking={handleUpdateTracking}
                setSelectedOrder={setSelectedOrder}
                handleDeleteOrder={handleDeleteOrder}
              />
            )}

            {activeTab === "CRM" && <CustomersCrm customers={customers} />}
            {activeTab === "COUPONS" && <CouponMarketingTab />}
            {activeTab === "WITHDRAWALS" && <WithdrawalTab />}

            {activeTab === "PAGE_BUILDER" && (
              <WebsiteBuilderTab
                heroSlides={heroSlides}
                setHeroSlides={setHeroSlides}
                promoVideos={promoVideos}
                setPromoVideos={setPromoVideos}
                aboutConfig={aboutConfig}
                setAboutConfig={setAboutConfig}
                uiConfig={uiConfig}
                setUiConfig={setUiConfig}
                socialLinks={socialLinks}
                setSocialLinks={setSocialLinks}
                handleSaveCMS={handleSaveCMS}
                PremiumUploadNode={PremiumUploadNode}
              />
            )}

            {activeTab === "SEO_ENGINE" && <SeoEngineTab />}

            {activeTab === "AMBASSADORS" && (
              <BrandAmbassadors
                celebs={celebs}
                newCeleb={newCeleb}
                setNewCeleb={setNewCeleb}
                handleAddCeleb={() => fetchDashboardData(true)}
                handleDeleteCeleb={(id: string) => setCelebs(celebs.filter((c) => c._id !== id))}
                PremiumUploadNode={PremiumUploadNode}
              />
            )}

            {activeTab === "REVIEWS" && (
              <ReviewsTab
                manualReview={manualReview}
                setManualReview={setManualReview}
                handleAddManualReview={() => {}}
                allReviews={allReviews}
                handleUpdateReviewStatus={() => {}}
                handleDeleteReview={() => {}}
                PremiumUploadNode={PremiumUploadNode}
              />
            )}

            {activeTab === "SALES_FORCE" && (
              <SalesForceTab
                agents={agents}
                setIsAgentModalOpen={setIsAgentModalOpen}
                handleDeleteAffiliate={async () => {}}
              />
            )}

            {activeTab === "LEGAL_PAGES" && (
              <LegalPagesTab
                legalPages={legalPages}
                setLegalPages={setLegalPages}
                activeLegalPageId={activeLegalPageId}
                setActiveLegalPageId={setActiveLegalPageId}
                corporateInfo={corporateInfo}
                setCorporateInfo={setCorporateInfo}
                handleSaveCMS={handleSaveCMS}
                PremiumUploadNode={PremiumUploadNode}
              />
            )}

            {activeTab === "SECURITY" && <SecurityTab />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminDashboard), { ssr: false });