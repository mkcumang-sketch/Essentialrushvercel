import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPricingRule extends Document {
  isAiPricingActive: boolean;
  maxMarkupPercent: number;
  maxDiscountPercent: number;
  lowStockThreshold: number;
  trendingThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const PricingRuleSchema = new Schema<IPricingRule>(
  {
    isAiPricingActive: { type: Boolean, default: true },
    maxMarkupPercent: { type: Number, default: 15, min: 0 },
    maxDiscountPercent: { type: Number, default: 10, min: 0 },
    lowStockThreshold: { type: Number, default: 3, min: 0 },
    trendingThreshold: { type: Number, default: 10, min: 0 },
  },
  { timestamps: true }
);

const PricingRule: Model<IPricingRule> =
  (mongoose.models.PricingRule as Model<IPricingRule>) ||
  mongoose.model<IPricingRule>("PricingRule", PricingRuleSchema);

export default PricingRule;
