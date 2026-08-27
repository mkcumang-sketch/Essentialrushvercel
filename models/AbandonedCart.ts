import mongoose, { Document, Schema, Model } from "mongoose";

interface IAbandonedCart extends Document {
  name: string;
  email: string;
  phone: string;
  cartTotal: number;
  status: "ABANDONED" | "RECOVERED" | "CONVERTED";
  createdAt: Date;
  updatedAt?: Date;
}

const AbandonedCartSchema = new Schema<IAbandonedCart>(
  {
    name: { type: String, default: "Vault Client", trim: true },
    email: { type: String, default: "", lowercase: true },
    phone: { type: String, default: "", required: true },
    cartTotal: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["ABANDONED", "RECOVERED", "CONVERTED"],
      default: "ABANDONED",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for faster queries
AbandonedCartSchema.index({ phone: 1 });
AbandonedCartSchema.index({ email: 1 });
AbandonedCartSchema.index({ createdAt: -1 });

export const AbandonedCart =
  (mongoose.models.AbandonedCart as Model<IAbandonedCart>) ||
  mongoose.model<IAbandonedCart>("AbandonedCart", AbandonedCartSchema);

export type { IAbandonedCart };