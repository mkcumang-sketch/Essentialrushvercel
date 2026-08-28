export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import mongoose, { Model } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { sanitizeString } from "@/lib/sanitize";

const ProductSchema =
  mongoose.models.Product?.schema ??
  new mongoose.Schema({}, { strict: false });

const Product: Model<any> =
  mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;
    const cleanSlug = sanitizeString(slug, 100);

    if (!cleanSlug) {
      return NextResponse.json(
        { success: false, error: "Missing product identifier." },
        { status: 400 }
      );
    }

    const query = mongoose.Types.ObjectId.isValid(cleanSlug)
      ? {
          $or: [
            { _id: new mongoose.Types.ObjectId(cleanSlug) },
            { slug: { $eq: cleanSlug } },
            { id: { $eq: cleanSlug } },
          ],
        }
      : {
          $or: [
            { slug: { $eq: cleanSlug } },
            { id: { $eq: cleanSlug } },
          ],
        };

    const product = await Product.findOne(query).lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error("GET Product Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
        { status: 403 }
      );
    }

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 50 * 1024) {
      return NextResponse.json(
        { success: false, error: "Payload too large." },
        { status: 413 }
      );
    }

    await connectDB();
    const { slug } = await params;
    const cleanSlug = sanitizeString(slug, 100);

    if (!cleanSlug) {
      return NextResponse.json(
        { success: false, error: "Missing product identifier." },
        { status: 400 }
      );
    }

    const dataToUpdate = await req.json();
    let updatedProduct: any = null;

    if (mongoose.Types.ObjectId.isValid(cleanSlug)) {
      updatedProduct = await Product.findByIdAndUpdate(
        cleanSlug,
        { $set: dataToUpdate },
        { new: true, runValidators: true }
      ).lean();
    }

    if (!updatedProduct) {
      updatedProduct = await Product.findOneAndUpdate(
        {
          $or: [
            { id: { $eq: cleanSlug } },
            { slug: { $eq: cleanSlug } },
          ],
        },
        { $set: dataToUpdate },
        { new: true, runValidators: true }
      ).lean();
    }

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully.",
      product: updatedProduct,
    });
  } catch (error: any) {
    console.error("PATCH Product Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}