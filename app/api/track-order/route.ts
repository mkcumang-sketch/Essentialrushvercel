import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Order } from "@/models/Order";
import mongoose, { Model } from "mongoose";
import { sanitizeString, escapeRegex } from "@/lib/sanitize";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const OrderModel =
  (Order || mongoose.models.Order || mongoose.model("Order", new mongoose.Schema({}, { strict: false }))) as Model<any>;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rateLimit = await checkRateLimit(ip, "user");

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many tracking attempts. Please slow down." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    await connectDB();
    const body = await request.json().catch(() => ({}));
    const rawTrackingId = sanitizeString(body.trackingId || body.orderId, 100);

    if (!rawTrackingId) {
      return NextResponse.json(
        { error: "Tracking ID or Order ID is required." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const safeRegex = new RegExp(`^${escapeRegex(rawTrackingId)}$`, "i");

    const order = await OrderModel.findOne({
      $or: [
        { trackingId: safeRegex },
        { orderId: safeRegex },
        ...(mongoose.Types.ObjectId.isValid(rawTrackingId)
          ? [{ _id: new mongoose.Types.ObjectId(rawTrackingId) }]
          : []),
      ],
    })
      .select("orderId trackingId status totalAmount createdAt items shippingData customer")
      .lean();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    return NextResponse.json(
      { success: true, data: order },
      { status: 200, headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error("Order tracking error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}