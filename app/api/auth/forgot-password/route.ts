import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/usertemp';
import { sendEmail } from '@/lib/mail';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";

  try {
    // 🛡️ 1. Rate Limiting Protection (Auth Tier)
    const rateLimit = await checkRateLimit(ip, "auth");
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, message: "Too many password reset attempts. Please wait a minute." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 🛡️ 2. LPDoS Protection (Max 10KB)
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 10 * 1024) {
      return NextResponse.json(
        { success: false, message: 'Payload too large.' },
        { status: 413, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    await connectDB();

    const cleanEmail = email.trim().toLowerCase();
    
    // 🛡️ 3. NoSQL Injection Prevention ($eq)
    const user = (await User.findOne({ email: { $eq: cleanEmail } })) as any;

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No account found with this email.' },
        { status: 404, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const hashedOtp = await bcrypt.hash(otp, 10);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetOtpHash: hashedOtp,
          otpExpiry: otpExpiry,
        },
      }
    );

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 40px 20px; background-color: #0A0A0A; color: #ffffff; border-radius: 16px;">
        <h2 style="color: #D4AF37; font-family: Georgia, serif; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">Essential Rush</h2>
        <p style="color: #a3a3a3; font-size: 14px; margin-top: 0;">Vault Password Recovery</p>
        
        <div style="margin: 32px auto; padding: 24px; border: 1px solid rgba(212, 175, 55, 0.4); display: inline-block; border-radius: 12px; background: rgba(212, 175, 55, 0.03);">
          <p style="margin: 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; font-weight: bold;">One-Time Security Passcode</p>
          <h1 style="color: #D4AF37; font-size: 44px; margin: 12px 0; letter-spacing: 8px; font-family: monospace;">${otp}</h1>
          <p style="margin: 0; color: #666666; font-size: 11px;">Expires in 10 minutes</p>
        </div>
        
        <p style="color: #737373; font-size: 12px; max-width: 360px; margin: 0 auto; line-height: 1.6;">
          If you did not initiate this request, your account remains secure. No action is required.
        </p>
      </div>
    `;

    await sendEmail(cleanEmail, "Password Reset Vault Access - Essential Rush", emailHtml);

    return NextResponse.json(
      { success: true, message: 'OTP has been dispatched to your email.' },
      { status: 200, headers: getRateLimitHeaders(rateLimit) }
    );

  } catch (error: any) {
    console.error("Forgot Password Error:", error.message);
    return NextResponse.json(
      { success: false, message: 'Server error processing reset request.' },
      { status: 500 }
    );
  }
}