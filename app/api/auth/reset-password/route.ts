import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/usertemp";
import bcrypt from "bcryptjs";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { validatePasswordStrength, sanitizeEmail, sanitizeString } from "@/lib/sanitize";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";

  try {
    // 🛡️ 1. Rate Limiting Protection (Auth Tier: 5 attempts/min)
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
    const cleanEmail = sanitizeEmail(body?.email);
    const cleanOtp = sanitizeString(body?.otp, 10).replace(/[^0-9]/g, "");
    const rawPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!cleanEmail || !cleanOtp || !rawPassword) {
      return NextResponse.json(
        { success: false, message: "Email, OTP, and new password are required." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 🛡️ 4. Strict 8-Character Password Complexity Validation
    const passwordCheck = validatePasswordStrength(rawPassword);
    if (!passwordCheck.isValid) {
      return NextResponse.json(
        { success: false, message: passwordCheck.error },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    await connectDB();

    // 🛡️ 5. Fetch user and verify OTP hash with bcrypt
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

    // 🛡️ 6. ATOMIC UNSET & REPLAY ATTACK DEFENSE
    const verifiedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        resetOtpHash: user.resetOtpHash,
        otpExpiry: { $gt: new Date() },
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