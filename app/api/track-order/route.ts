import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Order } from "@/models/Order";
import mongoose, { Model } from "mongoose";
import { sanitizeString, escapeRegex } from "@/lib/sanitize";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => ({}));
    const rawTrackingId = sanitizeString(body.trackingId || body.orderId, 100);
    const userEmail = body.email ? sanitizeString(body.email, 100).toLowerCase() : null;

    if (!rawTrackingId) {
      return NextResponse.json(
        { error: "Tracking ID or Order ID is required." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    if (!userEmail && !session?.user) {
      return NextResponse.json(
        { error: "Email or authentication required to track order." },
        { status: 401, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const safeRegex = new RegExp(`^${escapeRegex(rawTrackingId)}$`, "i");

    // 🛡️ AUTHORIZATION: Build query based on user
    let query: any = {
      $or: [
        { trackingId: safeRegex },
        { orderId: safeRegex },
        ...(mongoose.Types.ObjectId.isValid(rawTrackingId)
          ? [{ _id: new mongoose.Types.ObjectId(rawTrackingId) }]
          : []),
      ],
    };

    // If authenticated, user can also see their own orders by userId
    const userId = session?.user?.id;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.$or.push({ userId: new mongoose.Types.ObjectId(userId) });
    }

    // If email provided, verify ownership by email
    if (userEmail) {
      query.$or.push({ "customer.email": { $eq: userEmail } });
    }

    // 🛡️ Restrict to authenticated user's own email or matching provided email
    // This prevents anonymous users from tracking arbitrary orders
    if (!session?.user && userEmail) {
      // If not authenticated, can only track if they provide matching email
      query = {
        $or: [
          { trackingId: safeRegex, "customer.email": { $eq: userEmail } },
          { orderId: safeRegex, "customer.email": { $eq: userEmail } },
          ...(mongoose.Types.ObjectId.isValid(rawTrackingId)
            ? [{ _id: new mongoose.Types.ObjectId(rawTrackingId), "customer.email": { $eq: userEmail } }]
            : []),
        ],
      };
    }

    const order = await OrderModel.findOne(query)
      .select("orderId trackingId status totalAmount createdAt items shippingData customer")
      .lean();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or you don't have permission to view it." },
        { status: 404, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    return NextResponse.json(
      { success: true, data: order },
      { status: 200, headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error: any) {
    console.error("Order tracking error:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}