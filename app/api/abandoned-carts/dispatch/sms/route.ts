import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getToken } from "next-auth/jwt";
import { sendVIPSMS } from "@/lib/sms";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const AbandonedCartSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Vault Client" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    cartTotal: { type: Number, default: 0 },
    status: { type: String, default: "ABANDONED" },
    createdAt: { type: Date, default: Date.now },
  },
  { strict: false }
);

// 🚀 THE ULTIMATE FIX: Poore expression ko bracket mein daal kar cast kiya hai
const AbandonedCart = (mongoose.models.AbandonedCart || mongoose.model("AbandonedCart", AbandonedCartSchema)) as mongoose.Model<any>;

async function isSuperAdminRequest(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  return token && (token as any).role === "SUPER_ADMIN";
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isSuperAdminRequest(req))) {
      return NextResponse.json({ success: false, error: "You do not have access to do that." }, { status: 403 });
    }

    const { leadId } = await req.json();
    if (!leadId) {
      return NextResponse.json({ success: false, error: "Missing leadId" }, { status: 400 });
    }

    await connectDB();
    
    const leadRaw = await AbandonedCart.findById(leadId).lean();
    
    if (!leadRaw || Array.isArray(leadRaw)) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }
    
    const lead = leadRaw as { phone?: string; name?: string };
    const phone = lead.phone?.trim();
    
    if (!phone) {
      return NextResponse.json({ success: false, error: "Lead has no phone" }, { status: 400 });
    }

    const appUrl = process.env.NEXTAUTH_URL || "https://essential-ivory.vercel.app";
    const recoveryLink = `${appUrl}/cart`;

    const ok = await sendVIPSMS(phone, lead.name ?? "", recoveryLink);
    if (!ok) {
      return NextResponse.json({ success: false, error: "SMS gateway error." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Recovery SMS dispatched." });
  } catch (error) {
    console.error("SMS dispatch error:", error);
    return NextResponse.json({ success: false, error: "SMS dispatch failed." }, { status: 500 });
  }
}