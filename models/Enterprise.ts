import mongoose, { Schema, model, models } from "mongoose";

// 1. PRODUCT SCHEMA
const productSchema = new Schema({
  name: { type: String, required: true, index: true },
  slug: { type: String, unique: true, required: true, index: true },
  sku: { type: String, unique: true, required: true, index: true },
  brand: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  price: { type: Number, required: true, index: true },
  compareAtPrice: { type: Number, default: 0 },
  costPrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0, index: true },
  description: String,
  shortDescription: String,
  images: [String],
  imageUrl: String, 
  videoUrl: String, 
  movement: { type: String, default: "Swiss Automatic" },
  caseMaterial: { type: String, default: "Oystersteel" },
  specifications: [{ label: String, value: String }],
  tags: [String],
  gender: { type: String, enum: ['Men', 'Women', 'Unisex'], default: 'Unisex' },
  rankingScore: { type: Number, default: 0, index: true },
  adminPriority: { type: Number, default: 0 },
  salesVelocity: { type: Number, default: 0 },
  clickRate: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
}, { timestamps: true });

// 2. HOMEPAGE BUILDER SCHEMA
const sectionSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['Hero', 'BrandTicker', 'Vault', 'Heritage', 'Gallery', 'Testimonials', 'Faq', 'Banner'], required: true },
  content: { type: Schema.Types.Mixed, default: {} },
  styleConfig: { theme: { type: String, default: 'dark' }, paddingY: { type: String, default: 'py-24' }, background: String, isVisible: { type: Boolean, default: true } },
  order: { type: Number, default: 0, index: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// 3. ORDER SCHEMA
const orderSchema = new Schema({
  orderNumber: { type: String, unique: true, index: true },
  clientName: { type: String, required: true },
  clientPhone: { type: String, required: true },
  items: [{ product: { type: Schema.Types.ObjectId, ref: 'Product' }, name: String, qty: Number, priceAtPurchase: Number }],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'] },
  paymentMethod: { type: String, default: 'Concierge Wire' },
  trackingId: String,
}, { timestamps: true });

// 4. CUSTOMER SCHEMA
const customerSchema = new Schema({
  name: String, email: { type: String, unique: true, sparse: true }, phone: { type: String, unique: true, index: true },
  totalSpent: { type: Number, default: 0 }, loyaltyTier: { type: String, default: 'New' },
  wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }], lastActive: Date
}, { timestamps: true });

// 5. LEAD SCHEMA
const leadSchema = new Schema({
  name: { type: String, required: true }, phone: { type: String, required: true },
  product: String, status: { type: String, default: 'New' },
}, { timestamps: true });

// 6. LOG SCHEMA
const logSchema = new Schema({
  admin: { type: String, default: 'System' }, action: { type: String, required: true },
  target: String, details: String, ip: String,
}, { timestamps: true });

// 7. SYSTEM SETTINGS SCHEMA
const settingsSchema = new Schema({
  configId: { type: String, default: 'global_config' }, siteName: { type: String, default: 'Essential Luxury' },
  maintenanceMode: { type: Boolean, default: false }, globalPromo: String, currency: { type: String, default: 'INR' },
}, { timestamps: true });

// 8. CMS SCHEMA (🚨 ADDED THIS TO FIX BUILD ERROR)
const cmsSchema = new Schema({
  configId: { type: String, default: "global_config" },
  heroTitle: { type: String, default: "Curators of Time." },
  heroSubtitle: { type: String, default: "ESTABLISHED 2026" },
  promoBanner: { type: String, default: "LIMITED ALLOCATIONS AVAILABLE" },
}, { timestamps: true });

// EXPORTS
// --- EXPORTS ---
export const Product = models.Product || model("Product", productSchema);
export const HomepageSection = models.HomepageSection || model("HomepageSection", sectionSchema);
export const Order = models.Order || model("Order", orderSchema);
export const Customer = models.Customer || model("Customer", customerSchema);
export const Lead = models.Lead || model("Lead", leadSchema);
export const ActivityLog = models.ActivityLog || model("ActivityLog", logSchema);
export const SystemSetting = models.SystemSetting || model("SystemSetting", settingsSchema);

// 🚨 FIXED: Exporting both variations to ensure no import ever breaks
export const CMS = models.CMS || model("CMS", cmsSchema);
export const cms = models.cms || model("cms", cmsSchema);