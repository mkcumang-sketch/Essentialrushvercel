export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import mongoose, { Model, Schema } from "mongoose";
import { getToken } from "next-auth/jwt";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import { sanitizeString } from "@/lib/sanitize";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

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
      default: "pending",
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

interface AuthToken {
  id?: string;
  sub?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

async function getAuthToken(req: NextRequest): Promise<AuthToken | null> {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    return token ? (token as AuthToken) : null;
  } catch (error) {
    console.error("Auth token error:", error);
    return null;
  }
}

async function isSuperAdminRequest(req: NextRequest): Promise<boolean> {
  const token = await getAuthToken(req);
  return token?.role === "SUPER_ADMIN";
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const wantsAdminView = searchParams.get("admin") === "true";

    if (wantsAdminView) {
      const isAdmin = await isSuperAdminRequest(req);
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, error: "You do not have access to do that." },
          { status: 403 }
        );
      }
    }

    const query = wantsAdminView ? {} : { visibility: "public" };
    const reviews = await Review.find(query).sort({ createdAt: -1 }).lean().exec();

    return NextResponse.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("GET Reviews Error:", error);
    return NextResponse.json(
      { success: false, error: "We could not load reviews. Try again." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rateLimit = await checkRateLimit(ip, "user");

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Please try again shortly." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));

    // Honeypot bot protection
    if (typeof body.honeyPot === "string" && body.honeyPot.trim().length > 0) {
      return NextResponse.json(
        { success: false, message: "Security check failed." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const token = await getAuthToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Sign in to leave a review." },
        { status: 401, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const userId = token.id || token.sub;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unable to identify your account." },
        { status: 401, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const userName =
      typeof body.userName === "string" && body.userName.trim().length > 0
        ? sanitizeString(body.userName, 100)
        : sanitizeString(token.name, 100) || "Member";

    const comment = sanitizeString(body.comment, 8000);
    if (!comment) {
      return NextResponse.json(
        { success: false, message: "Please write a review before submitting." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const parsedRating = Number(body.rating);
    const rating = Number.isFinite(parsedRating)
      ? Math.min(5, Math.max(1, Math.round(parsedRating)))
      : 5;

    const product =
      typeof body.product === "string" && body.product.trim().length > 0
        ? sanitizeString(body.product, 200)
        : "GLOBAL";

    const media: string[] = Array.isArray(body.media)
      ? body.media
          .filter((item: unknown): item is string => typeof item === "string")
          .map((m: string) => sanitizeString(m, 500))
          .slice(0, 10)
      : [];

    const isAdminGenerated = token.role === "SUPER_ADMIN" && body.isAdminGenerated === true;

    const newReview = await Review.create({
      userName,
      userId,
      comment,
      rating,
      product,
      visibility: "pending",
      isAdminGenerated,
      media,
    });

    revalidatePath("/", "layout");

    return NextResponse.json(
      { success: true, data: newReview },
      { status: 201, headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error("POST Review Error:", error);
    return NextResponse.json(
      { success: false, error: "We could not submit your review. Try again." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const isAdmin = await isSuperAdminRequest(req);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "You do not have access to do that." },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));

    const reviewId = sanitizeString(body.id, 50);
    const visibility = sanitizeString(body.visibility, 20);

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json(
        { success: false, error: "Invalid review ID." },
        { status: 400 }
      );
    }

    const allowedVisibility = ["pending", "public", "hidden"] as const;
    if (!allowedVisibility.includes(visibility as any)) {
      return NextResponse.json(
        { success: false, error: "Invalid visibility value." },
        { status: 400 }
      );
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { visibility: visibility as IReview["visibility"] },
      { new: true, runValidators: true }
    ).exec();

    if (!updatedReview) {
      return NextResponse.json(
        { success: false, error: "Review not found." },
        { status: 404 }
      );
    }

    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      data: updatedReview,
    });
  } catch (error) {
    console.error("PUT Review Error:", error);
    return NextResponse.json(
      { success: false, error: "We could not update the review." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await isSuperAdminRequest(req);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "You do not have access to do that." },
        { status: 403 }
      );
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = sanitizeString(searchParams.get("id"), 50);

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid review ID." },
        { status: 400 }
      );
    }

    const deletedReview = await Review.findByIdAndDelete(id).exec();

    if (!deletedReview) {
      return NextResponse.json(
        { success: false, error: "Review not found." },
        { status: 404 }
      );
    }

    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      message: "Review removed successfully.",
    });
  } catch (error) {
    console.error("DELETE Review Error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}