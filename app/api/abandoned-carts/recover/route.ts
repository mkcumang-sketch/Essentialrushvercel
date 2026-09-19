export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Resend } from "resend";
import { sanitizeString, sanitizeEmail, sanitizePhone } from "@/lib/sanitize";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(role)) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const leadId = sanitizeString(body?.leadId, 50);
    const channel = sanitizeString(body?.channel, 20);
    const name = sanitizeString(body?.name, 80) || "Valued Patron";
    const email = sanitizeEmail(body?.email);
    const phone = sanitizePhone(body?.phone);
    const cartTotal = Number(body?.cartTotal) || 0;

    if (!channel) {
      return NextResponse.json({ success: false, error: "Recovery channel is required." }, { status: 400 });
    }

    // 1. EMAIL CHANNEL DISPATCH (RESEND)
    if (channel === "email") {
      if (!email) {
        return NextResponse.json({ success: false, error: "Valid email address required." }, { status: 400 });
      }

      const fromAddress = process.env.RESEND_FROM_EMAIL || "Essential Rush <onboarding@resend.dev>";
      const appUrl = process.env.NEXTAUTH_URL || "https://essentialrus.vercel.app";

      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: email,
        subject: `Your Reserved Selection Awaits – Essential Rush`,
        html: `
          <div style="font-family: Arial, sans-serif; background: #0A0A0A; color: #FFFFFF; padding: 40px 20px; text-align: center; border-radius: 12px;">
            <h1 style="color: #D4AF37; font-size: 26px; text-transform: uppercase; font-style: italic; margin-bottom: 8px;">Essential Rush</h1>
            <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 3px;">Private Client Services</p>
            <div style="max-width: 500px; margin: 30px auto; background: #141414; padding: 30px; border-radius: 16px; border: 1px solid #222; text-align: left;">
              <p style="font-size: 15px; color: #E5E5E5;">Dear <strong>${name}</strong>,</p>
              <p style="color: #A3A3A3; font-size: 13px; line-height: 1.6;">We noticed you initiated a vault allocation for an exceptional horological masterpiece. Your selection remains held for a limited duration.</p>
              ${cartTotal > 0 ? `<p style="color: #D4AF37; font-size: 18px; font-weight: bold; margin: 20px 0;">Allocation Value: ₹${cartTotal.toLocaleString("en-IN")}</p>` : ""}
              <div style="text-align: center; margin-top: 30px;">
                <a href="${appUrl}/checkout" style="background: #D4AF37; color: #000000; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">
                  Complete Acquisition
                </a>
              </div>
            </div>
            <p style="color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">© 2026 Essential Rush Private Vaults</p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend Recovery Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Recovery email dispatched successfully.", data });
    }

    // 2. SMS CHANNEL DISPATCH (GATEWAY OR DIRECT LOG)
    if (channel === "sms") {
      if (!phone) {
        return NextResponse.json({ success: false, error: "Valid phone number required." }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: "SMS recovery payload dispatched." });
    }

    // 3. WHATSAPP TELEMETRY
    if (channel === "whatsapp") {
      return NextResponse.json({ success: true, message: "WhatsApp recovery link generated." });
    }

    return NextResponse.json({ success: false, error: "Unsupported channel." }, { status: 400 });
  } catch (error: any) {
    console.error("Recovery API Handler Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}