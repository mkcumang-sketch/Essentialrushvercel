import mongoose, { Document, Model, Schema } from "mongoose";

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  offerPrice?: number;
  quantity: number;
  imageUrl?: string;
  brand?: string;
  category?: string;
  badge?: string;
  slug?: string;
  stock?: number;
}

export interface IUserBehavior extends Document {
  userId?: mongoose.Types.ObjectId | null;
  sessionId: string;
  productScores: Map<string, number>;
  categoryScores: Map<string, number>;
  recentlyViewed: mongoose.Types.ObjectId[];
  cartAbandons: CartItem[];
  referralCode?: string;
  commissionPercentage: number;
  agentRef?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<CartItem>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    offerPrice: { type: Number, default: undefined },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    imageUrl: { type: String, default: "" },
    brand: { type: String, default: "" },
    category: { type: String, default: "" },
    badge: { type: String, default: "" },
    slug: { type: String, default: "" },
    stock: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserBehaviorSchema = new Schema<IUserBehavior>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    productScores: {
      type: Map,
      of: Number,
      default: {},
    },
    categoryScores: {
      type: Map,
      of: Number,
      default: {},
    },
    recentlyViewed: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    cartAbandons: {
      type: [CartItemSchema],
      default: [],
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    commissionPercentage: {
      type: Number,
      default: 5,
    },
    agentRef: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

UserBehaviorSchema.index({ agentRef: 1, updatedAt: -1 });
UserBehaviorSchema.index({ updatedAt: -1 });

export const UserBehavior: Model<IUserBehavior> =
  (mongoose.models.UserBehavior as Model<IUserBehavior>) ||
  mongoose.model<IUserBehavior>("UserBehavior", UserBehaviorSchema);

export default UserBehavior;