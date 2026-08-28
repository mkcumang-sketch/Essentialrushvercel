export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/usertemp';
import connectDB from '@/lib/mongodb';
import { sanitizeString, escapeRegex } from '@/lib/sanitize';
import { sendReferralRewardEmail } from '@/lib/mail';

const UserModel = User as mongoose.Model<any>;

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Please sign in first." }, { status: 401 });
    }

    const body = await req.json();
    const referralCode = sanitizeString(body?.referralCode, 30).toUpperCase();

    if (!referralCode) {
      return NextResponse.json({ success: false, error: "Referral code is required." }, { status: 400 });
    }

    const currentUser = await UserModel.findById(userId).select('myReferralCode referredBy walletPoints name').lean() as any;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    if (currentUser.myReferralCode?.toUpperCase() === referralCode) {
      return NextResponse.json({ success: false, error: "You cannot use your own referral code." }, { status: 400 });
    }

    if (currentUser.referredBy) {
      return NextResponse.json({ success: false, error: "You have already redeemed a referral code." }, { status: 400 });
    }

    const safeRegex = new RegExp(`^${escapeRegex(referralCode)}$`, 'i');
    const referrer = await UserModel.findOne({ myReferralCode: safeRegex }).select('_id name email').lean() as any;

    if (!referrer) {
      return NextResponse.json({ success: false, error: "Invalid or nonexistent referral code." }, { status: 404 });
    }

    // 🛡️ Atomic check guarantees single redemption per user
    const updatedUser = await UserModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(userId),
        referredBy: { $exists: false },
      },
      {
        $set: { referredBy: referralCode },
        $inc: { walletPoints: 50 },
        $push: {
          notifications: {
            title: "🎁 Referral Bonus Applied!",
            desc: "₹500 discount unlocked on your acquisition.",
            unread: true,
            time: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: "Referral already applied." }, { status: 400 });
    }

    if (referrer.email) {
      sendReferralRewardEmail(referrer.email, referrer.name || 'Collector', currentUser.name || 'Member', 100).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Referral code applied!",
      data: {
        discount: 500,
        referralCode,
        newWalletBalance: updatedUser.walletPoints,
      },
    });
  } catch (error) {
    console.error("Referral Apply Error:", error);
    return NextResponse.json({ success: false, error: "Could not apply code." }, { status: 500 });
  }
}