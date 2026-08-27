// lib/mail.ts
import nodemailer from 'nodemailer';

// ─── Transporter (reusable) ───────────────────────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

const FROM = `"Essential Rush" <${process.env.SMTP_USER}>`;
const APP_URL = process.env.NEXTAUTH_URL || 'https://essentialrush.com';

// ─── 1. Generic sendEmail ─────────────────────────────────────────────────────
// Used by: forgot-password/route.ts, orders/cancel/route.ts
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const transporter = createTransporter();
  await transporter.sendMail({ from: FROM, to, subject, html });
}

// ─── 2. sendOrderConfirmationEmail ───────────────────────────────────────────
// Used by: webhook/razorpay/route.ts
interface OrderItem {
  name?: string;
  qty?: number;
  price?: number;
}

interface OrderConfirmationOptions {
  orderId?: string;
  customerName?: string;
  totalAmount?: number;
  items?: OrderItem[];
}

export async function sendOrderConfirmationEmail(
  to: string,
  options: OrderConfirmationOptions = {}
): Promise<void> {
  const {
    orderId      = '',
    customerName = 'Valued Customer',
    totalAmount,
    items        = [],
  } = options;

  const formattedAmount =
    totalAmount != null
      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalAmount)
      : null;

  const itemsHtml = items.length
    ? `
      <table width="100%" cellpadding="8" style="border-collapse:collapse;margin:20px 0;">
        <thead>
          <tr style="background:#f4f4f4;">
            <th style="text-align:left;font-size:13px;">Item</th>
            <th style="text-align:center;font-size:13px;">Qty</th>
            <th style="text-align:right;font-size:13px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr style="border-bottom:1px solid #eee;">
              <td style="font-size:14px;">${item.name ?? 'Product'}</td>
              <td style="text-align:center;font-size:14px;">${item.qty ?? 1}</td>
              <td style="text-align:right;font-size:14px;">₹${item.price ?? 0}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
    : '';

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:0;">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="background:#111;padding:30px;text-align:center;">
          <h1 style="color:#D4AF37;margin:0;font-style:italic;">Essential Rush</h1>
          <p style="color:#aaa;margin:8px 0 0;">Order Confirmed ✓</p>
        </div>
        <div style="padding:36px 30px;">
          <p style="font-size:16px;">Hi <strong>${customerName}</strong>,</p>
          <p style="color:#444;line-height:1.6;">Thank you for your order! We've received it and are getting it ready.</p>
          ${orderId ? `<p>Order ID: <strong style="font-family:monospace;">#${orderId}</strong></p>` : ''}
          ${itemsHtml}
          ${formattedAmount ? `<p>Order Total: <strong>${formattedAmount}</strong></p>` : ''}
          <div style="text-align:center;margin:30px 0;">
            <a href="${APP_URL}/orders" style="background:#111;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:bold;">
              View My Orders
            </a>
          </div>
        </div>
        <div style="padding:20px 30px;background:#f4f4f4;text-align:center;color:#888;font-size:13px;">
          <p style="margin:0;">&copy; ${new Date().getFullYear()} EssentialRush. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(to, `Order Confirmed – Essential Rush #${orderId}`, html);
}

// ─── 3. sendReferralRewardEmail ───────────────────────────────────────────────
// Used by: api/user/referral/apply/route.ts
export async function sendReferralRewardEmail(
  to: string,
  referrerName: string,
  referredUserName: string,
  rewardAmount: number
): Promise<void> {
  const html = `
    <div style="font-family:Arial,sans-serif;background:#0A0A0A;padding:40px 20px;text-align:center;">
      <h2 style="color:#D4AF37;font-style:italic;">Essential Rush</h2>
      <h3 style="color:#fff;">You earned a referral reward! 🎉</h3>
      <p style="color:#ccc;">Hi <strong>${referrerName}</strong>, your friend <strong>${referredUserName}</strong> just joined using your referral code.</p>
      <div style="margin:30px auto;padding:20px;border:1px solid #D4AF37;border-radius:10px;display:inline-block;">
        <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0;">Your Reward</p>
        <h1 style="color:#D4AF37;font-size:48px;margin:10px 0;">₹${rewardAmount}</h1>
        <p style="color:#ccc;margin:0;">Added to your wallet</p>
      </div>
      <p style="color:#888;font-size:12px;margin-top:20px;">Keep sharing your code to earn more rewards.</p>
    </div>
  `;

  await sendEmail(to, '🎁 Referral Reward Credited – Essential Rush', html);
}