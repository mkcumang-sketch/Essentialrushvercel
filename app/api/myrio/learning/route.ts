export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeLearningMetrics, evaluatePendingOutcomes } from "@/lib/myrio/learning-loop";
import connectDB from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    const metrics = await computeLearningMetrics();

    return NextResponse.json({ success: true, data: metrics });
  } catch (error: any) {
    console.error("MYRIO Learning API GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    const result = await evaluatePendingOutcomes();

    return NextResponse.json({
      success: true,
      message: `Evaluation completed. Evaluated ${result.evaluatedCount} records, derived ${result.newLearningsDerived} memory insights.`,
      data: result,
    });
  } catch (error: any) {
    console.error("MYRIO Learning API POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}