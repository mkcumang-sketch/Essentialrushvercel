import mongoose from 'mongoose';

// 1. EXTEND EXISTING PRODUCT SCHEMA (Add this block to your existing Product Schema)
/*
  seo: {
    metaTitle: { type: String },
    metaDescription: { type: String },
    focusKeyword: { type: String },
    canonicalUrl: { type: String },
    noindex: { type: Boolean, default: false },
    nofollow: { type: Boolean, default: false },
    ogImage: { type: String },
    customSchema: { type: String } // JSON-LD
  }
*/

// 2. NEW: GLOBAL SEO SETTINGS
const GlobalSeoSchema = new mongoose.Schema({
    siteName: { type: String, default: "Essential | Fine Horology" },
    titleTemplate: { type: String, default: "%s | Essential" },
    defaultDescription: { type: String },
    defaultKeywords: { type: String },
    defaultOgImage: { type: String },
    twitterHandle: { type: String },
    robotsTxtRules: { type: String, default: "User-agent: *\nAllow: /" }
}, { timestamps: true });

// 3. NEW: REDIRECT MANAGER
const RedirectSchema = new mongoose.Schema({
    oldUrl: { type: String, required: true, unique: true },
    newUrl: { type: String, required: true },
    isPermanent: { type: Boolean, default: true }, // true = 301, false = 302
    active: { type: Boolean, default: true }
});

export const GlobalSeo = mongoose.models.GlobalSeo || mongoose.model('GlobalSeo', GlobalSeoSchema);
export const Redirect = mongoose.models.Redirect || mongoose.model('Redirect', RedirectSchema);