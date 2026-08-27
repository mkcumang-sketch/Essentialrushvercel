export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '@/models/usertemp';
import { z } from 'zod';
import { authRateLimit } from '@/lib/ratelimit';

// 🛡️ REGISTRATION VALIDATION SCHEMA
const registerSchema = z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    password: z.string().min(6),
});

// Helper to generate referral code
const generateReferralCode = (name: string) => {
    const prefix = name.split(' ')[0].toUpperCase().slice(0, 4).replace(/[^A-Z0-9]/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `ESS${prefix}${random}`.replace(/[^A-Z0-9]/g, '').substring(0, 8);
};

export async function POST(req: Request) {
    try {
        // 0. RATE LIMITING (Anti-Bot)
        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        const { success } = await authRateLimit.limit(ip);
        if (!success) {
            return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
        }

        // Connect to MongoDB
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI as string);
        }

        const body = await req.json();
        
        // 1. Zod Validation (Sanitization)
        const validation = registerSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, error: "Invalid registration data. Please check all fields." }, { status: 400 });
        }
        const { name, phone, password } = validation.data;

        // Check if user already exists
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return NextResponse.json({ success: false, error: "Account with this phone number already exists!" }, { status: 400 });
        }

        // Encrypt the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user in MongoDB
        await User.create({
            name,
            phone,
            password: hashedPassword,
            role: 'USER',
            myReferralCode: generateReferralCode(name),
            walletPoints: 500, // Welcome bonus
            totalEarned: 0,
            loyaltyTier: 'Silver Vault'
        });

        return NextResponse.json({ success: true, message: "Your account is ready!" }, { status: 201 });

    } catch (error: any) {
        console.error("Registration Error:", error);
        return NextResponse.json({ success: false, error: "We could not create your account. Try again." }, { status: 500 });
    }
}