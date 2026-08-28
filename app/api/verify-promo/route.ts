export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/usertemp';
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { sanitizeString, escapeRegex } from '@/lib/sanitize';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(',')[0]?.trim() || "anonymous";
    const rateLimit = await checkRateLimit(ip, "user");

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Too many promo check attempts." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    await connectDB();
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => ({}));
    const code = sanitizeString(body.code, 30).toUpperCase();

    if (!code) {
      return NextResponse.json({ success: false, error: "Code is missing" }, { status: 400 });
    }

    // 1. Global Brand Promotion Codes
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
      }, { headers: getRateLimitHeaders(rateLimit) });
    }

    // 2. Database Referral Check (ReDoS & Injection Protected)
    const safeRegex = new RegExp(`^${escapeRegex(code)}$`, 'i');
    const referrer = await User.findOne({
      myReferralCode: { $regex: safeRegex }
    }).select('_id name').lean() as { _id: string; name: string } | null;

    if (!referrer) {
      return NextResponse.json(
        { success: false, error: "This promo/referral code is invalid or expired." },
        { status: 404, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 3. Prevent Self-Referral Exploitation
    if (session?.user?.id && String(session.user.id) === String(referrer._id)) {
      return NextResponse.json(
        { success: false, error: "You cannot apply your own referral link." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    return NextResponse.json({
      success: true,
      type: 'referral',
      discountValue: 10,
      isReferral: true
    }, { headers: getRateLimitHeaders(rateLimit) });

  } catch (error) {
    console.error("Promo Verification Error:", error);
    return NextResponse.json({ success: false, error: "Error validating promo code." }, { status: 500 });
  }
}