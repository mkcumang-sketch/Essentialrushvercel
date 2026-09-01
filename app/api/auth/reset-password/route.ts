import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/usertemp';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";

  try {
    // 🛡️ 1. Rate Limiting Protection (Auth Tier)
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

    // 🛡️ 4. Fetch user and verify OTP hash with bcrypt
    const user = await User.findOne({
      email: { $eq: cleanEmail },
    }).select("+resetOtpHash +otpExpiry").exec();

    if (!user || !user.resetOtpHash) {
      return NextResponse.json(
        { success: false, message: "Invalid, expired, or already used OTP." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // Check expiration
    if (user.otpExpiry && new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json(
        { success: false, message: "Invalid, expired, or already used OTP." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // Verify OTP with bcrypt
    const isValidOtp = await bcrypt.compare(cleanOtp, user.resetOtpHash);
    if (!isValidOtp) {
      return NextResponse.json(
        { success: false, message: "Invalid, expired, or already used OTP." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    // 🛡️ 5. ATOMIC UNSET & REPLAY ATTACK DEFENSE
    // Verification, Expiration check, Password update, and OTP delete in one atomic operation
    const verifiedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        resetOtpHash: user.resetOtpHash, // Double check the hash hasn't changed
        otpExpiry: { $gt: new Date() }, // Ensures token is not expired
      },
      {
        $unset: { resetOtpHash: 1, otpExpiry: 1 },
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
    console.error("Reset Password Error:", error.message);
    return NextResponse.json(
      { success: false, message: "Server error processing password update." },
      { status: 500 }
    );
  }
}