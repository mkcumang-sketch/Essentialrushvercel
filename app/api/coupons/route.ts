export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sanitizeString } from '@/lib/sanitize';
import mongoose, { Model } from 'mongoose';

const CouponModel = (mongoose.models.Coupon || Coupon) as Model<any>;

export async function GET() {
  try {
    await connectDB();
    const coupons = await CouponModel.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(
      { success: true, data: coupons },
      { headers: { 'Cache-Control': 'no-store, no-cache' } }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const code = sanitizeString(body.code, 30).toUpperCase();
    const discountPercent = Number(body.discountPercent || body.discountValue || 0);

    if (!code || discountPercent <= 0) {
      return NextResponse.json({ success: false, error: "Valid code and discount required" }, { status: 400 });
    }

    const newCoupon = await CouponModel.create({
      ...body,
      code,
      discountPercent,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null
    });

    revalidatePath('/godmode');
    return NextResponse.json({ success: true, data: newCoupon }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Code might already exist" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const { id } = await req.json();
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Valid ID required" }, { status: 400 });
    }

    await CouponModel.findByIdAndDelete(id);
    revalidatePath('/godmode');
    return NextResponse.json({ success: true, message: "Coupon Deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}