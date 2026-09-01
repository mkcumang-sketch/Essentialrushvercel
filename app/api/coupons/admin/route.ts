export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sanitizeString } from '@/lib/sanitize';
import mongoose from 'mongoose';

// 🛡️ AUTHORIZATION: Only SUPER_ADMIN can access this endpoint
async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  
  if (!session?.user || userRole !== 'SUPER_ADMIN') {
    return false;
  }
  return true;
}

// 1. GET: Fetch all coupons for admin table
export async function GET() {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    await connectDB();
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: coupons });
  } catch (error) {
    console.error("Get Coupons Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// 2. POST: Create new coupon code
export async function POST(request: Request) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await request.json();

    // 🛡️ Validate all coupon parameters
    const code = sanitizeString(body.code, 30).toUpperCase();
    const discountType = body.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
    const discountValue = Number(body.discountValue || 0);
    const minOrderValue = Math.max(0, Number(body.minOrderValue || 0));
    const maxDiscount = body.maxDiscount ? Math.max(0, Number(body.maxDiscount)) : null;
    const usageLimit = Math.max(1, Number(body.usageLimit || 100));
    const validFrom = body.validFrom ? new Date(body.validFrom) : new Date();
    const validUntil = body.validUntil ? new Date(body.validUntil) : null;

    if (!code || discountValue <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid code and discount value required" },
        { status: 400 }
      );
    }

    if (discountType === 'PERCENTAGE' && (discountValue < 0 || discountValue > 100)) {
      return NextResponse.json(
        { success: false, error: "Percentage discount must be between 0 and 100" },
        { status: 400 }
      );
    }

    const newCoupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      usageLimit,
      usedCount: 0,
      validFrom,
      validUntil,
      isActive: true
    });

    return NextResponse.json({ success: true, data: newCoupon }, { status: 201 });
  } catch (error: any) {
    console.error("Create Coupon Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Code might already exist" },
      { status: 500 }
    );
  }
}

// 3. DELETE: Delete coupon code
export async function DELETE(request: Request) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await request.json();
    const id = sanitizeString(body.id, 50);

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Valid coupon ID required" },
        { status: 400 }
      );
    }

    await Coupon.findByIdAndDelete(new mongoose.Types.ObjectId(id));
    return NextResponse.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error: any) {
    console.error("Delete Coupon Error:", error);
    return NextResponse.json({ success: false, error: "Could not delete coupon" }, { status: 500 });
  }
}