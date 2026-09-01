import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/usertemp";
import bcrypt from "bcryptjs";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";

  try {
    await connectDB();
    const { phone, otp, action } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Phone number is required." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/[^\d+]/g, "");

    // 1. SEND OTP ACTION
    if (action === "send") {
      const rateLimit = await checkRateLimit(`otp:send:${ip}`, "auth");
      if (!rateLimit.success) {
        return NextResponse.json(
          { success: false, error: "Too many OTP requests. Please try again later." },
          { status: 429, headers: getRateLimitHeaders(rateLimit) }
        );
      }

      const rateLimit_phone = await checkRateLimit(`otp:send:phone:${cleanPhone}`, "auth");
      if (!rateLimit_phone.success) {
        return NextResponse.json(
          { success: false, error: "Too many OTP requests for this number. Please try again later." },
          { status: 429, headers: getRateLimitHeaders(rateLimit_phone) }
        );
      }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
      const hashedOtp = await bcrypt.hash(generatedOtp, 10);

      await User.findOneAndUpdate(
        { phone: cleanPhone },
        { $set: { otpHash: hashedOtp, otpExpiry } },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        success: true,
        message: "OTP sent successfully.",
      }, { headers: getRateLimitHeaders(rateLimit) });
    }

    // 2. VERIFY OTP ACTION
    if (action === "verify") {
      const rateLimit = await checkRateLimit(`otp:verify:${ip}`, "auth");
      if (!rateLimit.success) {
        return NextResponse.json(
          { success: false, error: "Too many verification attempts. Please try again later." },
          { status: 429, headers: getRateLimitHeaders(rateLimit) }
        );
      }

      const rateLimit_phone = await checkRateLimit(`otp:verify:phone:${cleanPhone}`, "auth");
      if (!rateLimit_phone.success) {
        return NextResponse.json(
          { success: false, error: "Too many verification attempts for this number." },
          { status: 429, headers: getRateLimitHeaders(rateLimit_phone) }
        );
      }

      if (!otp) {
        return NextResponse.json(
          { success: false, error: "Please enter the OTP." },
          { status: 400, headers: getRateLimitHeaders(rateLimit) }
        );
      }

      const cleanInputOtp = String(otp).trim();
      const user = (await User.findOne({ phone: cleanPhone })) as any;

      if (!user || !user.otpHash) {
        return NextResponse.json(
          { success: false, error: "No OTP request found for this number." },
          { status: 404, headers: getRateLimitHeaders(rateLimit) }
        );
      }

      if (user.otpExpiry && new Date() > new Date(user.otpExpiry)) {
        return NextResponse.json(
          { success: false, error: "OTP has expired. Please request a new one." },
          { status: 400, headers: getRateLimitHeaders(rateLimit) }
        );
      }

      const isValidOtp = await bcrypt.compare(cleanInputOtp, user.otpHash);
      if (!isValidOtp) {
        return NextResponse.json(
          { success: false, error: "Invalid OTP. Please check and try again." },
          { status: 400, headers: getRateLimitHeaders(rateLimit) }
        );
      }

      await User.findByIdAndUpdate(
        user._id,
        { $unset: { otpHash: 1, otpExpiry: 1 }, $set: { isPhoneVerified: true } }
      );

      return NextResponse.json({
        success: true,
        message: "OTP verified successfully.",
        user: { id: user._id, phone: user.phone, name: user.name, email: user.email },
      }, { headers: getRateLimitHeaders(rateLimit) });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("OTP API Error:", error.message);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}