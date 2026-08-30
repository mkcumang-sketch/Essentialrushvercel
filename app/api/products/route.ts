export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { Product } from "@/models/Product";
import mongoose from "mongoose";

// GET ALL PRODUCTS OR SINGLE PRODUCT BY ID/SLUG
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const ProductModel = Product as mongoose.Model<any>;

    if (id) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
      const product = await ProductModel.findOne(query).lean();
      if (!product) {
        return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: product, product });
    }

    const products = await ProductModel.find({}).sort({ priority: -1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// SAVE / UPDATE PRODUCT (POST & PUT)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const ProductModel = Product as mongoose.Model<any>;

    const {
      _id,
      id,
      name,
      brand,
      category,
      price,
      offerPrice,
      stock,
      imageUrl,
      images,
      priority,
      badge,
      description,
      amazonDetails,
      seo,
    } = body;

    const targetId = _id || id;
    if (!name || !brand || !price) {
      return NextResponse.json({ success: false, error: "Missing required product fields" }, { status: 400 });
    }

    const payload = {
      name,
      brand,
      category: category || "Investment Grade",
      price: Number(price),
      offerPrice: Number(offerPrice) || Number(price),
      stock: Number(stock) || 0,
      imageUrl: imageUrl || (images && images[0]) || "",
      images: Array.isArray(images) ? images.filter(Boolean) : [],
      priority: Number(priority) || 0,
      badge: badge || "",
      description: description || "",
      amazonDetails: amazonDetails || [],
      seo: seo || {},
      isActive: true,
      updatedAt: new Date(),
    };

    let savedProduct;
    if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
      savedProduct = await ProductModel.findByIdAndUpdate(
        targetId,
        { $set: payload },
        { new: true, upsert: true }
      );
    } else {
      savedProduct = await ProductModel.create(payload);
    }

    return NextResponse.json({ success: true, data: savedProduct });
  } catch (error: any) {
    console.error("Product Save API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

// DELETE PRODUCT
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id || body?._id;
      } catch {}
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid product ID" }, { status: 400 });
    }

    const ProductModel = Product as mongoose.Model<any>;
    await ProductModel.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Product deleted permanently" });
  } catch (error: any) {
    console.error("Product Delete API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}