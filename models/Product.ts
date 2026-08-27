import mongoose, { Schema, Model, HydratedDocument } from "mongoose";
import type { IAmazonDetail, IProductSeo } from "@/types/commerce";

export interface IProduct {
  name: string;
  slug?: string;
  brand: string;
  category: string;
  price: number;
  offerPrice?: number;
  stock: number;
  totalSold: number;
  description: string;
  imageUrl: string;
  images: string[];
  videoUrl: string;
  model3DUrl: string;
  seoTags: string;
  specifications: string;
  priority: number;
  badge: string;
  amazonDetails: IAmazonDetail[];
  vipVaultKey: string;
  vipDiscount: number;
  transitFee: number;
  taxPercentage: number;
  taxInclusive: boolean;
  seo: Partial<IProductSeo>;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductDocument = HydratedDocument<IProduct>;

const AmazonDetailSchema = new Schema<IAmazonDetail>(
  {
    key: { type: String, default: "", trim: true },
    value: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const SeoSchema = new Schema<Partial<IProductSeo>>(
  {
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    focusKeyword: { type: String, default: "" },
    slug: { type: String, default: "" },
    noindex: { type: Boolean, default: false },
    imageAltTexts: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true, index: true },
    brand: { type: String, default: "Essential Rush", trim: true, index: true },
    category: { type: String, default: "", trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    offerPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    totalSold: { type: Number, default: 0, min: 0 },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    images: { type: [String], default: [] },
    videoUrl: { type: String, default: "" },
    model3DUrl: { type: String, default: "" },
    seoTags: { type: String, default: "" },
    specifications: { type: String, default: "" },
    priority: { type: Number, default: 0 },
    badge: { type: String, default: "" },
    amazonDetails: { type: [AmazonDetailSchema], default: [] },
    vipVaultKey: { type: String, default: "", uppercase: true, trim: true },
    vipDiscount: { type: Number, default: 0, min: 0 },
    transitFee: { type: Number, default: 0, min: 0 },
    taxPercentage: { type: Number, default: 0, min: 0 },
    taxInclusive: { type: Boolean, default: true },
    seo: { type: SeoSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

ProductSchema.index({ brand: 1, category: 1, isActive: 1 });
ProductSchema.index({ createdAt: -1 });

ProductSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  if (!this.imageUrl && this.images?.length) {
    this.imageUrl = this.images[0] ?? "";
  }
  next();
});

export const Product: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct>) ||
  mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
