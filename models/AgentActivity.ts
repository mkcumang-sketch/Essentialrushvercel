import mongoose from "mongoose";

const AgentActivitySchema = new mongoose.Schema(
  {
    agentId: { type: String, required: true, index: true },
    agentEmail: { type: String, required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    clockIn: { type: Date, default: null },
    clockOut: { type: Date, default: null },
    status: { type: String, enum: ["PRESENT", "HALF_DAY", "ABSENT"], default: "PRESENT" },
  },
  { timestamps: true }
);

export const AgentActivity =
  mongoose.models.AgentActivity || mongoose.model("AgentActivity", AgentActivitySchema);