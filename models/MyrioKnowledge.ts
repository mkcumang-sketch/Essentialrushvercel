import mongoose, { Schema, models, model } from "mongoose";

export interface IMyrioKnowledgeRule {
  triggerQuery: string;
  responseGuideline: string;
  tone: "Diplomatic" | "Assertive" | "Luxury Concierge" | "Technical";
  category: "OBJECTION" | "PRICING" | "AUTHENTICITY" | "GENERAL";
  isActive: boolean;
  createdAt: Date;
}

const MyrioKnowledgeSchema = new Schema<IMyrioKnowledgeRule>(
  {
    triggerQuery: { type: String, required: true },
    responseGuideline: { type: String, required: true },
    tone: { type: String, default: "Luxury Concierge" },
    category: { type: String, default: "GENERAL" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const MyrioKnowledge =
  models.MyrioKnowledge || model<IMyrioKnowledgeRule>("MyrioKnowledge", MyrioKnowledgeSchema);