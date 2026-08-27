export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

// 1. GET: Saare coupons fetch karne ke liye (Admin Table)
export async function GET() {
  try {
    await connectDB();
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: coupons });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// 2. POST: Naya Coupon Code Generate karne ke liye
export async function POST(request: Request) {
  try {
    const { code, discountPercent, expiryDate } = await request.json();
    await connectDB();
    
    const newCoupon = await Coupon.create({
      code: code.toUpperCase(),
      discountPercent: Number(discountPercent),
      expiryDate: expiryDate ? new Date(expiryDate) : null
    });

    return NextResponse.json({ success: true, data: newCoupon });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Code might already exist' }, { status: 500 });
  }
}

// 3. DELETE: Coupon Code ko Delete karne ke liye
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await connectDB();
    await Coupon.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}