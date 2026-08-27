import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getToken } from "next-auth/jwt";
import { revalidatePath, revalidateTag } from 'next/cache';

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const AbandonedCartSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Vault Client" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    cartTotal: { type: Number, default: 0 },
    status: { type: String, default: "ABANDONED" },
    createdAt: { type: Date, default: Date.now },
  },
  { strict: false }
);

// 🚀 FIX: 'as any' lagaya taaki Mongoose ke argument checks TS ko pareshan na karein
const AbandonedCart = (mongoose.models.AbandonedCart || mongoose.model("AbandonedCart", AbandonedCartSchema)) as any;

async function isSuperAdminRequest(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  return token && (token as any).role === "SUPER_ADMIN";
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isSuperAdminRequest(req))) {
      return NextResponse.json(
        { success: false, error: "You do not have access to do that." },
        { status: 403 }
      );
    }

    await connectDB();

    const leads = await AbandonedCart.find({
      status: { $in: ["ABANDONED", "PENDING", "pending", "abandoned"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    const appUrl = process.env.NEXTAUTH_URL || "https://essential-ivory.vercel.app";
    const recoveryLink = `${appUrl}/cart`;

    // 🚀 FIX: Added { status: 200 } as the 2nd argument to satisfy strict TS rules
    return NextResponse.json({
      success: true,
      leads: leads.map((l: any) => ({
        ...l,
        cartTotal: Number(l?.cartTotal ?? l?.totalAmount ?? 0) || 0,
        name: l?.name || l?.customer?.name || "Vault Client",
        email: l?.email || l?.customer?.email || "",
        phone: l?.phone || l?.customer?.phone || "",
        recoveryLink,
      })),
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "We could not load abandoned carts." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await isSuperAdminRequest(req))) {
      return NextResponse.json(
        { success: false, error: "You do not have access to do that." },
        { status: 403 }
      );
    }

    await connectDB();
    
    // 🚀 FIX: Passed a fallback base URL just in case 'new URL' strict typings demand 2 arguments
    const url = new URL(req.url, "http://localhost");
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID missing." }, { status: 400 });
    }

    await AbandonedCart.findByIdAndDelete(id);

    revalidatePath('/', 'layout');
    revalidateTag('abandoned-carts', 'layout' as any);

    // 🚀 FIX: Added { status: 200 } as the 2nd argument
    return NextResponse.json({ success: true, message: "Abandoned cart removed." }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Delete failed." }, { status: 500 });
  }
}