import mongoose, { Schema, Model, HydratedDocument } from "mongoose";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types/commerce";

export interface IOrderItem {
  productId?: string;
  name: string;
  price?: number;
  qty?: number;
  quantity?: number;
  imageUrl?: string;
}

export interface ICustomer {
  email: string;
  name?: string;
  phone?: string;
}

export interface IShippingData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
}

export interface IOrder {
  orderId: string;
  userId?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentReceiptUrl?: string;
  items: IOrderItem[];
  customer: ICustomer;
  shippingData?: IShippingData;
  totalAmount: number;
  trackingId?: string;
  couponCode?: string;
  referralCode?: string;
  appliedReferralCode?: string;
  discountApplied: number;
  isRewardCredited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderDocument = HydratedDocument<IOrder>;

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String },
    name: { type: String, required: true },
    price: { type: Number, min: 0 },
    qty: { type: Number, min: 1 },
    quantity: { type: Number, min: 1, default: 1 },
    imageUrl: { type: String, default: "" },
  },
  { _id: false }
);

const CustomerSchema = new Schema<ICustomer>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

const ShippingDataSchema = new Schema<IShippingData>(
  {
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    pincode: { type: String },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, index: true },
    status: {
      type: String,
      enum: ["Pending", "PENDING_PAYMENT", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "PENDING_PAYMENT", "Paid", "Failed"],
      default: "Pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "BANK_TRANSFER"],
    },
    paymentReceiptUrl: { type: String, default: "" },
    items: { type: [OrderItemSchema], required: true },
    customer: { type: CustomerSchema, required: true },
    shippingData: { type: ShippingDataSchema },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },
    trackingId: { type: String },
    couponCode: { type: String, uppercase: true, trim: true },
    referralCode: { type: String, uppercase: true, trim: true },
    appliedReferralCode: { type: String, uppercase: true, trim: true },
    discountApplied: { type: Number, default: 0, min: 0 },
    isRewardCredited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

OrderSchema.index({ "customer.email": 1, createdAt: -1 });
OrderSchema.index({ status: 1, paymentStatus: 1 });

export const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) ||
  mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
