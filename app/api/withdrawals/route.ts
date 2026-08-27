import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";

import connectDB from "@/lib/mongodb";
import WithdrawalRequest from "@/models/WithdrawalRequest";
import User from "@/models/usertemp";
import { authOptions } from "@/lib/auth";

// ============================================================
// CONFIG
// ============================================================

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const MIN_WITHDRAWAL = 100;
const MAX_WITHDRAWAL = 500000;

const ALLOWED_METHODS = ["UPI", "BANK"] as const;
const ALLOWED_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

type WithdrawalMethod = (typeof ALLOWED_METHODS)[number];
type WithdrawalStatus = (typeof ALLOWED_STATUSES)[number];

// ============================================================
// HELPERS
// ============================================================

function jsonError(
  error: string,
  status = 400,
  extra: Record<string, unknown> = {}
) {
  return NextResponse.json(
    {
      success: false,
      error,
      ...extra,
    },
    { status }
  );
}

function jsonSuccess(
  data: unknown,
  status = 200,
  extra: Record<string, unknown> = {}
) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...extra,
    },
    { status }
  );
}

function isValidObjectId(value: string) {
  return mongoose.Types.ObjectId.isValid(value);
}

function normalizeEmail(email?: string | null) {
  return String(email || "").trim().toLowerCase();
}

function normalizeMethod(value: unknown): WithdrawalMethod | null {
  const method = String(value || "").trim().toUpperCase();

  if (method !== "UPI" && method !== "BANK") {
    return null;
  }

  return method as WithdrawalMethod;
}

function normalizeStatus(value: unknown): WithdrawalStatus | null {
  const status = String(value || "").trim().toUpperCase();

  if (status !== "PENDING" && status !== "APPROVED" && status !== "REJECTED") {
    return null;
  }

  return status as WithdrawalStatus;
}

function parsePositiveAmount(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  if (amount <= 0) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null;
  }

  return req.headers.get("x-real-ip");
}

// ============================================================
// POST
// CREATE WITHDRAWAL REQUEST
// ============================================================

export async function POST(req: Request) {
  try {
    await connectDB();

    // --------------------------------------------------------
    // AUTH
    // --------------------------------------------------------

    const session = await getServerSession(authOptions);

    const email = normalizeEmail(session?.user?.email);

    if (!email) {
      return jsonError("Unauthorized", 401);
    }

    // --------------------------------------------------------
    // BODY
    // --------------------------------------------------------

    let body: Record<string, unknown>;

    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const amount = parsePositiveAmount(body.amount);
    const method = normalizeMethod(body.method);

    const details =
      typeof body.details === "string" ? body.details.trim() : "";

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (amount === null) {
      return jsonError("Please enter a valid withdrawal amount.", 400);
    }

    if (amount < MIN_WITHDRAWAL) {
      return jsonError(
        `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL.toLocaleString("en-IN")}.`,
        400
      );
    }

    if (amount > MAX_WITHDRAWAL) {
      return jsonError(
        `Maximum withdrawal amount is ₹${MAX_WITHDRAWAL.toLocaleString("en-IN")}.`,
        400
      );
    }

    if (!method) {
      return jsonError("Invalid payment method. Use UPI or BANK.", 400);
    }

    if (!details) {
      return jsonError("Payment details are required.", 400);
    }

    if (details.length > 1000) {
      return jsonError("Payment details are too long.", 400);
    }

    // --------------------------------------------------------
    // USER
    // --------------------------------------------------------

    const dbUser = await User.findOne({
      email,
    }).exec();

    if (!dbUser) {
      return jsonError("User not found in database.", 404);
    }

    // --------------------------------------------------------
    // WALLET BALANCE
    // --------------------------------------------------------

    const walletBalance = Number(dbUser.walletBalance) || 0;

    if (walletBalance < amount) {
      return jsonError("Insufficient wallet balance.", 400, {
        walletBalance,
        requestedAmount: amount,
      });
    }

    // --------------------------------------------------------
    // DUPLICATE PENDING REQUEST
    // --------------------------------------------------------

    const existingPending = await WithdrawalRequest.findOne({
      userId: dbUser._id,
      status: "PENDING",
    }).lean();

    if (existingPending) {
      return jsonError("You already have a pending withdrawal request.", 409, {
        existingRequestId: existingPending._id,
      });
    }

    // --------------------------------------------------------
    // CREATE REQUEST
    // --------------------------------------------------------

    const newRequest = await WithdrawalRequest.create({
      userId: dbUser._id,
      userEmail: email,
      amount,
      paymentMethod: {
        type: method,
        details,
      },
      status: "PENDING",
      createdIp: getClientIp(req),
    });

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return jsonSuccess(newRequest, 201);
  } catch (error) {
    console.error("Create Withdrawal Error:", error);

    return jsonError(
      error instanceof Error ? error.message : "Server error while creating withdrawal.",
      500
    );
  }
}

