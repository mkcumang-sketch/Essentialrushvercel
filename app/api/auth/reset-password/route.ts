import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/usertemp';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Email, OTP, and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    await connectDB();

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // Query with case-insensitive / trimmed email
    const user = (await User.findOne({ email: cleanEmail })) as any;

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Account not found." },
        { status: 404 }
      );
    }

    // 1. Guard check: Make sure OTP was actually requested
    if (!user.resetOtp) {
      return NextResponse.json(
        { success: false, message: "No password reset request found. Please request a new OTP." },
        { status: 400 }
      );
    }

    // 2. Expiry check first
    if (user.otpExpiry && new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json(
        { success: false, message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // 3. Strict string comparison
    if (String(user.resetOtp).trim() !== cleanOtp) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP! Please check and try again." },
        { status: 400 }
      );
    }

    // 4. Hash new password & clear OTP fields
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await User.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetOtp: 1, otpExpiry: 1 },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Password updated successfully! Please log in.",
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error. Please try again." },
      { status: 500 }
    );
  }
}