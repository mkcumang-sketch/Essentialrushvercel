export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import connectDB from "@/lib/mongodb";
import { ActivityLog } from "@/models/Enterprise";
import { NextResponse } from "next/server";
import mongoose, { Model } from "mongoose";

const ActivityLogModel = (ActivityLog || mongoose.models.ActivityLog) as Model<any>;

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 20;

    const logs = await ActivityLogModel.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(logs, { status: 200 });
  } catch (error: any) {
    console.error("Activity Logs API Error:", error.message);
    return NextResponse.json([], { status: 200 });
  }
}