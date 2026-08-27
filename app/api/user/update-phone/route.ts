export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import User from "@/models/usertemp";
import mongoose from "mongoose";

export async function POST(req: Request) {
    try {
        // 1. Check if user is legally logged in
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Please sign in." }, { status: 401 });
        }

        const { phone } = await req.json();
        if (!phone || phone.length < 10) {
            return NextResponse.json({ error: "Please enter a valid phone number" }, { status: 400 });
        }

        // 2. Connect to DB
        if (mongoose.connection.readyState < 1) {
            await mongoose.connect(process.env.MONGODB_URI as string);
        }

        // 3. Check if someone else is already using this phone number (SECURITY: Exclude sensitive fields)
        const existingPhone = await User.findOne({ phone }).select('-password -__v');
        if (existingPhone) {
            return NextResponse.json({ error: "This phone number is already registered!" }, { status: 400 });
        }

        // 4. Update the current user's phone number
        await User.findByIdAndUpdate((session.user as any).id, { phone });

        return NextResponse.json({ success: true, message: "Phone number saved." });

    } catch (error) {
        console.error("Update Phone Error:", error);
        return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
    }
}