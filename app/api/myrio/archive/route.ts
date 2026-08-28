export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runMonthlyDataLifecycle } from "@/lib/myrio/data-lifecycle";
import connectDB from "@/lib/mongodb";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    const report = await runMonthlyDataLifecycle();

    return NextResponse.json({
      success: report.verificationStatus === "SUCCESS",
      message: report.verificationStatus === "SUCCESS" ? "Monthly archive and verification completed successfully." : "Archive verification failed. No data was deleted.",
      data: report,
    });
  } catch (error: any) {
    console.error("MYRIO Archive API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}