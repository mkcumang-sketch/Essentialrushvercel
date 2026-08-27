import mongoose, { Document, Model, Schema } from "mongoose";

export type LeadStatus = "PENDING" | "ABANDONED" | "OFFER_SENT" | "RECOVERED";

export interface ILead extends Document {
  phone: string;
  userId?: string;
  cartItems: unknown[];
  cartTotal: number;
  status: LeadStatus;
  discountCode: string;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    phone: { type: String, required: true, index: true },
    userId: { type: String, sparse: true, index: true },
    cartItems: { type: [Schema.Types.Mixed], default: [] },
    cartTotal: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      default: "ABANDONED",
      enum: ["PENDING", "ABANDONED", "OFFER_SENT", "RECOVERED"],
    },
    discountCode: { type: String, default: "" },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Lead: Model<ILead> =
  (mongoose.models.Lead as Model<ILead>) || mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
