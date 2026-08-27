import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/usertemp";

export async function POST(req: Request) {
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
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins validity

      await User.findOneAndUpdate(
        { phone: cleanPhone },
        { $set: { otp: generatedOtp, otpExpiry } },
        { upsert: true, new: true }
      );

      console.log(`[VAULT OTP] Code for ${cleanPhone}: ${generatedOtp}`);

      return NextResponse.json({
        success: true,
        message: "OTP sent successfully.",
      });
    }

    // 2. VERIFY OTP ACTION
    if (action === "verify") {
      if (!otp) {
        return NextResponse.json(
          { success: false, error: "Please enter the OTP." },
          { status: 400 }
        );
      }

      const cleanInputOtp = String(otp).trim();
      const user = (await User.findOne({ phone: cleanPhone })) as any;

      if (!user || !user.otp) {
        return NextResponse.json(
          { success: false, error: "No OTP request found for this number." },
          { status: 404 }
        );
      }

      // Check Expiration
      if (user.otpExpiry && new Date() > new Date(user.otpExpiry)) {
        return NextResponse.json(
          { success: false, error: "OTP has expired. Please request a new one." },
          { status: 400 }
        );
      }

      // Strict String Comparison
      if (String(user.otp).trim() !== cleanInputOtp) {
        return NextResponse.json(
          { success: false, error: "Invalid OTP. Please check and try again." },
          { status: 400 }
        );
      }

      // Clear OTP after successful verification
      await User.updateOne(
        { _id: user._id },
        { $unset: { otp: 1, otpExpiry: 1 }, $set: { isPhoneVerified: true } }
      );

      return NextResponse.json({
        success: true,
        message: "OTP verified successfully.",
        user: { id: user._id, phone: user.phone, name: user.name, email: user.email },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("OTP API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}