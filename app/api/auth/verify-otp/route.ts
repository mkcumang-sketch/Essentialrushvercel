// app/api/auth/verify-otp/route.ts (or reset password route)
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/usertemp";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();
    await connectDB();

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanOtp = String(otp || "").trim();
    const cleanPassword = String(newPassword || "");

    // 🛡️ Replay Attack Fix: findOneAndUpdate with $unset (Atomic Burn)
    const user = await User.findOneAndUpdate(
      {
        email: { $eq: cleanEmail },
        resetOtp: { $eq: cleanOtp },
        otpExpiry: { $gt: new Date() } // Expired OTP check
      },
      {
        $unset: { resetOtp: 1, otpExpiry: 1 }, // Burn token instantly
        $set: { password: await bcrypt.hash(cleanPassword, 12) }
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid or expired OTP." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Password updated securely." });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}