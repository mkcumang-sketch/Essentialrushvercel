import mongoose, { Schema, Model, Document } from "mongoose";

export interface IMyrioChatMessage {
  sender: "CUSTOMER" | "MYRIO" | "HUMAN_SUPPORT";
  text: string;
  timestamp: Date;
}

export interface IMyrioCustomerSession extends Document {
  sessionId: string;
  userId?: string | null;
  customerEmail?: string | null;
  messages: IMyrioChatMessage[];
  isEscalatedToHuman: boolean;
  escalationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MyrioChatMessageSchema = new Schema<IMyrioChatMessage>(
  {
    sender: { type: String, enum: ["CUSTOMER", "MYRIO", "HUMAN_SUPPORT"], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MyrioCustomerSessionSchema = new Schema<IMyrioCustomerSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, default: null, index: true },
    customerEmail: { type: String, default: null, index: true },
    messages: { type: [MyrioChatMessageSchema], default: [] },
    isEscalatedToHuman: { type: Boolean, default: false, index: true },
    escalationReason: { type: String, default: "" },
  },
  { timestamps: true }
);

export const MyrioCustomerSession: Model<IMyrioCustomerSession> =
  (mongoose.models.MyrioCustomerSession as Model<IMyrioCustomerSession>) ||
  mongoose.model<IMyrioCustomerSession>("MyrioCustomerSession", MyrioCustomerSessionSchema);

export default MyrioCustomerSession;