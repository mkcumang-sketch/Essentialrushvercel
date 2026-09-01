import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Order } from "@/models/Order";
import User from "@/models/usertemp";
import nodemailer from "nodemailer";
import { z } from "zod";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { sanitizeEmail, sanitizeString } from "@/lib/sanitize";

const invoiceSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  forceRegenerate: z.boolean().optional(),
});

const ALLOWED_INVOICE_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "STAFF", "AGENT"]);

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
}

const OrderModel = Order as mongoose.Model<any>;
const UserModel = User as mongoose.Model<any>;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char] ?? char;
  });
}

function canAccessOrder(session: any, order: any): boolean {
  if (!session?.user) return false;

  const currentUserId = String(session.user.id || "");
  const currentEmail = String(session.user.email || "").toLowerCase();
  const role = String((session.user as any)?.role || "");

  if (ALLOWED_INVOICE_ROLES.has(role)) {
    return true;
  }

  const orderOwnerId = order?.userId ? String(order.userId) : "";
  const orderEmail = String(order?.shippingData?.email || order?.customer?.email || "").toLowerCase();

  if (currentUserId && orderOwnerId && currentUserId === orderOwnerId) return true;
  if (currentEmail && orderEmail && currentEmail === orderEmail) return true;

  return false;
}

async function generateInvoiceHTML(order: any, userData: UserData) {
  const itemsHTML =
    (order.items || [])
      .map((item: any, idx: number) => {
        const itemName = escapeHtml(String(item?.name || "Luxury Timepiece"));
        const itemQty = Number(item?.qty || 1);
        const itemPrice = Number(item?.price || 0);
        return `
          <tr>
            <td style="padding: 16px 0; border-bottom: 1px solid #eee;">
              <p style="margin: 0; font-weight: 600; color: #111; font-size: 14px;">${idx + 1}. ${itemName}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #777;">Qty: ${itemQty}</p>
            </td>
            <td style="padding: 16px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; color: #111;">
              ₹${itemPrice.toLocaleString("en-IN")}
            </td>
          </tr>
        `;
      })
      .join("") || "";

  const shipping = order.shippingData || {};
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN");

  const billedTo = escapeHtml(userData?.name || shipping.name || "Valued Customer");
  const billedEmail = escapeHtml(userData?.email || shipping.email || "");
  const billedPhone = escapeHtml(userData?.phone || shipping.phone || "");
  const invoiceNumber = escapeHtml(String(order.orderId || "INV-UNKNOWN"));
  const statusText = escapeHtml(String(order.status || "PAID"));
  const shippingName = escapeHtml(String(shipping.name || ""));
  const shippingAddress = escapeHtml(String(shipping.address || ""));
  const shippingCity = escapeHtml(String([shipping.city, shipping.state, shipping.pincode].filter(Boolean).join(", ")));

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice - ${invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F9FA; padding: 40px 0;">
    <tr>
      <td>
        <table width="650" cellpadding="0" cellspacing="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background: linear-gradient(135deg, #050505 0%, #1a1a1a 100%); padding: 48px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #D4AF37; letter-spacing: 4px; text-transform: uppercase;">Essential Rush</h1>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #A0A0A0; letter-spacing: 2px; text-transform: uppercase;">Fine Horology & Luxury Timepieces</p>
                  </td>
                  <td style="text-align: right;">
                    <p style="margin: 0; font-size: 26px; font-weight: 400; color: #ffffff; font-family: Georgia, serif; letter-spacing: 2px;">INVOICE</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" valign="top">
                    <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 700; color: #A0A0A0; letter-spacing: 1.5px; text-transform: uppercase;">Billed To</p>
                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111;">${billedTo}</p>
                    <p style="margin: 6px 0 0 0; font-size: 14px; color: #555;">${billedEmail}</p>
                    ${billedPhone ? `<p style="margin: 6px 0 0 0; font-size: 14px; color: #555;">${billedPhone}</p>` : ""}
                  </td>
                  <td width="50%" valign="top" style="text-align: right;">
                    <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 700; color: #A0A0A0; letter-spacing: 1.5px; text-transform: uppercase;">Order Details</p>
                    <p style="margin: 0; font-size: 14px; color: #444;"><strong>Invoice #:</strong> ${invoiceNumber}</p>
                    <p style="margin: 6px 0 0 0; font-size: 14px; color: #444;"><strong>Date:</strong> ${orderDate}</p>
                    <p style="margin: 6px 0 0 0; font-size: 14px; color: #444;"><strong>Status:</strong> <span style="color: #D4AF37; font-weight: 700;">${statusText}</span></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr style="border-bottom: 2px solid #222;">
                    <th style="text-align: left; padding: 16px 0; font-size: 11px; font-weight: 700; color: #A0A0A0; letter-spacing: 1.5px; text-transform: uppercase;">Description</th>
                    <th style="text-align: right; padding: 16px 0; font-size: 11px; font-weight: 700; color: #A0A0A0; letter-spacing: 1.5px; text-transform: uppercase;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #F8F9FA; border-radius: 8px; padding: 24px;">
                <tr>
                  <td style="font-size: 14px; color: #555; text-transform: uppercase; letter-spacing: 1px;">Subtotal</td>
                  <td style="text-align: right; font-size: 16px; font-weight: 600; color: #222;">₹${Number(order.totalAmount || 0).toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; color: #555; text-transform: uppercase; letter-spacing: 1px; padding-top: 14px;">Shipping</td>
                  <td style="text-align: right; font-size: 16px; font-weight: 600; color: #222; padding-top: 14px;">Complimentary</td>
                </tr>
                <tr>
                  <td colspan="2"><hr style="border: none; border-top: 1px solid #E0E0E0; margin: 20px 0;" /></td>
                </tr>
                <tr>
                  <td style="font-size: 16px; font-weight: 800; color: #111; text-transform: uppercase; letter-spacing: 1px;">Total Paid</td>
                  <td style="text-align: right; font-size: 26px; font-weight: 800; color: #D4AF37;">₹${Number(order.totalAmount || 0).toLocaleString("en-IN")}</td>
                </tr>
              </table>
            </td>
          </tr>

          ${shipping.address ? `
          <tr>
            <td style="padding: 0 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E0E0E0; border-radius: 8px; padding: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 700; color: #A0A0A0; letter-spacing: 1.5px; text-transform: uppercase;">Shipping Destination</p>
                    <p style="margin: 0; font-size: 14px; color: #222; font-weight: 500;">${shippingName}</p>
                    <p style="margin: 6px 0 0 0; font-size: 14px; color: #555; line-height: 1.5;">${shippingAddress}<br>${shippingCity}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ""}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

async function sendInvoiceEmail(order: any, userEmail: string, userName: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const invoiceHTML = await generateInvoiceHTML(order, { name: userName, email: userEmail });

  const mailOptions = {
    from: `"Essential Rush" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: `Invoice: ${order.orderId} | Essential Rush`,
    html: invoiceHTML,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error("Invoice email failed:", error);
    return { success: false, error: error.message };
  }
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkRateLimit(ip, "user");
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Too many invoice requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    let json: any;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const validation = invoiceSchema.safeParse(json);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { orderId, forceRegenerate } = validation.data;
    await connectDB();

    const cleanOrderId = sanitizeString(orderId, 50);
    const order: any = await OrderModel.findOne({ orderId: cleanOrderId }).lean();
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (!canAccessOrder(session, order)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    let dbUser: any = null;
    let userEmail = sanitizeEmail(order.shippingData?.email || order.customer?.email);
    let userName = sanitizeString(order.shippingData?.name || order.customer?.name || "Valued Customer", 100);

    if (order.userId) {
      dbUser = await UserModel.findById(order.userId).lean();
      if (dbUser) {
        userEmail = sanitizeEmail(dbUser.email || userEmail) || userEmail;
        userName = sanitizeString(dbUser.name || userName, 100);
      }
    }

    if (!userEmail) {
      return NextResponse.json({ success: false, error: "No email address found for order" }, { status: 400 });
    }

    const result = await sendInvoiceEmail(order, userEmail, userName);

    if (result.success || forceRegenerate) {
      await OrderModel.findByIdAndUpdate(order._id, {
        $set: { invoiceSentAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      message: result.success ? "Invoice sent successfully" : result.error,
      email: userEmail,
    });
  } catch (error: any) {
    console.error("Invoice API error:", error);
    return NextResponse.json({ success: false, error: "Failed to process invoice" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkRateLimit(ip, "user");
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Too many invoice requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const { searchParams } = new URL(req.url);
    const orderId = sanitizeString(searchParams.get("orderId"), 50);

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID required" }, { status: 400 });
    }

    await connectDB();

    const order: any = await OrderModel.findOne({ orderId }).lean();
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (!canAccessOrder(session, order)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const invoiceHTML = await generateInvoiceHTML(order, {
      name: sanitizeString(order.shippingData?.name || order.customer?.name || "Valued Customer", 100),
      email: sanitizeEmail(order.shippingData?.email || order.customer?.email) || "",
    });

    return new Response(invoiceHTML, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Invoice GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate invoice" }, { status: 500 });
  }
}