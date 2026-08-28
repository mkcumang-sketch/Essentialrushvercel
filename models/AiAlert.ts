import mongoose, { Schema, Model, Document } from "mongoose";

export type AlertCategory =
  | "SECURITY"
  | "ORDERS"
  | "PAYMENTS"
  | "INVENTORY"
  | "CUSTOMERS"
  | "PERFORMANCE"
  | "SEO"
  | "SYSTEM"
  | "BUSINESS";

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface IAiAlert extends Document {
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  impact: string;
  aiAnalysis: string;
  recommendedAction: string;
  affectedEntityId?: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AiAlertSchema = new Schema<IAiAlert>(
  {
    category: {
      type: String,
      enum: [
        "SECURITY",
        "ORDERS",
        "PAYMENTS",
        "INVENTORY",
        "CUSTOMERS",
        "PERFORMANCE",
        "SEO",
        "SYSTEM",
        "BUSINESS",
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    impact: { type: String, required: true },
    aiAnalysis: { type: String, required: true },
    recommendedAction: { type: String, required: true },
    affectedEntityId: { type: String, default: null, index: true },
    isRead: { type: Boolean, default: false, index: true },
    isResolved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

AiAlertSchema.index({ isResolved: 1, severity: 1, createdAt: -1 });

export const AiAlert: Model<IAiAlert> =
  (mongoose.models.AiAlert as Model<IAiAlert>) ||
  mongoose.model<IAiAlert>("AiAlert", AiAlertSchema);

export default AiAlert;