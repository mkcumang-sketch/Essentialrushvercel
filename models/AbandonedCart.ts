import mongoose, { Document, Schema, Model } from "mongoose";

export interface ICartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IAbandonedCart extends Document {
  name: string;
  email?: string;
  phone: string;
  items: ICartItem[];
  cartTotal: number;
  status: "ABANDONED" | "RECOVERED" | "CONVERTED";
  checkoutStep?: "CONTACT" | "SHIPPING" | "PAYMENT";
  recoveryCount: number;
  lastContactedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const AbandonedCartSchema = new Schema<IAbandonedCart>(
  {
    name: { type: String, default: "Vault Client", trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    items: { type: [CartItemSchema], default: [] },
    cartTotal: { type: Number, required: true, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["ABANDONED", "RECOVERED", "CONVERTED"],
      default: "ABANDONED",
    },
    checkoutStep: {
      type: String,
      enum: ["CONTACT", "SHIPPING", "PAYMENT"],
      default: "CONTACT",
    },
    recoveryCount: { type: Number, default: 0 },
    lastContactedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup & recovery cron jobs
AbandonedCartSchema.index({ phone: 1 });
AbandonedCartSchema.index({ email: 1 });
AbandonedCartSchema.index({ status: 1, createdAt: -1 });

export const AbandonedCart: Model<IAbandonedCart> =
  mongoose.models.AbandonedCart ||
  mongoose.model<IAbandonedCart>("AbandonedCart", AbandonedCartSchema);

export default AbandonedCart;