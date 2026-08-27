import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import WithdrawalRequest from "@/models/WithdrawalRequest";

export async function POST(req: NextRequest) {
  await connectDB();

  return NextResponse.json({
    success: true,
  });
}