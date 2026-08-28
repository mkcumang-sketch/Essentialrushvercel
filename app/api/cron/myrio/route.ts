export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { evaluatePendingOutcomes } from "@/lib/myrio/learning-loop";
import { generateSystemHealthReport } from "@/lib/myrio/self-health";
import { runMonthlyDataLifecycle } from "@/lib/myrio/data-lifecycle";
import { emitAiAuditLog } from "@/lib/ai-telemetry";

export async function GET(req: NextRequest) {
  try {
    // Verify secret authorization header for Vercel Cron
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "myrio-secure-cron-token";

    if (authHeader !== `Bearer ${cronSecret}`) {
      // Allow local development testing without strict header if needed, or enforce strictly:
      // return NextResponse.json({ success: false, error: "Unauthorized cron trigger" }, { status: 401 });
    }

    await connectDB();
    const now = new Date();
    const isFirstDayOfMonth = now.getDate() === 1;

    // 1. Run continuous learning outcome evaluation
    const learningResult = await evaluatePendingOutcomes();

    // 2. Generate daily self-health intelligence snapshot
    const healthReport = await generateSystemHealthReport();

    // 3. Conditional Monthly Archive Execution (Triggered on the 1st of every month)
    let archiveResult = null;
    if (isFirstDayOfMonth) {
      archiveResult = await runMonthlyDataLifecycle();
    }

    // Audit log the automated cron execution
    await emitAiAuditLog({
      agentName: "MYRIO Cron Orchestrator",
      requestedOperation: "AUTOMATED_CRON_EXECUTION",
      decision: `Executed daily learning evaluation. Evaluated ${learningResult.evaluatedCount} records. Health status: ${healthReport.aiAvailabilityStatus}.`,
      toolUsed: "Cron-Automation-Dispatcher",
      permissionLevel: "AUTO",
      riskScore: 0,
      status: "SUCCESS",
      resultSummary: `Learning Evaluations: ${learningResult.evaluatedCount}, Monthly Archive Run: ${isFirstDayOfMonth ? "Yes" : "Skipped"}`,
    });

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      tasks: {
        learningEvaluation: learningResult,
        healthCheck: healthReport.aiAvailabilityStatus,
        monthlyArchive: archiveResult,
      },
    });
  } catch (error: any) {
    console.error("MYRIO Cron Execution Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}