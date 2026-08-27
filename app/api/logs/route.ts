export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import connectDB from "@/lib/mongodb"; // Aapka standard db connection import
import { ActivityLog } from "@/models/Enterprise";
import { NextResponse } from "next/server";
import mongoose from "mongoose"; // 🚀 FIX: mongoose import kiya model casting ke liye

// 🚀 THE ULTIMATE FIX: ActivityLog ko explicitly cast kiya taaki ts(2349) error hat jaye
const ActivityLogModel = ActivityLog as mongoose.Model<any>;

export async function GET(req: Request) {
    try {
        await connectDB();

        // 💎 ENHANCEMENT: Dynamic limit support via URL params (default is 20)
        const { searchParams } = new URL(req.url);
        const limitParam = searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam, 10) : 20;

        // 💎 ENHANCEMENT: Added .lean() for lightning-fast database read operations
        const logs = await ActivityLogModel.find({})
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean(); 

        return NextResponse.json(logs, { status: 200 });
    } catch (error: any) {
        // 💎 ENHANCEMENT: Added proper server-side error logging
        console.error("❌ Activity Logs API Error:", error.message);
        return NextResponse.json([], { status: 200 });
    }
}