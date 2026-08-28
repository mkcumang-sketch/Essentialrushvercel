"use client";

import React, {
  useState,
  useEffect,
  useCallback,
} from "react";

import { AnimatePresence } from "framer-motion";
import MyrioHealthTab from "@/components/godmode/tabs_temp/MyrioHealthTab";
import MyrioLearningTab from "@/components/godmode/tabs_temp/MyrioLearningTab";

import {
  BarChart3,
  Package,
  Landmark,
  Users,
  RefreshCcw,
  Layout,
  Link as LinkIcon,
  ShieldCheck,
  BellRing,
  Truck,
  Gift,
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
} from "lucide-react";

import dynamic from "next/dynamic";
import { useSession, signIn, signOut } from "next-auth/react";
import BrandAmbassadors from "@/components/godmode/tabs_temp/BrandAmbassadorsTab";
import CustomersCrm from "@/components/godmode/tabs_temp/CustomersCrm";
import CouponMarketingTab from "@/components/godmode/tabs_temp/CouponMarketing";
import DashboardTab from "@/components/godmode/tabs_temp/DashboardTab";
import InventoryTab from "@/components/godmode/tabs_temp/InventoryTab";
import OrderTrackerTab from "@/components/godmode/tabs_temp/OrderTrackerTab";
import SeoEngineTab from "@/components/godmode/tabs_temp/SeoEngineTab";
import LegalPagesTab from "@/components/godmode/tabs_temp/LegalPagesTab";
import ReviewsTab from "@/components/godmode/tabs_temp/ReviewsTab";
import MyrioArchiveTab from "@/components/godmode/tabs_temp/MyrioArchiveTab";
import SalesForceTab from "@/components/godmode/tabs_temp/SalesForceTab";
import SecurityTab from "@/components/godmode/tabs_temp/SecurityTab";
import WebsiteBuilderTab from "@/components/godmode/tabs_temp/WebsiteBuilderTab";
import WithdrawalTab from "@/components/godmode/tabs_temp/WithdrawalTab";

import AiCommandCenterTab from "@/components/godmode/tabs_temp/AiCommandCenterTab";

// =====================================================
// TYPES
// =====================================================
import type {
  HeroSlide,
  AboutConfig,
  UiConfig,

  SocialLinks,
  CorporateInfo,
  LegalPage,
  ManualReview,
  WatchFormState,
  CouponForm,
  AgentForm,
  PricingRules,
} from "@/types/godmode";

// =====================================================
// MODULES
// =====================================================

const MODULES = [
  { id: "FULL_DASHBOARD", icon: BarChart3, label: "Main Dashboard" },
  { id: "MYRIO_ARCHIVE", icon: Archive, label: "MYRIO Data Lifecycle" },
  { id: "AI_COMMAND_CENTER", icon: Zap, label: "AI Command Center" },
  { id: "INVENTORY", icon: Package, label: "Products & Inventory" },
  { id: "COUPONS", label: "Coupons & Offers", icon: Tag },
  { id: "ORDER_TRACKER", icon: Truck, label: "Manage Orders" },
  { id: "MYRIO_LEARNING", icon: Brain, label: "MYRIO Learning Center" },
  { id: "CRM", icon: Users, label: "Customers & CRM" },
  { id: "PAGE_BUILDER", icon: Layout, label: "Website Builder" },
  { id: "AMBASSADORS", icon: Award, label: "Brand Ambassadors" },
  { id: "SEO_ENGINE", icon: Globe, label: "SEO Command Center" },
  { id: "LEGAL_PAGES", icon: FileText, label: "Legal Policies" },
  { id: "MYRIO_HEALTH", icon: Activity, label: "MYRIO Self-Health" },
  { id: "REVIEWS", icon: Star, label: "Customer Reviews" },
  { id: "SALES_FORCE", icon: LinkIcon, label: "Affiliates & Partners" },
  { id: "WITHDRAWALS", icon: Landmark, label: "Withdrawal Requests" },
  { id: "SECURITY", icon: ShieldAlert, label: "Security & Maintenance" },
];

const DEFAULT_GALLERY: string[] = [];

