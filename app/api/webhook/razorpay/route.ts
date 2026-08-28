export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose, { Model, Schema } from "mongoose";
import connectDB from "@/lib/mongodb";
import { Product } from "@/models/Product";
import User from "@/models/usertemp";
import { sendOrderConfirmationEmail } from "@/lib/mail";

interface OrderItem {
  productId?: string;
  qty?: number;
  name?: string;
  price?: number;
  [key: string]: unknown;
}

interface OrderDocument {
  _id: mongoose.Types.ObjectId;
  orderId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status?: string;
  userId?: mongoose.Types.ObjectId | string;
  appliedReferralCode?: string;
  totalAmount?: number;
  items?: OrderItem[];
  shippingData?: Record<string, unknown>;
  [key: string]: unknown;
}

const OrderModel: Model<OrderDocument> =
  (mongoose.models.Order as Model<OrderDocument>) ||
  mongoose.model<OrderDocument>("Order", new Schema({}, { strict: false, timestamps: true }));

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ success: false, error: "Missing signature" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, error: "Webhook secret unconfigured" }, { status: 500 });
    }

    const expectedSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");
    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    if (event.event !== "payment.captured") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    await connectDB();
    const payment = event?.payload?.payment?.entity;
    if (!payment?.order_id || !payment?.id) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const order = await OrderModel.findOne({ razorpayOrderId: String(payment.order_id) }).exec();
    if (!order) {
      return NextResponse.json({ received: true, message: "Order not found" }, { status: 200 });
    }

    // Idempotency check
    if (order.status === "PAID" || order.razorpayPaymentId) {
      return NextResponse.json({ received: true, message: "Already processed" }, { status: 200 });
    }

    order.status = "PAID";
    order.razorpayPaymentId = String(payment.id);
    await order.save();

    // Deduct stock
    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      if (!item.productId || (Number(item.qty) || 0) <= 0) continue;
      try {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -Number(item.qty), totalSold: Number(item.qty) },
        }).exec();
      } catch (err) {
        console.error("Stock deduct error:", err);
      }
    }

    // Referral Bonus
    const refCode = String(order.appliedReferralCode || "").trim().toUpperCase();
    if (refCode && refCode.startsWith("REF-")) {
      try {
        const referrer = await User.findOne({ myReferralCode: refCode }).exec();
        if (referrer && String(referrer._id) !== String(order.userId)) {
          await User.findByIdAndUpdate(referrer._id, {
            $inc: { walletPoints: 100, totalReferrals: 1, totalEarned: 100 },
            $push: {
              notifications: {
                title: "Referral Reward!",
                desc: "You earned ₹100 from a successful order by a referral.",
                unread: true,
                time: new Date(),
              },
            },
          }).exec();
        }
      } catch (err) {
        console.error("Referral bonus error:", err);
      }
    }

    // Send confirmation email
    const shippingData = (order.shippingData || {}) as any;
    const email = typeof shippingData.email === "string" ? shippingData.email : "";
    if (email) {
      sendOrderConfirmationEmail(email, {
        orderId: order.orderId || String(order._id),
        customerName: shippingData.name || "Valued Customer",
        totalAmount: Number(order.totalAmount) || 0,
        items,
      }).catch((e) => console.error("Email send fail:", e));
    }

    return NextResponse.json({ received: true, message: "Payment processed" }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ success: false, error: error.message || "Webhook error" }, { status: 500 });
  }
}