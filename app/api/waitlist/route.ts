export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import mongoose, { Model } from "mongoose";
import connectDB from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sanitizeString, sanitizePhone } from "@/lib/sanitize";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

interface ICartItem {
  productId: string;
  productName?: string;
}

interface ILead {
  _id?: mongoose.Types.ObjectId;
  phone?: string;
  userId?: string | mongoose.Types.ObjectId;
  cartItems?: ICartItem[];
  status?: string;
  lastActive?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
}

const LeadModel = (Lead as unknown as Model<ILead>) || mongoose.model<ILead>("Lead", new mongoose.Schema({}, { strict: false }));

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rateLimit = await checkRateLimit(ip, "user");

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Too many waitlist submissions. Try again later." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    await connectDB();
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => ({}));

    const productId = sanitizeString(body.productId, 100);
    const productName = sanitizeString(body.productName, 150);

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const sessionUser = session?.user;
    const userId = sessionUser?.id || undefined;

    const rawPhone =
      typeof (sessionUser as any)?.phone === "string"
        ? (sessionUser as any).phone
        : typeof body.phone === "string"
        ? body.phone
        : "";

    const phone = sanitizePhone(rawPhone) || "N/A";

    const newWaitlistEntry = await LeadModel.create({
      phone,
      ...(userId ? { userId } : {}),
      cartItems: [
        {
          productId,
          productName: productName || undefined,
        },
      ],
      status: "PENDING",
      lastActive: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "You have been added to the exclusive waitlist. We will contact you soon.",
        data: newWaitlistEntry,
      },
      { status: 200, headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error: unknown) {
    console.error("Waitlist API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to join waitlist. Please try again.",
      },
      { status: 500 }
    );
  }
}