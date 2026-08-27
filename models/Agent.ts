import mongoose, { Document, Model, Schema } from "mongoose";

export type AgentTier = "Partner" | "Elite" | "Premium" | "Imperial Agent";

export interface IAgent extends Document {
  name: string;
  email: string;
  code: string;
  tier: string;
  commissionRate: number;
  clicks: number;
  sales: number;
  revenue: number;
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema = new Schema<IAgent>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    tier: { type: String, default: "Imperial Agent" },
    commissionRate: { type: Number, default: 5, min: 0 },
    clicks: { type: Number, default: 0, min: 0 },
    sales: { type: Number, default: 0, min: 0 },
    revenue: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const Agent: Model<IAgent> =
  (mongoose.models.Agent as Model<IAgent>) || mongoose.model<IAgent>("Agent", AgentSchema);