// ============================================================
// GET
// ADMIN FETCH WITHDRAWALS
// ============================================================

export async function GET(req: Request) {
  try {
    await connectDB();

    // --------------------------------------------------------
    // AUTH
    // --------------------------------------------------------

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return jsonError("Unauthorized", 401);
    }

    // --------------------------------------------------------
    // ADMIN CHECK
    // --------------------------------------------------------

    if ((session.user as any).role !== "SUPER_ADMIN") {
      return jsonError("Only SUPER_ADMIN can access withdrawals.", 403);
    }

    // --------------------------------------------------------
    // QUERY PARAMS
    // --------------------------------------------------------

    const { searchParams } = new URL(req.url);

    const statusParam = searchParams.get("status");
    const search = searchParams.get("search")?.trim() || "";
    const pageRaw = Number(searchParams.get("page") || 1);
    const limitRaw = Number(searchParams.get("limit") || 20);

    const page = Math.max(1, Number.isFinite(pageRaw) ? Math.floor(pageRaw) : 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 20)
    );

    // --------------------------------------------------------
    // BUILD QUERY
    // --------------------------------------------------------

    const query: Record<string, unknown> = {};

    const status = statusParam ? normalizeStatus(statusParam) : null;

    if (statusParam && !status) {
      return jsonError("Invalid status filter.", 400);
    }

    if (status) {
      query.status = status;
    }

    // Search by email / userId
    if (search) {
      // 🚀 Explicitly typed as any[] to avoid TypeScript union errors
      const searchConditions: any[] = [
        {
          userEmail: {
            $regex: search,
            $options: "i",
          },
        },
      ];

      if (isValidObjectId(search)) {
        searchConditions.push({
          userId: new mongoose.Types.ObjectId(search),
        });
      }

      query.$or = searchConditions;
    }

    // --------------------------------------------------------
    // TOTAL
    // --------------------------------------------------------

    const total = await WithdrawalRequest.countDocuments(query);
    const skip = (page - 1) * limit;

    // --------------------------------------------------------
    // DATA
    // --------------------------------------------------------

    const requests = await WithdrawalRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    // --------------------------------------------------------
    // SUMMARY
    // --------------------------------------------------------

    const summary = await WithdrawalRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]).exec();

    const summaryMap = {
      PENDING: { count: 0, amount: 0 },
      APPROVED: { count: 0, amount: 0 },
      REJECTED: { count: 0, amount: 0 },
    };

    for (const item of summary) {
      if (item._id === "PENDING" || item._id === "APPROVED" || item._id === "REJECTED") {
        // 🚀 "as keyof typeof summaryMap" lagane se TS error gayab ho jayega
        summaryMap[item._id as keyof typeof summaryMap] = {
          count: Number(item.count || 0),
          amount: Number(item.amount || 0),
        };
      }
    }

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return jsonSuccess(requests, 200, {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
      summary: summaryMap,
    });
  } catch (error) {
    console.error("Get Withdrawals Error:", error);

    return jsonError(
      error instanceof Error ? error.message : "Server error while fetching withdrawals.",
      500
    );
  }
}

// ============================================================
// PATCH
// APPROVE / REJECT WITHDRAWAL
// ============================================================

