import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/utils/sendOrderConfirmationEmail";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: NextRequest) {
  try {
    const {
      to,
      subject,
      customerName,
      orderId,
      amount,
    }: {
      to: string;
      subject?: string;
      customerName?: string;
      orderId?: string;
      amount?: number;
    } = await req.json();

    if (!to) {
      return NextResponse.json({ success: false, error: "Missing `to`" }, { status: 400 });
    }

    // Basic request authorization:
    // 1) Internal secret header (for server-to-server calls)
    // 2) Otherwise, allow if `to` matches an authenticated NextAuth user email (if configured)
    const internalSecret = req.headers.get("x-email-secret");
    const expectedSecret = process.env.ORDER_EMAIL_SECRET;
    const secretOk = expectedSecret && internalSecret && internalSecret === expectedSecret;

    if (!secretOk) {
      // If you don't use internal-secret calls, set ORDER_EMAIL_SECRET and use it in your backend.
      return NextResponse.json({ success: false, error: "You do not have access to do that." }, { status: 403 });
    }

    const data = await sendOrderConfirmationEmail({
      to,
      subject,
      customerName,
      orderId,
      amount,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: "We could not send the email." }, { status: 500 });
  }
}