// =====================================================
// PREMIUM UPLOAD NODE
// =====================================================

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

  const [inputId] = useState(
    `up-${Math.random().toString(36).substring(2, 11)}`
  );

  const handleUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    onUploadStateChange?.(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.url) {
        setPreview(data.url);
        onUploadSuccess(data.url);
      } else {
        console.error(`Upload failed: ${data.error || "Check Cloudinary Keys"}`);
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
        e.stopPropagation();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleUpload(file);
      }}
      className={`w-28 h-28 shrink-0 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center p-3 cursor-pointer group ${
        dragging
          ? "border-[#D4AF37] bg-[#D4AF37]/10"
          : "border-white/20 bg-black/40 backdrop-blur-md"
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

      <label
        htmlFor={inputId}
        className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <RefreshCcw size={22} className="animate-spin text-[#D4AF37]" />
            <span className="text-[9px] text-gray-400">Uploading...</span>
          </div>
        ) : preview ? (
          isVideo ? (
            <video
              src={preview}
              className="w-full h-full object-cover rounded-xl"
              muted
              autoPlay
              loop
            />
          ) : (
            <img
              src={preview}
              alt="Uploaded preview"
              className="w-full h-full object-cover rounded-xl"
            />
          )
        ) : (
          <>
            <span className="text-xl mb-2">{dragging ? "↓" : "↑"}</span>
            <span className="text-[9px] text-gray-400">
              {dragging ? "Drop File" : `Upload ${placeholder}`}
            </span>
          </>
        )}
      </label>
    </div>
  );
};

// =====================================================
// ADMIN DASHBOARD
// =====================================================

function AdminDashboard() {
  const { data: session, status } = useSession();

  const [isImageUploading, setIsImageUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("FULL_DASHBOARD");
  const [dashboardView, setDashboardView] = useState<"orders" | "abandoned">(
    "orders"
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "System initialized. Production environment connected.",
  ]);
  const [leads, setLeads] = useState<any[]>([]);
  const [vipDispatchingKey, setVipDispatchingKey] = useState<string | null>(
    null
  );
  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [liveWatches, setLiveWatches] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [fullAnalytics, setFullAnalytics] = useState<any>(null);
  const [celebs, setCelebs] = useState<any[]>([]);
  const [newCeleb, setNewCeleb] = useState({
    name: "",
    title: "",
    imageUrl: "",
  });

  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([
    {
      id: 1,
      type: "video",
      url: "",
      heading: "Welcome to Essential",
    },
  ]);

  const [aboutConfig, setAboutConfig] = useState<AboutConfig>({
    content: "",
    alignment: "center",
    style: "luxury",
    boldWords: "",
  });

  const [galleryImages, setGalleryImages] =
    useState<string[]>(DEFAULT_GALLERY);

  const [promoVideos, setPromoVideos] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
  ]);

  const [uiConfig, setUiConfig] = useState<UiConfig>({
    primaryColor: "#D4AF37",
    bgColor: "#050505",
    fontFamily: "serif",
    buttonRadius: "full",
  });

  const [categories, setCategories] = useState<string[]>([
    "Investment Grade",
    "Rare Vintage",
    "Modern Complications",
  ]);

  const [faqs, setFaqs] = useState([
    { q: "Are these authentic?", a: "Yes, 100% verified." },
  ]);

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: "",
    facebook: "",
    twitter: "",
    youtube: "",
    linkedin: "",
  });

  const [corporateInfo, setCorporateInfo] = useState<CorporateInfo>({
    companyName: "Essential Rush Pvt Ltd",
    address: "",
    phone1: "",
    phone2: "",
    email: "",
  });

  const [legalPages, setLegalPages] = useState<LegalPage[]>([
    {
      id: "1",
      title: "Privacy Policy",
      slug: "privacy-policy",
      content: "",
    },
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
    seo: {
      metaTitle: "",
      metaDescription: "",
      focusKeyword: "",
      slug: "",
      noindex: false,
      imageAltTexts: {},
    },
  });

  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

  const [agentForm, setAgentForm] = useState<AgentForm>({
    name: "",
    email: "",
    code: "",
    tier: "Partner",
    commissionRate: 5,
  });

  const addLog = useCallback((msg: string) => {
    setSystemLogs((prev) => [msg, ...prev].slice(0, 8));
  }, []);

  const handleAdminLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error(error);
    }
    await signOut({ callbackUrl: "/" });
  };

  const fetchDashboardData = useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsSyncing(true);
        addLog("Syncing real-time database modules...");
      }

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
          fetch(`/api/abandoned-carts?t=${ts}`).then((r) =>
            r.ok ? r.json() : { leads: [] }
          ),
          fetch(`/api/cms?t=${ts}`).then((r) =>
            r.ok ? r.json() : { data: null }
          ),
          fetch(`/api/products?t=${ts}`).then((r) =>
            r.ok ? r.json() : { data: [] }
          ),
          fetch(`/api/agents?t=${ts}`).then((r) =>
            r.ok ? r.json() : { data: [] }
          ),
          fetch(`/api/orders?t=${ts}`).then((r) =>
            r.ok ? r.json() : { data: [] }
          ),
          fetch(`/api/dashboard/full-analytics?t=${ts}`).then((r) =>
            r.ok ? r.json() : null
          ),
          fetch(`/api/reviews?admin=true&t=${ts}`).then((r) =>
            r.ok ? r.json() : { data: [] }
          ),
          fetch(`/api/coupons?t=${ts}`).then((r) =>
            r.ok ? r.json() : { data: [] }
          ),
          fetch(`/api/customers?t=${ts}`)
            .then((r) => (r.ok ? r.json() : { data: [] }))
            .catch(() => ({ data: [] })),
          fetch(`/api/celebrity?t=${ts}`).then((r) =>
            r.ok ? r.json() : { data: [] }
          ),
        ]);

        if (resLeads.leads) setLeads(resLeads.leads);

        if (resProducts.data) {
          setLiveWatches(
            resProducts.data
              .filter((w: any) => w && w._id)
              .sort(
                (a: any, b: any) => (b.priority || 0) - (a.priority || 0)
              )
          );
        }

        if (resAgents.data) setAgents(resAgents.data);
        if (resOrders.data) setOrders(resOrders.data);
        if (resAnalytics && resAnalytics.success) setFullAnalytics(resAnalytics);
        if (resCelebs.data) setCelebs(resCelebs.data);
        if (resMarketing.data) setCoupons(resMarketing.data);
        if (resCust.data) setCustomers(resCust.data);

        if (resReviews.data) {
          const sortedRevs = resReviews.data.sort((a: any, b: any) => {
            if (a.visibility === "pending" && b.visibility !== "pending") return -1;
            if (b.visibility === "pending" && a.visibility !== "pending") return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          setAllReviews(sortedRevs);
        }

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
      } catch (error) {
        console.error("Dashboard Sync Error:", error);
        if (!silent) addLog("Error: Database connection disrupted.");
      } finally {
        if (!silent) setIsSyncing(false);
      }
    },
    [addLog]
  );

  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") {
      fetchDashboardData();
    }
  }, [session, fetchDashboardData]);

  const handleSaveCMS = async () => {
    setIsSyncing(true);
    addLog("Pushing UI configuration to database...");
    try {
      const res = await fetch("/api/cms", {
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
      if (!res.ok) throw new Error("CMS save failed");
      addLog("CMS sync complete.");
    } catch (error) {
      console.error(error);
      addLog("Failed to save settings.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveAgent = async () => {
    if (!agentForm.name || !agentForm.code) {
      addLog("Name and Code are required!");
      return;
    }
    setIsSyncing(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentForm),
      });
      if (!res.ok) throw new Error("Failed to save affiliate");
      addLog("Affiliate system updated.");
      setIsAgentModalOpen(false);
      setAgentForm({ name: "", email: "", code: "", tier: "Partner", commissionRate: 5 });
      fetchDashboardData(true);
    } catch (error) {
      console.error(error);
      addLog("Failed to save affiliate.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteAffiliate = async (id: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/agents?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      addLog("Affiliate deleted from system.");
      fetchDashboardData(true);
    } catch (error) {
      console.error(error);
      addLog("Failed to delete affiliate.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddManualReview = async () => {
    if (!manualReview.userName || !manualReview.comment) {
      addLog("Client Alias and Feedback are required!");
      return;
    }
    setIsSyncing(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualReview),
      });
      if (!res.ok) throw new Error("Failed to inject review");
      addLog("Manual review injected.");
      setManualReview({
        userName: "",
        comment: "",
        rating: 5,
        product: "GLOBAL",
        visibility: "public",
        isAdminGenerated: true,
        media: [],
      });
      fetchDashboardData(true);
    } catch (error) {
      console.error(error);
      addLog("Failed to compile review.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateReviewStatus = async (id: string, newVisibility: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, visibility: newVisibility }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      addLog(`Feedback stream updated (${newVisibility}).`);
      fetchDashboardData(true);
    } catch (error) {
      console.error(error);
      addLog("Failed to update review status.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete review");
      addLog("Feedback erased from system.");
      fetchDashboardData(true);
    } catch (error) {
      console.error(error);
      addLog("Failed to erase review.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono text-xs uppercase tracking-widest">
        Authenticating Secure Vault Node...
      </div>
    );
  }

  if (!session || session.user?.role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <button
          onClick={() => signIn("google")}
          className="bg-[#D4AF37] text-black px-12 py-5 rounded-full font-bold tracking-widest uppercase cursor-pointer hover:bg-white transition-all shadow-xl"
        >
          Admin Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex font-sans">
      <div className="fixed inset-0 pointer-events-none z-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-[300px] bg-black/60 backdrop-blur-2xl border-r border-white/10 flex-col z-50">
        <div className="p-8 border-b border-white/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
            <ShieldCheck size={20} />
          </div>

          <div className="overflow-hidden">
            <p className="text-[9px] text-[#00F0FF] font-bold uppercase tracking-widest">
              <Activity size={10} className="inline animate-pulse" /> System Secured
            </p>
            <h1 className="text-sm font-bold truncate">
              {session.user?.name}
            </h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => setActiveTab(module.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                  activeTab === module.id
                    ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} />
                  {module.label}
                </div>
                {activeTab === module.id && <ChevronRight size={14} />}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/10">
          <button
            onClick={handleAdminLogout}
            className="w-full py-3.5 text-red-400 text-[10px] font-bold uppercase tracking-widest border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white flex justify-center items-center gap-2 transition-all cursor-pointer"
          >
            <Lock size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 p-4 md:p-8 lg:p-12 relative z-10 overflow-y-auto">
        {/* MOBILE NAV TABS */}
        <div className="lg:hidden flex overflow-x-auto gap-2 pb-4 mb-6 border-b border-white/10">
          {MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => setActiveTab(module.id)}
                className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest ${
                  activeTab === module.id
                    ? "bg-[#D4AF37] text-black"
                    : "bg-white/5 text-gray-400 border border-white/10"
                }`}
              >
                <Icon size={14} />
                {module.label}
              </button>
            );
          })}
        </div>

        {/* HEADER */}
        <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-10 border-b border-white/10 pb-6 gap-4">
          <h2 className="text-2xl md:text-4xl font-serif">
            {MODULES.find((module) => module.id === activeTab)?.label}
          </h2>

          <div className="flex gap-3">
            <button
              onClick={() => fetchDashboardData(false)}
              className="px-5 py-3.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
            >
              <RefreshCcw
                size={15}
                className={isSyncing ? "animate-spin" : ""}
              />
              Sync Telemetry
            </button>
          </div>
        </header>

        {/* TAB ROUTING */}
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
{activeTab === "MYRIO_ARCHIVE" && <MyrioArchiveTab />}
          {activeTab === "INVENTORY" && (
            <InventoryTab
              watchForm={watchForm}
              setWatchForm={setWatchForm}
              handleSaveProduct={async () => {}}
              liveWatches={liveWatches}
              handleDeleteProduct={async () => {}}
              PremiumUploadNode={PremiumUploadNode}
              setIsImageUploading={setIsImageUploading}
            />
          )}

          {activeTab === "CRM" && <CustomersCrm customers={customers} />}
{activeTab === "MYRIO_HEALTH" && <MyrioHealthTab />}
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

          {activeTab === "REVIEWS" && (
            <ReviewsTab
              manualReview={manualReview}
              setManualReview={setManualReview}
              handleAddManualReview={handleAddManualReview}
              allReviews={allReviews}
              handleUpdateReviewStatus={handleUpdateReviewStatus}
              handleDeleteReview={handleDeleteReview}
              PremiumUploadNode={PremiumUploadNode}
            />
          )}
          {activeTab === "MYRIO_LEARNING" && <MyrioLearningTab />}

          {activeTab === "SALES_FORCE" && (
            <SalesForceTab
              agents={agents}
              setIsAgentModalOpen={setIsAgentModalOpen}
              handleDeleteAffiliate={handleDeleteAffiliate}
            />
          )}

          {activeTab === "COUPONS" && <CouponMarketingTab />}
          {activeTab === "SECURITY" && <SecurityTab />}
          {activeTab === "WITHDRAWALS" && <WithdrawalTab />}

          {activeTab === "ORDER_TRACKER" && (
            <OrderTrackerTab
              orders={orders}
              exportToCSV={() => {}}
              handleUpdateOrderStatus={async () => {}}
              handleUpdateTracking={async () => {}}
              setSelectedOrder={setSelectedOrder}
              handleDeleteOrder={async () => {}}
            />
          )}
        </AnimatePresence>

        {/* AFFILIATE / AGENT MODAL */}
        {isAgentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-serif text-[#D4AF37] mb-4">Add New Affiliate</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#D4AF37] text-sm"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={agentForm.email}
                  onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#D4AF37] text-sm"
                />
                <input
                  type="text"
                  placeholder="Custom Code (e.g., VIP50)"
                  value={agentForm.code}
                  onChange={(e) => setAgentForm({ ...agentForm, code: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#D4AF37] text-sm uppercase"
                />
                <div className="flex gap-4">
                  <select
                    value={agentForm.tier}
                    onChange={(e) => setAgentForm({ ...agentForm, tier: e.target.value as any })}
                    className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#D4AF37] text-sm"
                  >
                    <option value="Partner">Partner</option>
                    <option value="VIP">VIP</option>
                    <option value="Master">Master</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Comm. %"
                    value={agentForm.commissionRate}
                    onChange={(e) => setAgentForm({ ...agentForm, commissionRate: Number(e.target.value) })}
                    className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#D4AF37] text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsAgentModalOpen(false)}
                  className="flex-1 py-3 border border-white/20 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAgent}
                  className="flex-1 py-3 bg-[#D4AF37] text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  {isSyncing ? <RefreshCcw size={14} className="animate-spin" /> : null}
                  Save Affiliate
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminDashboard), {
  ssr: false,
});