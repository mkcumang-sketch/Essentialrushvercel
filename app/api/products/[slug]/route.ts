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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 50 * 1024) {
      return NextResponse.json({ success: false, error: "Payload too large" }, { status: 413 });
    }

    await connectDB();
    const { slug } = await params;
    const cleanSlug = sanitizeString(slug, 100);

    if (!cleanSlug) {
      return NextResponse.json({ success: false, error: "Missing product identifier." }, { status: 400 });
    }

    const dataToUpdate = await req.json();
    let updatedProduct: any = null;

    if (mongoose.Types.ObjectId.isValid(cleanSlug)) {
      updatedProduct = await Product.findByIdAndUpdate(
        cleanSlug,
        { $set: dataToUpdate },
        { new: true, runValidators: true }
      );
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
      );
    }

    if (!updatedProduct) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
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

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}