export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { Product } from "@/models/Product";
import { handleError } from "@/lib/error-handler";
import { sanitizeString } from "@/lib/sanitize";

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: products }, { status: 200 });
  } catch (error) {
    const err = handleError(error);
    return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: SuperAdmin required." }, { status: 403 });
    }

    const body = await req.json();
    const name = sanitizeString(body.name, 150);
    const price = Number(body.price);

    if (!name || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ success: false, error: "Valid name and positive price are required." }, { status: 400 });
    }

    if (!Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json({ success: false, error: "At least one product image is required." }, { status: 400 });
    }

    await connectDB();
    const product = await Product.create({
      ...body,
      name,
      price,
    });

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/godmode");
    revalidatePath("/godmode/products");

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    const err = handleError(error);
    return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode || 500 });
  }
}