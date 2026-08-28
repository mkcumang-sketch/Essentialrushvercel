import mongoose, { Schema, Model, Document } from "mongoose";

export type MemoryLayer =
  | "SHORT_TERM"
  | "OPERATIONAL"
  | "HISTORICAL"
  | "BUSINESS_KNOWLEDGE"
  | "LEARNING";

export type DataCategory =
  | "PRODUCT"
  | "ORDER"
  | "SHIPPING"
  | "POLICY"
  | "SECURITY"
  | "CUSTOMER"
  | "INVENTORY"
  | "SYSTEM";

export interface IMyrioMemory extends Document {
  memoryKey: string;
  layer: MemoryLayer;
  category: DataCategory;
  title: string;
  content: string;
  derivedInsight: string;
  source: string; // e.g. "LIVE_DB", "ADMIN_RULE", "HISTORICAL_EVAL"
  confidenceScore: number; // 0.0 - 1.0
  importanceScore: number; // 1 - 10
  accessPermission: "PUBLIC" | "CUSTOMER_AUTH" | "STAFF" | "SUPER_ADMIN";
  expiresAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MyrioMemorySchema = new Schema<IMyrioMemory>(
  {
    memoryKey: { type: String, required: true, unique: true, index: true },
    layer: {
      type: String,
      enum: ["SHORT_TERM", "OPERATIONAL", "HISTORICAL", "BUSINESS_KNOWLEDGE", "LEARNING"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["PRODUCT", "ORDER", "SHIPPING", "POLICY", "SECURITY", "CUSTOMER", "INVENTORY", "SYSTEM"],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    derivedInsight: { type: String, default: "" },
    source: { type: String, required: true },
    confidenceScore: { type: Number, required: true, min: 0, max: 1, default: 0.9 },
    importanceScore: { type: Number, required: true, min: 1, max: 10, default: 5 },
    accessPermission: {
      type: String,
      enum: ["PUBLIC", "CUSTOMER_AUTH", "STAFF", "SUPER_ADMIN"],
      default: "SUPER_ADMIN",
      index: true,
    },
    expiresAt: { type: Date, default: null, index: { expires: 0 } },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

MyrioMemorySchema.index({ layer: 1, category: 1, isActive: 1 });
MyrioMemorySchema.index({ importanceScore: -1 });

export const MyrioMemory: Model<IMyrioMemory> =
  (mongoose.models.MyrioMemory as Model<IMyrioMemory>) ||
  mongoose.model<IMyrioMemory>("MyrioMemory", MyrioMemorySchema);

export default MyrioMemory;