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

        // 🚀 THE FIX: Prevent crash if ID is from Google
        if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
            return NextResponse.json({ success: true, addresses: [] }, { status: 200 });
        }

        // 🚨 FIREWALL: Fetch user with security
        const userRaw = await User.findById(session.user.id).select('-password -__v').lean();
        
        if (!userRaw || Array.isArray(userRaw)) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        // Return user addresses (or empty array if none exist)
        return NextResponse.json({ success: true, addresses: (userRaw as any).addresses || [] }, { status: 200 });

    } catch (error: any) {
        console.error("Get Addresses Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}