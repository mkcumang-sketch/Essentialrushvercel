import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UserBehavior } from '@/models/UserBehavior';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose'; // 🚀 CRITICAL: ID check karne ke liye zaroori hai

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        // Agar user login nahi hai, toh empty items bhej do (crash mat karo)
        if (!session || !session.user) {
            return NextResponse.json({ success: true, items: [] });
        }

        await connectDB();

        // 🚀 THE ULTIMATE FIX: Model ko explicitly cast kiya taaki ts(2349) error na aaye
        const UserBehaviorModel = UserBehavior as mongoose.Model<any>;

        // 🚀 THE MAGIC FIX: Check karo ki ID valid MongoDB format (24 characters) mein hai ya nahi
        let behavior: any = null;
        if (mongoose.Types.ObjectId.isValid(session.user.id)) {
            // 🚀 FIX: UserBehavior ki jagah UserBehaviorModel use kiya
            behavior = await UserBehaviorModel.findOne({ userId: session.user.id }).lean();
        }

        // Agar user ka behavior database mein nahi mila, toh empty cart return karo
        if (!behavior) {
            return NextResponse.json({ success: true, items: [] }, { status: 200 });
        }

        return NextResponse.json({ success: true, items: behavior.cart || [] }, { status: 200 });

    } catch (error: any) {
        console.error("GET Cart Error:", error);
        // Error aane par bhi API ko fail hone se roko
        return NextResponse.json({ success: false, items: [] }, { status: 500 });
    }
}