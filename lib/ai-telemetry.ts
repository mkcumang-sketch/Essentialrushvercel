import connectDB from "@/lib/mongodb";
import { AiAlert, AlertCategory, AlertSeverity } from "@/models/AiAlert";
import { AiIncident, IncidentSeverity } from "@/models/AiIncident";
import { AiAuditLog, AiPermissionLevel } from "@/models/AiAuditLog";
import crypto from "crypto";

export interface TelemetryAlertInput {
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  impact: string;
  aiAnalysis: string;
  recommendedAction: string;
  affectedEntityId?: string;
}

export interface TelemetryIncidentInput {
  service: string;
  route: string;
  severity: IncidentSeverity;
  errorTitle: string;
  errorStack?: string;
  possibleCause: string;
  impact: string;
  recommendedFix: string;
}

export interface TelemetryAuditInput {
  agentName: string;
  requestedOperation: string;
  decision: string;
  toolUsed: string;
  permissionLevel: AiPermissionLevel;
  executedBy?: string;
  riskScore?: number;
  status?: "SUCCESS" | "FAILED" | "PENDING_APPROVAL" | "REJECTED";
  resultSummary?: string;
  dataAccessed?: Record<string, any>;
}

// 🛡️ Safe AI Alert Creator (Non-blocking)
export async function emitAiAlert(input: TelemetryAlertInput): Promise<void> {
  try {
    await connectDB();
    await AiAlert.create({
      category: input.category,
      severity: input.severity,
      title: input.title,
      description: input.description,
      impact: input.impact,
      aiAnalysis: input.aiAnalysis,
      recommendedAction: input.recommendedAction,
      affectedEntityId: input.affectedEntityId || null,
    });
  } catch (err) {
    console.error("Failed to emit AI Alert:", err);
  }
}

// 🛡️ Incident Aggregator (Groups duplicate error fingerprints)
export async function emitAiIncident(input: TelemetryIncidentInput): Promise<void> {
  try {
    await connectDB();
    const rawFingerprint = `${input.service}:${input.route}:${input.errorTitle}`;
    const fingerprint = crypto.createHash("sha256").update(rawFingerprint).digest("hex");

    const existingIncident = await AiIncident.findOne({
      fingerprint,
      status: { $in: ["OPEN", "INVESTIGATING"] },
    });

    if (existingIncident) {
      existingIncident.frequency += 1;
      existingIncident.lastSeenAt = new Date();
      if (input.errorStack) existingIncident.errorStack = input.errorStack;
      await existingIncident.save();
    } else {
      const incidentId = `INC-${Date.now().toString().slice(-6)}`;
      await AiIncident.create({
        incidentId,
        fingerprint,
        service: input.service,
        route: input.route,
        severity: input.severity,
        errorTitle: input.errorTitle,
        errorStack: input.errorStack || "",
        frequency: 1,
        possibleCause: input.possibleCause,
        impact: input.impact,
        recommendedFix: input.recommendedFix,
        status: "OPEN",
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      });
    }
  } catch (err) {
    console.error("Failed to record AI Incident:", err);
  }
}

// 🛡️ Immutable Audit Logger
export async function emitAiAuditLog(input: TelemetryAuditInput): Promise<void> {
  try {
    await connectDB();
    const actionId = `ACT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    await AiAuditLog.create({
      actionId,
      agentName: input.agentName,
      requestedOperation: input.requestedOperation,
      dataAccessed: input.dataAccessed || {},
      decision: input.decision,
      toolUsed: input.toolUsed,
      permissionLevel: input.permissionLevel,
      executedBy: input.executedBy || "AI_AUTO",
      riskScore: input.riskScore || 0,
      status: input.status || "SUCCESS",
      resultSummary: input.resultSummary || "",
    });
  } catch (err) {
    console.error("Failed to write AI Audit Log:", err);
  }
}