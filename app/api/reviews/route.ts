export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import mongoose, { Model, Schema } from "mongoose";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import { sanitizeString } from "@/lib/sanitize";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { authOptions } from "@/lib/auth";

interface IReview {
  userName: string;
  userId?: string;
  comment: string;
  rating: number;
  product: string;
  visibility: "pending" | "public" | "hidden";
  isAdminGenerated: boolean;
  media: string[];
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userName: { type: String, required: true, trim: true },
    userId: { type: String, index: true, sparse: true },
    comment: { type: String, required: true, trim: true, maxlength: 8000 },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    product: { type: String, default: "GLOBAL", trim: true },
    visibility: {
      type: String,
      enum: ["pending", "public", "hidden"],
      default: "public",
    },
    isAdminGenerated: { type: Boolean, default: false },
    media: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const Review: Model<IReview> =
  (mongoose.models.Review as Model<IReview>) ||
  mongoose.model<IReview>("Review", reviewSchema);

// 🛡️ Reliable Super Admin / Admin Auth Resolver
async function verifyAdminAuth(req: NextRequest): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    if (["SUPER_ADMIN", "ADMIN"].includes(sessionRole)) {
      return true;
    }

    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const tokenRole = (token as any)?.role;
    return ["SUPER_ADMIN", "ADMIN"].includes(tokenRole);
  } catch (error) {
    console.error("Admin Auth Error:", error);
    return false;
  }
}

// 1. GET: Fetch Reviews (Public vs Admin Console View)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const wantsAdminView = searchParams.get("admin") === "true";

    if (wantsAdminView) {
      const isAdmin = await verifyAdminAuth(req);
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, error: "Access denied. Admin clearance required." },
          { status: 403 }
        );
      }
    }

    const query = wantsAdminView ? {} : { visibility: "public" };
    const reviews = await Review.find(query).sort({ createdAt: -1 }).lean().exec();

    return NextResponse.json({
      success: true,
      data: reviews,
      reviews,
    });
  } catch (error: any) {
    console.error("GET Reviews Error:", error);
    return NextResponse.json(
      { success: false, error: "Could not load reviews." },
      { status: 500 }
    );
  }
}

// 2. POST: Create Review (Supports Customer submission & Godmode Admin generator)
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rateLimit = await checkRateLimit(ip, "user");

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Please wait." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));

    // Honeypot Protection
    if (typeof body.honeyPot === "string" && body.honeyPot.trim().length > 0) {
      return NextResponse.json(
        { success: false, message: "Security check failed." },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const userId = (session?.user as any)?.id || (token as any)?.id || (token as any)?.sub || "anonymous-patron";
    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes((session?.user as any)?.role || (token as any)?.role);

    const userName = sanitizeString(body.userName || session?.user?.name || (token as any)?.name || "Vault Patron", 100);
    const comment = sanitizeString(body.comment, 8000);

    if (!comment) {
      return NextResponse.json(
        { success: false, message: "Review comment cannot be empty." },
        { status: 400 }
      );
    }

    const parsedRating = Number(body.rating);
    const rating = Number.isFinite(parsedRating)
      ? Math.min(5, Math.max(1, Math.round(parsedRating)))
      : 5;

    const product = sanitizeString(body.product || "GLOBAL", 200);

    const media: string[] = Array.isArray(body.media)
      ? body.media
          .filter((item: unknown): item is string => typeof item === "string")
          .map((m: string) => sanitizeString(m, 500))
          .slice(0, 10)
      : [];

    const visibility = isAdmin ? (body.visibility || "public") : "pending";
    const isAdminGenerated = isAdmin && body.isAdminGenerated === true;

    const newReview = await Review.create({
      userName,
      userId,
      comment,
      rating,
      product,
      visibility,
      isAdminGenerated,
      media,
      createdAt: new Date(),
    });

    revalidatePath("/", "layout");

    return NextResponse.json(
      { success: true, data: newReview },
      { status: 201, headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error: any) {
    console.error("POST Review Error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to post review." },
      { status: 500 }
    );
  }
}

// 3. PUT: Update Status / Visibility (Approve, Hide, Edit)
export async function PUT(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(req);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin clearance required." },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));

    // Support both `id` and `_id`
    const reviewId = sanitizeString(body.id || body._id, 50);
    const visibility = sanitizeString(body.visibility, 20);

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json(
        { success: false, error: "Valid review ID is required." },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, any> = {};
    if (visibility && ["pending", "public", "hidden"].includes(visibility)) {
      updatePayload.visibility = visibility;
    }
    if (body.comment) {
      updatePayload.comment = sanitizeString(body.comment, 8000);
    }
    if (body.rating) {
      updatePayload.rating = Math.min(5, Math.max(1, Number(body.rating)));
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $set: updatePayload },
      { new: true, runValidators: true }
    ).exec();

    if (!updatedReview) {
      return NextResponse.json(
        { success: false, error: "Review record not found." },
        { status: 404 }
      );
    }

    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: "Review updated successfully.",
    });
  } catch (error: any) {
    console.error("PUT Review Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update review." },
      { status: 500 }
    );
  }
}

// 4. DELETE: Remove Review (Supports Query Param `?id=` / `?_id=` & JSON Body `{ id, _id }`)
export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(req);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin clearance required." },
        { status: 403 }
      );
    }

    await connectDB();

    // 1. Check Search Params
    const { searchParams } = new URL(req.url);
    let targetId = searchParams.get("id") || searchParams.get("_id");

    // 2. Fallback to JSON Body
    if (!targetId) {
      try {
        const body = await req.json();
        targetId = body?.id || body?._id;
      } catch {
        // Body reading error ignored
      }
    }

    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      return NextResponse.json(
        { success: false, error: "Valid Review ID required for deletion." },
        { status: 400 }
      );
    }

    const deletedReview = await Review.findByIdAndDelete(targetId).exec();

    if (!deletedReview) {
      return NextResponse.json(
        { success: false, error: "Review record not found in vault." },
        { status: 404 }
      );
    }

    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      message: "Review permanently removed.",
    });
  } catch (error: any) {
    console.error("DELETE Review Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete review." },
      { status: 500 }
    );
  }
}