export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import mongoose, { Model } from "mongoose";
import { getToken } from "next-auth/jwt";
import { revalidatePath } from "next/cache";

import connectDB from "@/lib/mongodb";

// ======================================================
// REVIEW INTERFACE
// ======================================================

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

// ======================================================
// REVIEW SCHEMA
// ======================================================

const reviewSchema = new mongoose.Schema<IReview>(
  {
    userName: {
      type: String,
      required: true,
      trim: true,
    },

    userId: {
      type: String,
      index: true,
      sparse: true,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8000,
    },

    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },

    product: {
      type: String,
      default: "GLOBAL",
      trim: true,
    },

    visibility: {
      type: String,
      enum: ["pending", "public", "hidden"],
      default: "pending",
    },

    isAdminGenerated: {
      type: Boolean,
      default: false,
    },

    media: {
      type: [String],
      default: [],
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// ======================================================
// MONGOOSE MODEL
// ======================================================

const Review: Model<IReview> =
  (mongoose.models.Review as Model<IReview>) ||
  mongoose.model<IReview>("Review", reviewSchema);

// ======================================================
// AUTH TYPES
// ======================================================

interface AuthToken {
  id?: string;
  sub?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

// ======================================================
// GET AUTH TOKEN
// ======================================================

async function getAuthToken(
  req: NextRequest
): Promise<AuthToken | null> {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return null;
    }

    return token as AuthToken;
  } catch (error) {
    console.error("Auth token error:", error);
    return null;
  }
}

// ======================================================
// SUPER ADMIN CHECK
// ======================================================

async function isSuperAdminRequest(
  req: NextRequest
): Promise<boolean> {
  const token = await getAuthToken(req);
  return token?.role === "SUPER_ADMIN";
}

// ======================================================
// GET REVIEWS
// ======================================================

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

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

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

// ======================================================
// CREATE REVIEW (POST)
// ======================================================

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    if (typeof body.honeyPot === "string" && body.honeyPot.trim().length > 0) {
      return NextResponse.json(
        { success: false, message: "Security check failed." },
        { status: 400 }
      );
    }

    const token = await getAuthToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Sign in to leave a review." },
        { status: 401 }
      );
    }

    const userId = token.id || token.sub;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unable to identify your account." },
        { status: 401 }
      );
    }

    const userName =
      typeof body.userName === "string" && body.userName.trim().length > 0
        ? body.userName.trim().slice(0, 100)
        : token.name || "Member";

    const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 8000) : "";
    if (!comment) {
      return NextResponse.json(
        { success: false, message: "Please write a review before submitting." },
        { status: 400 }
      );
    }

    const parsedRating = Number(body.rating);
    const rating = Number.isFinite(parsedRating)
      ? Math.min(5, Math.max(1, Math.round(parsedRating)))
      : 5;

    const product =
      typeof body.product === "string" && body.product.trim().length > 0
        ? body.product.trim().slice(0, 200)
        : "GLOBAL";

    const media: string[] = Array.isArray(body.media)
      ? body.media.filter((item: unknown): item is string => typeof item === "string").slice(0, 10)
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
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Review Error:", error);
    return NextResponse.json(
      { success: false, error: "We could not submit your review. Try again." },
      { status: 500 }
    );
  }
}

// ======================================================
// UPDATE REVIEW (PUT instead of PATCH to match frontend)
// ======================================================

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
    const body = await req.json();

    // 🚀 FIX: Frontend sends 'id', not 'reviewId'
    const reviewId = typeof body.id === "string" ? body.id : "";
    const visibility = typeof body.visibility === "string" ? body.visibility : "";

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

// ======================================================
// DELETE REVIEW
// ======================================================

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

    // 🚀 FIX: Frontend sends ID in the URL (?id=...), not in the body
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

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