import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose, { Model } from "mongoose";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// ======================================================
// ORDER TYPES
// ======================================================

interface IOrderItem {
  name?: string;
  title?: string;
  [key: string]: unknown;
}

interface ICustomer {
  email?: string;
  [key: string]: unknown;
}

interface IShippingData {
  email?: string;
  [key: string]: unknown;
}

interface IShippingAddress {
  email?: string;
  [key: string]: unknown;
}

interface IOrder {
  _id: mongoose.Types.ObjectId;

  orderId?: string;
  trackingId?: string;
  status?: string;
  totalAmount?: number;
  createdAt?: Date;

  items?: IOrderItem[];

  customer?: ICustomer;
  shippingData?: IShippingData;
  shippingAddress?: IShippingAddress;
}

// ======================================================
// API ROUTE HANDLER (This was missing)
// ======================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Parse request body
    const body = await request.json();
    const { trackingId } = body;

    if (!trackingId) {
      return NextResponse.json(
        { error: "Tracking ID is required" },
        { status: 400 }
      );
    }

    // 3. Find order in database
    // Ensure your Order model is imported or access it via mongoose.models
    const Order = mongoose.models.Order; 
    
    if (!Order) {
      return NextResponse.json(
        { error: "Order model not found. Please ensure it is initialized." },
        { status: 500 }
      );
    }

    const order = await Order.findOne({ trackingId }).lean() as IOrder | null;

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // 4. Return the order data
    return NextResponse.json(
      { success: true, data: order },
      { status: 200 }
    );

  } catch (error) {
    console.error("Order tracking error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}