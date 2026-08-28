import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import WithdrawalRequest from "@/models/WithdrawalRequest";
import User from "@/models/usertemp";
import { authOptions } from "@/lib/auth";
import { sanitizeString, escapeRegex } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const MIN_WITHDRAWAL = 100;
const MAX_WITHDRAWAL = 500000;
const ALLOWED_METHODS = ["UPI", "BANK"] as const;

type WithdrawalMethod = (typeof ALLOWED_METHODS)[number];

function jsonError(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ success: false, error, ...extra }, { status });
}

function jsonSuccess(data: unknown, status = 200, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ success: true, data, ...extra }, { status });
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const email = sanitizeString(session?.user?.email, 100).toLowerCase();

    if (!email) return jsonError("Unauthorized", 401);

    const body = await req.json().catch(() => null);
    if (!body) return jsonError("Invalid JSON body", 400);

    const amount = Math.round((Number(body.amount) || 0) * 100) / 100;
    const method = String(body.method || "").trim().toUpperCase() as WithdrawalMethod;
    const details = sanitizeString(body.details, 1000);

    if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL || amount > MAX_WITHDRAWAL) {
      return jsonError(`Amount must be between ₹${MIN_WITHDRAWAL} and ₹${MAX_WITHDRAWAL.toLocaleString('en-IN')}`, 400);
    }

    if (!ALLOWED_METHODS.includes(method)) {
      return jsonError("Invalid payment method. Use UPI or BANK.", 400);
    }

    if (!details) return jsonError("Payment account details are required.", 400);

    const dbUser = await User.findOne({ email: { $eq: email } }).exec();
    if (!dbUser) return jsonError("User not found.", 404);

    const walletBalance = Number(dbUser.walletBalance) || 0;
    if (walletBalance < amount) {
      return jsonError("Insufficient wallet balance.", 400, { walletBalance, requestedAmount: amount });
    }

    const existingPending = await WithdrawalRequest.findOne({
      userId: dbUser._id,
      status: "PENDING",
    }).lean();

    if (existingPending) {
      return jsonError("You already have a pending withdrawal request.", 409);
    }

    const newRequest = await WithdrawalRequest.create({
      userId: dbUser._id,
      userEmail: email,
      amount,
      paymentMethod: { type: method, details },
      status: "PENDING",
      createdIp: req.headers.get("x-forwarded-for")?.split(',')[0]?.trim() || "anonymous",
    });

    return jsonSuccess(newRequest, 201);
  } catch (error) {
    console.error("Create Withdrawal Error:", error);
    return jsonError("Server error while initiating withdrawal request.", 500);
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return jsonError("Forbidden: Only SUPER_ADMIN can view requests.", 403);
    }

    const { searchParams } = new URL(req.url);
    const statusParam = sanitizeString(searchParams.get("status"), 20).toUpperCase();
    const search = sanitizeString(searchParams.get("search"), 100);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const query: Record<string, unknown> = {};

    if (["PENDING", "APPROVED", "REJECTED"].includes(statusParam)) {
      query.status = statusParam;
    }

    if (search) {
      const safeSearchRegex = new RegExp(escapeRegex(search), 'i');
      const searchConditions: any[] = [{ userEmail: { $regex: safeSearchRegex } }];

      if (mongoose.Types.ObjectId.isValid(search)) {
        searchConditions.push({ userId: new mongoose.Types.ObjectId(search) });
      }
      query.$or = searchConditions;
    }

    const total = await WithdrawalRequest.countDocuments(query);
    const requests = await WithdrawalRequest.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    const summary = await WithdrawalRequest.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } }
    ]);

    const summaryMap = {
      PENDING: { count: 0, amount: 0 },
      APPROVED: { count: 0, amount: 0 },
      REJECTED: { count: 0, amount: 0 },
    };

    for (const item of summary) {
      if (item._id in summaryMap) {
        summaryMap[item._id as keyof typeof summaryMap] = {
          count: Number(item.count || 0),
          amount: Number(item.amount || 0),
        };
      }
    }

    return jsonSuccess(requests, 200, {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: summaryMap,
    });
  } catch (error) {
    console.error("Get Withdrawals Error:", error);
    return jsonError("Server error while fetching requests.", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return jsonError("Forbidden: Only SUPER_ADMIN can execute decisions.", 403);
    }

    const body = await req.json().catch(() => null);
    if (!body) return jsonError("Invalid JSON", 400);

    const requestId = sanitizeString(body.requestId, 50);
    const status = sanitizeString(body.status, 20).toUpperCase();
    const adminNotes = sanitizeString(body.adminNotes, 500);

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return jsonError("Invalid withdrawal request ID.", 400);
    }

    if (status !== "APPROVED" && status !== "REJECTED") {
      return jsonError("Status must be APPROVED or REJECTED.", 400);
    }

    const withdrawalRequest = await WithdrawalRequest.findById(requestId).exec();
    if (!withdrawalRequest) return jsonError("Request not found.", 404);

    if (withdrawalRequest.status !== "PENDING") {
      return jsonError(`Request is already marked as ${withdrawalRequest.status}.`, 409);
    }

    if (status === "REJECTED") {
      withdrawalRequest.status = "REJECTED";
      (withdrawalRequest as any).adminNotes = adminNotes;
      (withdrawalRequest as any).processedAt = new Date();
      (withdrawalRequest as any).processedBy = session.user.email || "SUPER_ADMIN";
      await withdrawalRequest.save();

      return jsonSuccess(withdrawalRequest, 200, { message: "Withdrawal rejected." });
    }

    // 🛡️ ATOMIC DECREMENT WITH GTE GUARD (Race-condition / Double Spending Prevention)
    const amount = Number(withdrawalRequest.amount);
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: withdrawalRequest.userId,
        walletBalance: { $gte: amount },
      },
      {
        $inc: { walletBalance: -amount },
      },
      { new: true }
    ).exec();

    if (!updatedUser) {
      return jsonError("Insufficient balance in user wallet for approval.", 400);
    }

    withdrawalRequest.status = "APPROVED";
    (withdrawalRequest as any).adminNotes = adminNotes;
    (withdrawalRequest as any).processedAt = new Date();
    (withdrawalRequest as any).processedBy = session.user.email || "SUPER_ADMIN";
    await withdrawalRequest.save();

    return jsonSuccess(withdrawalRequest, 200, {
      message: "Withdrawal approved and funds deducted.",
      remainingBalance: updatedUser.walletBalance,
    });
  } catch (error) {
    console.error("Process Withdrawal Error:", error);
    return jsonError("Server error processing withdrawal.", 500);
  }
}