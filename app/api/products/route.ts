export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { Product } from "@/models/Product";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const ProductModel = Product as mongoose.Model<any>;
    const products = await ProductModel.find({}).sort({ priority: -1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const ProductModel = Product as mongoose.Model<any>;

    const {
      _id,
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

    if (!name || !brand || !price) {
      return NextResponse.json({ success: false, error: "Missing required product fields" }, { status: 400 });
    }

    let savedProduct;
    if (_id && mongoose.Types.ObjectId.isValid(_id)) {
      savedProduct = await ProductModel.findByIdAndUpdate(
        _id,
        {
          $set: {
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
          },
        },
        { new: true, upsert: true }
      );
    } else {
      savedProduct = await ProductModel.create({
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
      });
    }

    return NextResponse.json({ success: true, data: savedProduct });
  } catch (error: any) {
    console.error("Product Save API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

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