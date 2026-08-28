export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Order } from '@/models/Order';
import mongoose, { Model } from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    const OrderModel = (Order || mongoose.models.Order) as Model<any>;
    const allOrders = await OrderModel.find({ status: { $ne: 'CANCELLED' } }).lean();

    const totalRevenue = allOrders.reduce((sum: number, order: any) => sum + (Number(order.totalAmount) || 0), 0);

    return NextResponse.json({
      success: true,
      metrics: {
        totalOrders: allOrders.length,
        totalRevenue
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, metrics: { totalOrders: 0, totalRevenue: 0 } }, { status: 500 });
  }
}