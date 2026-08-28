import mongoose, { Schema, Model, Document } from "mongoose";

export interface IMyrioLearningEvent extends Document {
  predictionId: string;
  targetDomain: "ORDER_DELAY" | "STOCKOUT_RISK" | "PAYMENT_FRAUD" | "CART_ABANDONMENT";
  entityId: string; // Order ID, Product ID, Session ID
  predictedValue: string; // e.g. "DELAY_LIKELY", "STOCKOUT_IN_3_DAYS"
  predictionConfidence: number; // 0.0 - 1.0
  evidenceSignals: string[];
  actualOutcome?: string | null; // e.g. "DELIVERED_ON_TIME", "DELAYED_BY_COURIER"
  isAccurate?: boolean | null;
  evaluationTimestamp?: Date | null;
  learningAdjustmentNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MyrioLearningEventSchema = new Schema<IMyrioLearningEvent>(
  {
    predictionId: { type: String, required: true, unique: true, index: true },
    targetDomain: {
      type: String,
      enum: ["ORDER_DELAY", "STOCKOUT_RISK", "PAYMENT_FRAUD", "CART_ABANDONMENT"],
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    predictedValue: { type: String, required: true },
    predictionConfidence: { type: Number, required: true, min: 0, max: 1 },
    evidenceSignals: { type: [String], default: [] },
    actualOutcome: { type: String, default: null },
    isAccurate: { type: Boolean, default: null, index: true },
    evaluationTimestamp: { type: Date, default: null },
    learningAdjustmentNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

MyrioLearningEventSchema.index({ targetDomain: 1, isAccurate: 1, createdAt: -1 });

export const MyrioLearningEvent: Model<IMyrioLearningEvent> =
  (mongoose.models.MyrioLearningEvent as Model<IMyrioLearningEvent>) ||
  mongoose.model<IMyrioLearningEvent>("MyrioLearningEvent", MyrioLearningEventSchema);

export default MyrioLearningEvent;