import mongoose, {
  Schema,
  Model,
  Document,
} from "mongoose";

// ======================================================
// PAYMENT METHOD TYPES
// ======================================================

export type WithdrawalPaymentMethod =
  "UPI" | "BANK";

export type WithdrawalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

// ======================================================
// PAYMENT METHOD INTERFACE
// ======================================================

export interface IWithdrawalPaymentMethod {
  type: WithdrawalPaymentMethod;
  details: string;
}

// ======================================================
// WITHDRAWAL REQUEST INTERFACE
// ======================================================

export interface IWithdrawalRequest
  extends Document {
  userId: mongoose.Types.ObjectId;

  amount: number;

  paymentMethod: IWithdrawalPaymentMethod;

  status: WithdrawalStatus;

  adminNotes?: string;

  createdAt: Date;

  updatedAt: Date;
}

// ======================================================
// SCHEMA
// ======================================================

const WithdrawalRequestSchema =
  new Schema<IWithdrawalRequest>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      paymentMethod: {
        type: {
          type: String,
          enum: ["UPI", "BANK"],
          required: true,
        },

        details: {
          type: String,
          required: true,
          trim: true,
        },
      },

      status: {
        type: String,
        enum: [
          "PENDING",
          "APPROVED",
          "REJECTED",
        ],
        default: "PENDING",
        index: true,
      },

      adminNotes: {
        type: String,
        default: "",
      },
    },
    {
      timestamps: true,
    }
  );

// ======================================================
// TYPED MODEL
// ======================================================
//
// IMPORTANT:
// This is the main fix for TS2349.
//
// Instead of:
//
// mongoose.models.WithdrawalRequest ||
// mongoose.model(...)
//
// we explicitly tell TypeScript that this is:
//
// Model<IWithdrawalRequest>
// ======================================================

const WithdrawalRequest =
  (mongoose.models
    .WithdrawalRequest as Model<IWithdrawalRequest>) ||
  mongoose.model<IWithdrawalRequest>(
    "WithdrawalRequest",
    WithdrawalRequestSchema
  );

export default WithdrawalRequest;