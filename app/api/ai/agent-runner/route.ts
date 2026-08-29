export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  runMyrioOrderLogisticsAgent,
  runMyrioInventoryAgent,
  runMyrioCartRecoveryAgent,
} from "@/lib/myrio/agents";
import { generateSystemHealthReport } from "@/lib/myrio/self-health";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    const isAuthorizedAdmin = session?.user?.role === "SUPER_ADMIN";
    const isAuthorizedCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isAuthorizedAdmin && !isAuthorizedCron) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const [orderRes, inventoryRes, recoveryRes, healthRes] = await Promise.allSettled([
      runMyrioOrderLogisticsAgent(),
      runMyrioInventoryAgent(),
      runMyrioCartRecoveryAgent(),
      generateSystemHealthReport(),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      myrioAgents: {
        logistics: orderRes.status === "fulfilled" ? orderRes.value : null,
        inventory: inventoryRes.status === "fulfilled" ? inventoryRes.value : null,
        cartRecovery: recoveryRes.status === "fulfilled" ? recoveryRes.value : null,
        systemHealth: healthRes.status === "fulfilled" ? healthRes.value : null,
      },
    });
  } catch (error: any) {
    console.error("MYRIO Agent Runner Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}