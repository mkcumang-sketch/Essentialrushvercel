import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { requireSuperAdmin } from "@/lib/auth";
import { AbandonedCart } from "@/models/AbandonedCart";
import { validateAndFormatPhone, getWhatsAppUrl } from "@/lib/phone";
import { sanitizeString } from "@/lib/sanitize";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await requireSuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const leadId = sanitizeString(body?.leadId, 50);

    if (!leadId || !mongoose.Types.ObjectId.isValid(leadId)) {
      return NextResponse.json({ success: false, error: "Valid leadId is required" }, { status: 400 });
    }

    await connectDB();
    const lead = await AbandonedCart.findById(leadId).lean().exec() as any;

    if (!lead) {
      return NextResponse.json({ success: false, error: "Cart record not found" }, { status: 404 });
    }

    const phoneValidation = validateAndFormatPhone(lead.phone);
    if (!phoneValidation?.isValid) {
      return NextResponse.json({ success: false, error: "Invalid contact phone number" }, { status: 400 });
    }

    const appUrl = process.env.NEXTAUTH_URL || "https://essential-ivory.vercel.app";
    const recoveryLink = `${appUrl}/cart`;
    const clientName = sanitizeString(lead.name, 50) || "Vault Client";
    const message = `Dear ${clientName}, your curated selection has been reserved in our private vault. Tap here to complete your acquisition: ${recoveryLink}`;

    const whatsappUrl = getWhatsAppUrl(phoneValidation.formattedNumber, message);

    return NextResponse.json({
      success: true,
      url: whatsappUrl,
      message: "WhatsApp recovery payload prepared.",
    });
  } catch (error) {
    console.error("WhatsApp Cart Recovery API Error:", error);
    return NextResponse.json({ success: false, error: "Internal processing error." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 });
}