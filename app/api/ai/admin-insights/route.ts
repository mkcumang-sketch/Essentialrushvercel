import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order';
import mongoose from 'mongoose'; // 🚀 FIX: mongoose import kiya

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const insights: string[] = []; // 🚀 FIX: Array ko explicitly type kiya

    // 🚀 THE ULTIMATE FIX: Models ko strictly cast kiya
    const ProductModel = Product as mongoose.Model<any>;
    const OrderModel = Order as mongoose.Model<any>;

    // 1. Low Stock Alert
    const lowStock = await ProductModel.find({ stock: { $gt: 0, $lt: 4 } }).limit(2);
    lowStock.forEach(p => insights.push(`⚠️ Low stock alert: Only ${p.stock} units left for ${p.title || p.name}`));

    // 2. Trending Product
    const trending = await ProductModel.findOne().sort({ totalSold: -1 });
    if (trending && trending.totalSold > 0) {
      insights.push(`🔥 High Demand: ${trending.title || trending.name} is currently trending with ${trending.totalSold} total dispatches.`);
    }

    // 3. Top Region
    const topCountry = await OrderModel.aggregate([{ $group: { _id: "$customer.country", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 1 }]);
    if (topCountry.length > 0) {
      insights.push(`🌍 Regional Surge: Maximum active traffic and conversions are originating from ${topCountry[0]._id || 'India'}.`);
    }

    return NextResponse.json({ success: true, insights });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}