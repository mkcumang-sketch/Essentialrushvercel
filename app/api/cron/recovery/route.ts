export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import nodemailer from 'nodemailer';
import { AbandonedCart } from '@/models/AbandonedCart';
import { sendRecoverySMS } from '@/lib/sms';
import mongoose, { Model } from 'mongoose';

function generateRecoveryCode(): { code: string; discount: string; discountPercent: number } {
  return {
    code: `RUSH${Date.now().toString().slice(-6)}`,
    discount: '5% OFF',
    discountPercent: 5
  };
}

async function sendRecoveryEmail(email: string, name: string, cartTotal: number, items: any[], recoveryCode: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return false;
  }

  const itemsList = items.slice(0, 3).map((item: any, idx: number) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
        <p style="margin: 0; font-weight: 600; color: #000;">${idx + 1}. ${item.name || item.title || 'Luxury Item'}</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Qty: ${item.qty || item.quantity || 1}</p>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">
        ₹${Number(item.price || 0).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; background: #0A0A0A; color: #fff; padding: 30px; text-align: center; border-radius: 12px;">
      <h2 style="color: #D4AF37; letter-spacing: 2px;">ESSENTIAL RUSH</h2>
      <p style="color: #ccc;">Dear ${name || 'Collector'}, your vault selection is waiting.</p>
      <div style="border: 1px solid #D4AF37; padding: 20px; display: inline-block; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #888; font-size: 11px;">EXCLUSIVE CODE</p>
        <h1 style="color: #D4AF37; margin: 8px 0;">${recoveryCode}</h1>
        <p style="margin: 0; color: #aaa; font-size: 12px;">5% OFF + Complimentary Insured Shipping</p>
      </div>
      <table width="100%" style="margin: 20px 0; text-align: left; color: #fff;">${itemsList}</table>
      <a href="https://essentialrush.com/shop" style="background: #D4AF37; color: #000; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">COMPLETE ACQUISITION</a>
    </div>
  `;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: `"Essential Rush" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Your selection awaits... ${recoveryCode} | 5% OFF`,
      html,
    });
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const AbandonedCartModel = (AbandonedCart || mongoose.models.AbandonedCart) as Model<any>;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const deadCarts = await AbandonedCartModel.find({
      $or: [{ status: 'ABANDONED' }, { status: { $exists: false } }],
      updatedAt: { $lt: oneDayAgo },
      recoveryEmailSent: { $ne: true }
    }).limit(50);

    const results = { email: 0, sms: 0 };

    for (const cart of deadCarts as any[]) {
      const cartTotal = cart.cartTotal || cart.items?.reduce((acc: number, item: any) => acc + (item.price || 0) * (item.qty || 1), 0) || 0;
      const { code } = generateRecoveryCode();

      if (cart.email) {
        const sent = await sendRecoveryEmail(cart.email, cart.name || 'Valued Customer', cartTotal, cart.items || [], code);
        if (sent) {
          cart.recoveryEmailSent = true;
          cart.recoveryCode = code;
          results.email++;
        }
      }

      if (cart.phone) {
        const smsSent = await sendRecoverySMS(cart.phone, cart.name || 'Guest', `https://essentialrush.com/checkout?code=${code}`, '5% OFF');
        if (smsSent) results.sms++;
      }

      cart.status = 'OFFER_SENT';
      await cart.save();
    }

    return NextResponse.json({
      success: true,
      processed: deadCarts.length,
      emailSent: results.email,
      smsSent: results.sms,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Recovery failed' }, { status: 500 });
  }
}