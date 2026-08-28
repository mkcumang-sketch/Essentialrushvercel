export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateSystemHealthReport } from "@/lib/myrio/self-health";
import connectDB from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    const healthReport = await generateSystemHealthReport();

    return NextResponse.json({ success: true, data: healthReport });
  } catch (error: any) {
    console.error("MYRIO Self-Health API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}