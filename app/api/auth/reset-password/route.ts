import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/usertemp';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { email, otp, newPassword } = await req.json();
        await connectDB();

        const user = await User.findOne({ email });
        
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        // 🚀 BULLETPROOF COMPARISON: String mein convert karke check karo
        if (String(user.resetOtp).trim() !== String(otp).trim()) {
            return NextResponse.json({ success: false, message: "Invalid OTP! Please check your email again." }, { status: 400 });
        }

        // Expiry check (Buffer time ke saath)
        if (new Date() > new Date(user.otpExpiry!)) {
            return NextResponse.json({ success: false, message: "OTP has expired!" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        
        user.resetOtp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        return NextResponse.json({ success: true, message: "Password updated successfully!" });

    } catch (error) {
        console.error("Reset Password Error:", error);
        return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
    }
}