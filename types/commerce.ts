import type { UserRole } from "@/types/next-auth";
import type { SeoData } from "@/types/seo";

export type { UserRole, SeoData };

export type OrderStatus =
  | "ORDER_CREATED"
  | "PENDING_PAYMENT"
  | "PAYMENT_VERIFIED"
  | "PROCESSING"
  | "PACKED"
  | "DISPATCHED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED"
  | "RETURNED"
  | "REFUNDED"
  | "DELAYED"
  // Legacy status support for backwards compatibility
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export type PaymentStatus =
  | "PENDING"
  | "PENDING_PAYMENT"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  // Legacy values
  | "Pending"
  | "Paid"
  | "Failed";

export type PaymentMethod = "COD" | "BANK_TRANSFER" | "RAZORPAY" | "CARD" | "UPI";

export interface IAddress {
  _id?: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  pincode: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
}

export interface IAmazonDetail {
  key: string;
  value: string;
}

export type IProductSeo = SeoData;