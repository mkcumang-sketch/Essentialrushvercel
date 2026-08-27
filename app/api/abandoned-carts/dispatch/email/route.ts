// app/api/abandoned-carts/dispatch/route.ts
export const dynamic    = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Schema, Model, Document } from 'mongoose';
import connectDB from '@/lib/mongodb';
import { getToken } from 'next-auth/jwt';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AbandonedCartDocument extends Document {
  name:      string;
  email:     string;
  phone:     string;
  cartTotal: number;
  status:    string;
  createdAt: Date;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ─── Model (inline — avoids missing module import) ───────────────────────────
const AbandonedCartSchema = new Schema<AbandonedCartDocument>(
  {
    name:      { type: String, default: 'Vault Client' },
    email:     { type: String, default: '' },
    phone:     { type: String, default: '' },
    cartTotal: { type: Number, default: 0 },
    status:    { type: String, default: 'ABANDONED' },
    createdAt: { type: Date, default: Date.now },
  },
  { strict: false }
);

const AbandonedCart: Model<AbandonedCartDocument> =
  (mongoose.models.AbandonedCart as Model<AbandonedCartDocument>) ||
  mongoose.model<AbandonedCartDocument>('AbandonedCart', AbandonedCartSchema);

// ─── Email helper (inline — avoids missing @/utils import) ───────────────────
const buildRecoveryEmailHtml = (name: string, link: string): string => `
  <div style="font-family:sans-serif;max-width:600px;margin:auto">
    <h2>Hi ${name}, you left something behind!</h2>
    <p>Your cart is waiting. Complete your order before it's gone.</p>
    <a href="${link}" style="
      display:inline-block;
      padding:12px 24px;
      background:#000;
      color:#fff;
      text-decoration:none;
      border-radius:4px;
      margin-top:16px;
    ">Return to Cart</a>
    <p style="margin-top:24px;color:#666;font-size:12px">
      If you didn't create an account, you can ignore this email.
    </p>
  </div>
`;

const sendVipRecoveryEmail = async ({
  to,
  customerName,
  link,
}: {
  to: string;
  customerName: string;
  link: string;
}): Promise<void> => {
  // ── Option A: nodemailer (recommended) ──
  // const nodemailer = await import('nodemailer');
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({ from, to, subject, html });

  // ── Option B: Resend / SendGrid / any provider ──
  // Replace this stub with your real email provider call
  console.log(`[Email] Sending recovery email to ${to}`);
  console.log(`[Email] Customer: ${customerName}, Link: ${link}`);

  // Example with Resend:
  // const { Resend } = await import('resend');
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'noreply@essentialrush.com',
  //   to,
  //   subject: 'You left something in your cart!',
  //   html: buildRecoveryEmailHtml(customerName, link),
  // });
  
  void buildRecoveryEmailHtml; // suppress unused warning until wired up
};

// ─── Auth guard ───────────────────────────────────────────────────────────────
const isSuperAdminRequest = async (req: NextRequest): Promise<boolean> => {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return !!(token && (token as { role?: string }).role === 'SUPER_ADMIN');
};

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. Auth check
    if (!(await isSuperAdminRequest(req))) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to do that.' },
        { status: 403 }
      );
    }

    // 2. Parse body
    let leadId: string | undefined;
    try {
      const body = await req.json();
      leadId = body?.leadId;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body.' },
        { status: 400 }
      );
    }

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'Missing leadId.' },
        { status: 400 }
      );
    }

    // 3. DB lookup
    await connectDB();

    const leadRaw = await AbandonedCart.findById(leadId).lean();
    if (!leadRaw || Array.isArray(leadRaw)) {
      return NextResponse.json(
        { success: false, error: 'Lead not found.' },
        { status: 404 }
      );
    }

    const lead = leadRaw as { email?: string; name?: string };
    if (!lead.email) {
      return NextResponse.json(
        { success: false, error: 'Lead has no email address.' },
        { status: 400 }
      );
    }

    // 4. Send recovery email
    const appUrl      = process.env.NEXTAUTH_URL ?? 'https://essentialrush.com';
    const recoveryLink = `${appUrl}/cart`;

    await sendVipRecoveryEmail({
      to:           lead.email,
      customerName: lead.name ?? 'Valued Client',
      link:         recoveryLink,
    });

    return NextResponse.json(
      { success: true, message: 'Recovery email dispatched.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Email dispatch error:', error);
    return NextResponse.json(
      { success: false, error: 'Email dispatch failed.' },
      { status: 500 }
    );
  }
}