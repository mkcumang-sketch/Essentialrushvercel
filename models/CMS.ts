import mongoose, { Document, Schema, Model } from 'mongoose';

// ==========================================
// 1. TYPESCRIPT INTERFACES
// ==========================================
export interface IHeroSlide {
  type: 'image' | 'video';
  url: string;
  heading?: string;
}

export interface IFAQItem {
  q: string;
  a: string;
}

export interface IUIConfig {
  primaryColor?: string;
  backgroundColor?: string;
  theme?: 'light' | 'dark';
}

export interface IAboutConfig {
  title: string;
  content: string;
  alignment?: 'left' | 'center' | 'right';
  boldWords?: string;
}

export interface ICMSDocument extends Document {
  type: string;
  uiConfig: IUIConfig;
  aboutConfig: IAboutConfig;
  heroSlides: IHeroSlide[];
  galleryImages: string[];
  promotionalVideos: string[];
  faqs: IFAQItem[];
  visionaries: any[];
  categories: string[];
  socialLinks?: any;
  corporateInfo?: any;
  legalPages?: any[];
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 2. SUB-SCHEMAS
// ==========================================
const FAQItemSchema = new Schema({
  q: { type: String, default: '' },
  a: { type: String, default: '' }
}, { _id: false });

const VisionarySchema = new Schema({
  name: { type: String, default: '' },
  role: { type: String, default: '' },
  image: { type: String, default: '' },
  bio: { type: String, default: '' }
}, { _id: false });

const LegalPageSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, default: '' },
  slug: { type: String, default: '' },
  content: { type: String, default: '' }
}, { _id: false });

// ==========================================
// 3. MAIN SCHEMA (Fixed TS Mismatch Error)
// ==========================================
// 🚀 Removed <ICMSDocument> from here to prevent strict internal schema clashes
const CMSSchema = new Schema(
  {
    type: { 
      type: String, 
      default: 'global' 
    },
    uiConfig: { 
      type: Schema.Types.Mixed, 
      default: {} 
    },
    aboutConfig: { 
      type: Schema.Types.Mixed, 
      default: {} 
    },
    heroSlides: { 
      type: [Schema.Types.Mixed], 
      default: [] 
    },
    galleryImages: { 
      type: [String], 
      default: [] 
    },
    promotionalVideos: {
      type: [String],
      default: []
    },
    faqs: { 
      type: [FAQItemSchema],
      default: [] 
    },
    visionaries: { 
      type: [VisionarySchema],
      default: [] 
    },
    categories: { 
      type: [String], 
      default: [] 
    },
    socialLinks: {
      type: Schema.Types.Mixed,
      default: {}
    },
    corporateInfo: {
      type: Schema.Types.Mixed,
      default: {}
    },
    legalPages: {
      type: [LegalPageSchema],
      default: []
    }
  }, 
  { 
    strict: false, 
    timestamps: true 
  }
);

// 🚀 Generic is still applied here so the rest of your app knows exactly what data to expect
const CMS: Model<ICMSDocument> = mongoose.models.CMS as mongoose.Model<ICMSDocument>|| mongoose.model<ICMSDocument>('CMS', CMSSchema);

export { CMS };