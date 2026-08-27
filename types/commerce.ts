import type { UserRole } from "@/types/next-auth";
import type { SeoData } from "@/types/seo";

export type { UserRole, SeoData };

export type OrderStatus =
  | "Pending"
  | "PENDING_PAYMENT"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export type PaymentStatus = "Pending" | "PENDING_PAYMENT" | "Paid" | "Failed";

export type PaymentMethod = "COD" | "BANK_TRANSFER";

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
