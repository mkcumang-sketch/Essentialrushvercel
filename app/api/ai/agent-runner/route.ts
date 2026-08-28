export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  runSecurityAgentAudit,
  runOrderLogisticsAgent,
  runInventoryDepletionAgent,
  runAbandonedCartRecoveryAgent,
} from "@/lib/ai-engine/agents";

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

    // Execute All 4 Specialized Agents in Parallel
    const [securityRes, orderRes, inventoryRes, recoveryRes] = await Promise.allSettled([
      runSecurityAgentAudit(),
      runOrderLogisticsAgent(),
      runInventoryDepletionAgent(),
      runAbandonedCartRecoveryAgent(),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      agentResults: {
        security: securityRes.status === "fulfilled" ? securityRes.value : null,
        logistics: orderRes.status === "fulfilled" ? orderRes.value : null,
        inventory: inventoryRes.status === "fulfilled" ? inventoryRes.value : null,
        cartRecovery: recoveryRes.status === "fulfilled" ? recoveryRes.value : null,
      },
    });
  } catch (error: any) {
    console.error("AI Agent Runner Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}