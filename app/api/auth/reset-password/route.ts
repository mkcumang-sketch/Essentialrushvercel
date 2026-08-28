import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/usertemp';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // 🛡️ 1. Rate Limiting Protection (Auth Tier)
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    const rateLimit = await checkRateLimit(ip, "auth");

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Please try again in a minute." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 🛡️ 2. LPDoS Guard (Max 10KB payload)
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 10 * 1024) {
      return NextResponse.json(
        { success: false, message: "Payload too large." },
        { status: 413, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await req.json();

    // 🛡️ 3. Safe String Casting & Input Sanitization
    const cleanEmail = String(body?.email || "").trim().toLowerCase();
    const cleanOtp = String(body?.otp || "").trim().replace(/[^0-9]/g, "");
    const rawPassword = String(body?.newPassword || "");

    if (!cleanEmail || !cleanOtp || !rawPassword) {
      return NextResponse.json(
        { success: false, message: "Email, OTP, and new password are required." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    if (rawPassword.length < 6 || rawPassword.length > 128) {
      return NextResponse.json(
        { success: false, message: "Password must be between 6 and 128 characters long." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    await connectDB();

    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    // 🛡️ 4. ATOMIC UNSET & REPLAY ATTACK DEFENSE
    // Verification, Expiration check, Password update, aur OTP delete ek hi atomic operation mein execute hota hai.
    const verifiedUser = await User.findOneAndUpdate(
      {
        email: { $eq: cleanEmail },
        resetOtp: { $eq: cleanOtp },
        otpExpiry: { $gt: new Date() }, // Ensures token is not expired
      },
      {
        $unset: { resetOtp: 1, otpExpiry: 1 }, // Instantly burns the token
        $set: { password: hashedPassword },
      },
      { new: true }
    );

    if (!verifiedUser) {
      return NextResponse.json(
        { success: false, message: "Invalid, expired, or already used OTP." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Password updated successfully! Please log in.",
      },
      { status: 200, headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error processing password update." },
      { status: 500 }
    );
  }
}