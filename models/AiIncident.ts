import mongoose, { Schema, Model, Document } from "mongoose";

export type IncidentSeverity = "P0" | "P1" | "P2" | "P3";
export type IncidentStatus = "OPEN" | "INVESTIGATING" | "RESOLVED" | "IGNORED";

export interface IAiIncident extends Document {
  incidentId: string;
  fingerprint: string;
  service: string;
  route: string;
  severity: IncidentSeverity;
  errorTitle: string;
  errorStack?: string;
  frequency: number;
  possibleCause: string;
  impact: string;
  recommendedFix: string;
  status: IncidentStatus;
  firstSeenAt: Date;
  lastSeenAt: Date;
  resolvedAt?: Date;
  resolutionNotes?: string;
}

const AiIncidentSchema = new Schema<IAiIncident>(
  {
    incidentId: { type: String, required: true, unique: true, index: true },
    fingerprint: { type: String, required: true, unique: true, index: true },
    service: { type: String, required: true, index: true },
    route: { type: String, required: true },
    severity: {
      type: String,
      enum: ["P0", "P1", "P2", "P3"],
      default: "P2",
      index: true,
    },
    errorTitle: { type: String, required: true },
    errorStack: { type: String, default: "" },
    frequency: { type: Number, default: 1 },
    possibleCause: { type: String, default: "Analyzing telemetry..." },
    impact: { type: String, default: "Evaluating impact scope..." },
    recommendedFix: { type: String, default: "Diagnostic report in progress." },
    status: {
      type: String,
      enum: ["OPEN", "INVESTIGATING", "RESOLVED", "IGNORED"],
      default: "OPEN",
      index: true,
    },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now, index: true },
    resolvedAt: { type: Date, default: null },
    resolutionNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

AiIncidentSchema.index({ status: 1, severity: 1, lastSeenAt: -1 });

export const AiIncident: Model<IAiIncident> =
  (mongoose.models.AiIncident as Model<IAiIncident>) ||
  mongoose.model<IAiIncident>("AiIncident", AiIncidentSchema);

export default AiIncident;