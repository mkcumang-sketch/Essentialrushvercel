export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/usertemp';
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
export async function POST(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const body = await req.json();
        const code = body.code?.toUpperCase().trim();

        if (!code) {
            return NextResponse.json({ success: false, error: "Code is missing" });
        }

        // 🌟 1. GLOBAL BRAND CODES
        const globalCodes: Record<string, number> = {
            'ESSENTIAL10': 10,
            'WELCOME20': 20,
            'RUSH50': 50,
        };

        if (globalCodes[code]) {
            return NextResponse.json({
                success: true,
                type: 'global',
                discountValue: globalCodes[code],
                isReferral: false
            });
        }

        // 🌟 2. SECURE REFERRAL SYSTEM (REAL DB CHECK)
        // Ensure query is case-insensitive and sanitized
        const sanitizedCode = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const referrer = await User.findOne({
            myReferralCode: { $regex: new RegExp(`^${sanitizedCode}$`, 'i') }
        }).select('_id name');

        if (!referrer) {
            return NextResponse.json({ success: false, error: "This referral/promo code does not exist." }, { status: 404 });
        }

        // 🛡️ SECURITY: Prevent self-referral
        if (session?.user?.id && String(session.user.id) === String(referrer._id)) {
            return NextResponse.json({ success: false, error: "You cannot use your own referral code." }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            type: 'referral',
            discountValue: 10,
            isReferral: true
        });

    } catch (error) {
        console.error("Promo Verification Error:", error);
        return NextResponse.json({ success: false, error: "Server error during verification." }, { status: 500 });
    }
}