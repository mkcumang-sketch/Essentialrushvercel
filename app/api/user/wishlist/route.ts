export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/usertemp';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: true, wishlist: [] }, { status: 200 });
    }

    await connectDB();

    const userRaw = await User.findById(userId)
      .select('-password -__v')
      .populate({ path: 'wishlist' })
      .lean() as any;

    if (!userRaw) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, wishlist: userRaw.wishlist || [] }, { status: 200 });
  } catch (error) {
    console.error("Get Wishlist Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}