export async function PATCH(req: Request) {
  try {
    await connectDB();

    // --------------------------------------------------------
    // AUTH
    // --------------------------------------------------------

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return jsonError("Unauthorized", 401);
    }

    // --------------------------------------------------------
    // ADMIN CHECK
    // --------------------------------------------------------

    if ((session.user as any).role !== "SUPER_ADMIN") {
      return jsonError("Only SUPER_ADMIN can process withdrawals.", 403);
    }

    // --------------------------------------------------------
    // BODY
    // --------------------------------------------------------

    let body: Record<string, unknown>;

    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid JSON body.", 400);
    }

    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
    const status = normalizeStatus(body.status);
    const adminNotes = typeof body.adminNotes === "string" ? body.adminNotes.trim() : "";

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!requestId || !isValidObjectId(requestId)) {
      return jsonError("Invalid withdrawal request ID.", 400);
    }

    if (status !== "APPROVED" && status !== "REJECTED") {
      return jsonError("Status must be APPROVED or REJECTED.", 400);
    }

    if (adminNotes.length > 1000) {
      return jsonError("Admin notes are too long.", 400);
    }

    // --------------------------------------------------------
    // FIND REQUEST
    // --------------------------------------------------------

    const withdrawalRequest = await WithdrawalRequest.findById(requestId).exec();

    if (!withdrawalRequest) {
      return jsonError("Withdrawal request not found.", 404);
    }

    // --------------------------------------------------------
    // PROTECT DOUBLE PROCESSING
    // --------------------------------------------------------

    if (withdrawalRequest.status !== "PENDING") {
      return jsonError(`Request has already been ${String(withdrawalRequest.status).toLowerCase()}.`, 409);
    }

    // --------------------------------------------------------
    // REJECT
    // --------------------------------------------------------

    if (status === "REJECTED") {
      withdrawalRequest.status = "REJECTED";

      if (adminNotes) {
        (withdrawalRequest as any).adminNotes = adminNotes;
      }

      // 🚀 FIXED: Appended properties via 'as any' to avoid TS Interface errors
      (withdrawalRequest as any).processedAt = new Date();
      (withdrawalRequest as any).processedBy = session.user.email || "SUPER_ADMIN";

      await withdrawalRequest.save();

      return jsonSuccess(withdrawalRequest, 200, {
        message: "Withdrawal request rejected successfully.",
      });
    }

    // ========================================================
    // APPROVE
    // ========================================================

    const amount = Number(withdrawalRequest.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return jsonError("Invalid withdrawal amount stored in request.", 400);
    }

    // --------------------------------------------------------
    // ATOMIC WALLET DEDUCTION
    // --------------------------------------------------------

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: withdrawalRequest.userId,
        walletBalance: { $gte: amount },
      },
      {
        $inc: { walletBalance: -amount },
      },
      {
        new: true,
      }
    ).exec();

    // --------------------------------------------------------
    // INSUFFICIENT BALANCE
    // --------------------------------------------------------

    if (!updatedUser) {
      return jsonError("Insufficient wallet balance or user no longer exists.", 400);
    }

    // --------------------------------------------------------
    // UPDATE WITHDRAWAL
    // --------------------------------------------------------

    withdrawalRequest.status = "APPROVED";

    if (adminNotes) {
      (withdrawalRequest as any).adminNotes = adminNotes;
    }

    (withdrawalRequest as any).processedAt = new Date();
    (withdrawalRequest as any).processedBy = session.user.email || "SUPER_ADMIN"; // 🚀 FIXED typo '=sa'

    await withdrawalRequest.save();

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return jsonSuccess(withdrawalRequest, 200, {
      message: "Withdrawal approved and wallet balance deducted successfully.",
      wallet: {
        previousBalance: Number(updatedUser.walletBalance) + amount,
        deductedAmount: amount,
        remainingBalance: Number(updatedUser.walletBalance),
      },
    });
  } catch (error) {
    console.error("Update Withdrawal Error:", error);

    return jsonError(
      error instanceof Error ? error.message : "Server error while processing withdrawal.",
      500
    );
  }
}