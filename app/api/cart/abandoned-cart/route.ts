export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import User from "@/models/usertemp";
import mongoose from "mongoose";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/sanitize";

const LeadModel = (Lead as mongoose.Model<any>) || mongoose.model("Lead", new mongoose.Schema({}, { strict: false }));
const UserModel = (User as mongoose.Model<any>);

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(',')[0]?.trim() || "anonymous";
    const rateLimit = await checkRateLimit(ip, "user");
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 15 * 1024) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    await connectDB();
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { phone, cart } = body;

    const rawPhone = sanitizeString(phone, 20).replace(/[^\d+]/g, '');

    const cartTotal = Array.isArray(cart)
      ? cart.reduce((acc: number, item: { offerPrice?: number; price?: number; qty?: number }) => {
          const price = Number(item.offerPrice || item.price) || 0;
          return acc + price * (Number(item.qty) || 1);
        }, 0)
      : 0;

    if (session?.user?.id) {
      const uid = session.user.id;
      const dbUser = await UserModel.findById(uid).select("phone").lean() as { phone?: string } | null;
      const resolvedPhone = rawPhone || (dbUser?.phone && String(dbUser.phone).trim()) || `VAULT-${uid}`;

      const lead = await LeadModel.findOneAndUpdate(
        { userId: { $eq: uid } },
        {
          $set: {
            userId: uid,
            phone: resolvedPhone,
            cartItems: Array.isArray(cart) ? cart.slice(0, 30) : [],
            cartTotal,
            status: "ABANDONED",
            lastActive: new Date(),
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return NextResponse.json({
        success: true,
        leadId: lead._id,
        message: "Details secured in vault.",
      }, { headers: getRateLimitHeaders(rateLimit) });
    }

    if (!rawPhone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const lead = await LeadModel.findOneAndUpdate(
      { phone: { $eq: rawPhone } },
      {
        $set: {
          phone: rawPhone,
          cartItems: Array.isArray(cart) ? cart.slice(0, 30) : [],
          cartTotal,
          status: "ABANDONED",
          lastActive: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      leadId: lead._id,
      message: "Details secured in vault.",
    }, { headers: getRateLimitHeaders(rateLimit) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Lead Capture Error:", message);
    return NextResponse.json({ error: "Could not sync cart details." }, { status: 500 });
  }
}