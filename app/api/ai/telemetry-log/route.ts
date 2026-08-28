export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { emitAiIncident } from "@/lib/ai-telemetry";
import { sanitizeString } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const service = sanitizeString(body.service || "Frontend Client", 50);
    const route = sanitizeString(body.route || "/", 100);
    const errorTitle = sanitizeString(body.errorTitle || "Unhandled Error", 200);
    const errorStack = sanitizeString(body.errorStack || "", 1000);
    const possibleCause = sanitizeString(body.possibleCause || "Client runtime error.", 200);
    const impact = sanitizeString(body.impact || "Degraded user experience.", 200);
    const recommendedFix = sanitizeString(body.recommendedFix || "Review client code trace.", 200);

    // Dispatch to incident aggregator (Groups identical fingerprints)
    await emitAiIncident({
      service,
      route,
      severity: "P2",
      errorTitle,
      errorStack,
      possibleCause,
      impact,
      recommendedFix,
    });

    return NextResponse.json({ success: true, message: "Telemetry captured" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}