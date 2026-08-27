/**
 * GODMODE TYPES
 * ==============
 * Single source of truth for all type definitions.
 * Import from here in ALL components - never redeclare locally.
 */

// Hero Slides
export interface HeroSlide {
  id: number;
  type: "video" | "image";
  url: string;
  heading: string;
}

// About Section Config
export interface AboutConfig {
  content: string;
  alignment: "left" | "center" | "right";
  style: "luxury" | "minimal" | "bold";
  boldWords: string;
}

// UI Configuration
export interface UiConfig {
  primaryColor: string;
  bgColor: string;
  fontFamily: "serif" | "sans-serif" | "monospace";
  buttonRadius: "none" | "sm" | "md" | "lg" | "full";
}

// Social Links
export interface SocialLinks {
  instagram: string;
  facebook: string;
  twitter: string;
  youtube: string;
  linkedin: string;
}

// Corporate Info
export interface CorporateInfo {
  companyName: string;
  address: string;
  phone1: string;
  phone2: string;
  email: string;
}

// Legal Pages
export interface LegalPage {
  id: string;
  title: string;
  slug: string;
  content: string;
}

// Manual Review
export interface ManualReview {
  userName: string;
  comment: string;
  rating: number;
  product: string;
  visibility: "public" | "private" | "pending";
  isAdminGenerated: boolean;
  media: string[];
}

// Amazon Details
export interface AmazonDetail {
  key: string;
  value: string;
}

// SEO Configuration
export interface SeoConfig {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  slug: string;
  noindex: boolean;
  imageAltTexts: Record<string, string>;
}

// Watch Form State
export interface WatchFormState {
  name: string;
  brand: string;
  category: string;
  price: string;
  offerPrice: string;
  stock: string;
  imageUrl: string;
  images: string[];
  videoUrl: string;
  model3DUrl: string;
  description: string;
  seoTags: string;
  specifications: string;
  priority: number;
  badge: string;
  amazonDetails: AmazonDetail[];
  vipVaultKey: string;
  vipDiscount: string;
  transitFee: string;
  taxPercentage: string;
  taxInclusive: boolean;
  seo: SeoConfig;
}

// Coupon Form
export interface CouponForm {
  code: string;
  discountValue: string;
  minOrder: string;
  validUntil: string;
}

// Agent Form
export interface AgentForm {
  name: string;
  email: string;
  code: string;
  tier: "Partner" | "Elite" | "Premium";
  commissionRate: number;
}

// Pricing Rules
export interface PricingRules {
  isAiPricingActive: boolean;
  maxMarkupPercent: number;
  maxDiscountPercent: number;
  lowStockThreshold: number;
  trendingThreshold: number;
}

// Generic API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}