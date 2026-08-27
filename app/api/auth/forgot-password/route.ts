import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/usertemp'; // Apne user model ka path check kar lena
import { sendEmail } from '@/lib/mail';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        await connectDB();

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        // 1. 6-digit ka random OTP generate karo
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 2. OTP aur Expiry (10 mins) Database mein save karo
        user.resetOtp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 
        await user.save();

        // 3. Premium look wala HTML Email template
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 40px 20px; background-color: #0A0A0A; color: #ffffff;">
                <h2 style="color: #D4AF37; font-style: italic;">Essential Rush</h2>
                <p style="color: #cccccc;">We received a request to reset your Vault password.</p>
                <div style="margin: 30px auto; padding: 20px; border: 1px solid #D4AF37; display: inline-block; border-radius: 10px;">
                    <p style="margin: 0; color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Your OTP Code</p>
                    <h1 style="color: #D4AF37; font-size: 48px; margin: 10px 0; letter-spacing: 8px;">${otp}</h1>
                </div>
                <p style="color: #888888; font-size: 12px;">This code is valid for exactly 10 minutes.</p>
                <p style="color: #888888; font-size: 12px;">If you didn't request this, please ignore this email securely.</p>
            </div>
        `;
        
        // 4. Email Send kar do
        await sendEmail(email, "Password Reset Vault Access - Essential Rush", emailHtml);

        return NextResponse.json({ success: true, message: "OTP sent to your email" });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
    }
}