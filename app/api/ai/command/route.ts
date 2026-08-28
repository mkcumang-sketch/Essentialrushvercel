export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runFullSystemAudit, processAiAssistantQuery } from "@/lib/ai-engine/orchestrator";
import { AiAlert } from "@/models/AiAlert";
import { AiIncident } from "@/models/AiIncident";
import connectDB from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const auditData = await runFullSystemAudit();
    return NextResponse.json({ success: true, data: auditData });
  } catch (error: any) {
    console.error("AI Command GET Error:", error);
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
    const { action, query, alertId, incidentId } = body;

    // Action 1: Ask AI Command Assistant
    if (action === "QUERY" && query) {
      const response = await processAiAssistantQuery(query);
      return NextResponse.json({ success: true, response });
    }

    // Action 2: Resolve Alert
    if (action === "RESOLVE_ALERT" && alertId) {
      await AiAlert.findByIdAndUpdate(alertId, { $set: { isResolved: true } });
      return NextResponse.json({ success: true, message: "Alert marked as resolved" });
    }

    // Action 3: Resolve Incident
    if (action === "RESOLVE_INCIDENT" && incidentId) {
      await AiIncident.findByIdAndUpdate(incidentId, {
        $set: { status: "RESOLVED", resolvedAt: new Date(), resolutionNotes: "Resolved via Godmode AI Panel" },
      });
      return NextResponse.json({ success: true, message: "Incident resolved" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("AI Command POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}