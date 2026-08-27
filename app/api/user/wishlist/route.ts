import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/usertemp'; // ⚠️ Apna sahi model name check kar lena
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // 🚀 THE FIX: Check if ID is Google OAuth or valid MongoDB ID
        if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
            // Agar id Mongoose format ka nahi hai, toh seedha empty wishlist bhej do
            return NextResponse.json({ success: true, wishlist: [] }, { status: 200 });
        }

        // 🚨 FIREWALL: Fetch user with populated wishlist
        const userRaw = await User.findById(session.user.id)
            .select('-password -__v')
            .populate({
                path: 'wishlist'
            }).lean();

        if (!userRaw) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, wishlist: (userRaw as any).wishlist || [] }, { status: 200 });

    } catch (error: any) {
        console.error("Get Wishlist Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}