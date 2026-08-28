import mongoose, { Schema, Model, Document } from "mongoose";

export type AiPermissionLevel = "READ" | "RECOMMEND" | "AUTO" | "APPROVAL" | "BLOCKED";

export interface IAiAuditLog extends Document {
  actionId: string;
  agentName: string;
  requestedOperation: string;
  dataAccessed?: Record<string, any>;
  decision: string;
  toolUsed: string;
  permissionLevel: AiPermissionLevel;
  executedBy: string; // "AI_AUTO" | User Email
  riskScore: number; // 0 - 100
  status: "SUCCESS" | "FAILED" | "PENDING_APPROVAL" | "REJECTED";
  resultSummary: string;
  createdAt: Date;
}

const AiAuditLogSchema = new Schema<IAiAuditLog>(
  {
    actionId: { type: String, required: true, unique: true, index: true },
    agentName: { type: String, required: true, index: true },
    requestedOperation: { type: String, required: true },
    dataAccessed: { type: Schema.Types.Mixed, default: {} },
    decision: { type: String, required: true },
    toolUsed: { type: String, required: true },
    permissionLevel: {
      type: String,
      enum: ["READ", "RECOMMEND", "AUTO", "APPROVAL", "BLOCKED"],
      required: true,
    },
    executedBy: { type: String, default: "AI_AUTO", index: true },
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PENDING_APPROVAL", "REJECTED"],
      default: "SUCCESS",
      index: true,
    },
    resultSummary: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AiAuditLogSchema.index({ createdAt: -1 });

export const AiAuditLog: Model<IAiAuditLog> =
  (mongoose.models.AiAuditLog as Model<IAiAuditLog>) ||
  mongoose.model<IAiAuditLog>("AiAuditLog", AiAuditLogSchema);

export default AiAuditLog;