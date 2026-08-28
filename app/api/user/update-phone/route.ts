export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import User from "@/models/usertemp";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { sanitizeString } from "@/lib/sanitize";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const cleanPhone = sanitizeString(body?.phone, 20).replace(/[^\d+]/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json({ success: false, error: "Please enter a valid phone number." }, { status: 400 });
    }

    await connectDB();

    const existingPhone = await User.findOne({
      phone: { $eq: cleanPhone },
      _id: { $ne: new mongoose.Types.ObjectId(userId) },
    }).select('_id').lean();

    if (existingPhone) {
      return NextResponse.json({ success: false, error: "This phone number is registered with another account." }, { status: 409 });
    }

    await User.findByIdAndUpdate(userId, { $set: { phone: cleanPhone } });
    return NextResponse.json({ success: true, message: "Phone number updated successfully.", phone: cleanPhone });
  } catch (error) {
    console.error("Update Phone Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error." }, { status: 500 });
  }
}