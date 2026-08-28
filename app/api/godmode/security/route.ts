export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { AiAlert } from "@/models/AiAlert";
import { AiIncident } from "@/models/AiIncident";
import { User } from "@/models/usertemp";
import { emitAiAlert, emitAiAuditLog } from "@/lib/ai-telemetry";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();

    const [alerts, incidents, activeUsersCount, failedAttemptsAlerts] = await Promise.all([
      AiAlert.find({ category: "SECURITY" }).sort({ createdAt: -1 }).limit(10).lean(),
      AiIncident.find({ status: "OPEN" }).sort({ frequency: -1 }).limit(5).lean(),
      User.countDocuments({ role: { $in: ["ADMIN", "SUPER_ADMIN", "STAFF", "AGENT"] } }),
      AiAlert.countDocuments({ category: "SECURITY", severity: { $in: ["HIGH", "CRITICAL"] }, isResolved: false }),
    ]);

    const eventLogs = alerts.map((a: any) => ({
      id: a._id.toString(),
      type: a.severity === "CRITICAL" ? "critical" : a.severity === "HIGH" ? "warning" : "success",
      message: `${a.title}: ${a.description}`,
      time: new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }));

    return NextResponse.json({
      success: true,
      data: {
        activeStaffSessions: activeUsersCount,
        failedAttempts: failedAttemptsAlerts,
        events: eventLogs,
        openIncidents: incidents.length,
      },
    });
  } catch (error: any) {
    console.error("Godmode Security GET Error:", error);
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
    const body = await req.json();
    const { action } = body;

    if (action === "LOCKDOWN") {
      await emitAiAlert({
        category: "SECURITY",
        severity: "CRITICAL",
        title: "EMERGENCY SYSTEM LOCKDOWN INITIATED",
        description: `Administrator ${session.user?.email} engaged global lockdown protocol.`,
        impact: "All unauthenticated routes and staff activities are under heightened restriction.",
        aiAnalysis: "Manual override triggered from Godmode Security panel.",
        recommendedAction: "Verify system integrity and release lockdown when threat is cleared.",
      });

      await emitAiAuditLog({
        agentName: "Security Agent",
        requestedOperation: "EMERGENCY_LOCKDOWN",
        decision: "System lockdown engaged.",
        toolUsed: "Godmode-Security-Override",
        permissionLevel: "APPROVAL",
        executedBy: session.user?.email || "SUPER_ADMIN",
        riskScore: 90,
        status: "SUCCESS",
        resultSummary: "Lockdown state recorded in immutable audit log.",
      });

      return NextResponse.json({ success: true, message: "Lockdown initiated successfully" });
    }

    if (action === "RELEASE_LOCKDOWN") {
      await emitAiAlert({
        category: "SECURITY",
        severity: "LOW",
        title: "System Lockdown Released",
        description: `Administrator ${session.user?.email} restored normal operations.`,
        impact: "Normal operational thresholds restored across all services.",
        aiAnalysis: "Security clearance granted by administrator.",
        recommendedAction: "Ensure standard monitoring continues.",
      });

      await emitAiAuditLog({
        agentName: "Security Agent",
        requestedOperation: "RELEASE_LOCKDOWN",
        decision: "System lockdown released.",
        toolUsed: "Godmode-Security-Override",
        permissionLevel: "APPROVAL",
        executedBy: session.user?.email || "SUPER_ADMIN",
        riskScore: 10,
        status: "SUCCESS",
        resultSummary: "System restored to normal state.",
      });

      return NextResponse.json({ success: true, message: "Lockdown released successfully" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Godmode Security POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}