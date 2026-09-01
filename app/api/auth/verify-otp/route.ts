// app/api/auth/verify-otp/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/usertemp";
import bcrypt from "bcryptjs";
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";

  try {
    // 🛡️ 1. Rate Limiting (Auth Tier - Strict for OTP attempts)
    const rateLimit = await checkRateLimit(ip, "auth");
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, message: "Too many OTP attempts. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const { email, otp, newPassword } = await req.json();
    await connectDB();

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanOtp = String(otp || "").trim().replace(/[^0-9]/g, "");
    const cleanPassword = String(newPassword || "");

    if (!cleanEmail || !cleanOtp || !cleanPassword) {
      return NextResponse.json(
        { success: false, message: "Email, OTP, and password are required." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    if (cleanPassword.length < 6 || cleanPassword.length > 128) {
      return NextResponse.json(
        { success: false, message: "Password must be between 6 and 128 characters." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 🛡️ 2. Fetch user with OTP hash
    const user = await User.findOne({ email: { $eq: cleanEmail } }).select("+resetOtpHash +otpExpiry").exec();
    
    if (!user || !user.resetOtpHash) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // Check expiration
    if (user.otpExpiry && new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 🛡️ 3. Verify OTP with bcrypt
    const isValidOtp = await bcrypt.compare(cleanOtp, user.resetOtpHash);
    if (!isValidOtp) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 12);

    // 🛡️ 4. ATOMIC UNSET & REPLAY ATTACK DEFENSE
    // Burn token instantly, prevent replay
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        resetOtpHash: user.resetOtpHash,
        otpExpiry: { $gt: new Date() }
      },
      {
        $unset: { resetOtpHash: 1, otpExpiry: 1 },
        $set: { password: hashedPassword }
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    return NextResponse.json(
      { success: true, message: "Password updated securely." },
      { status: 200, headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (err: any) {
    console.error("Verify OTP Error:", err.message);
    return NextResponse.json(
      { success: false, message: "Server error processing password update." },
      { status: 500 }
    );
  }
}