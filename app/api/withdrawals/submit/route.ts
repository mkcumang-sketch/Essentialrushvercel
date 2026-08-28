export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

export async function POST() {
  await connectDB();
  return NextResponse.json({ success: true, message: "Withdrawal endpoint online" });
}