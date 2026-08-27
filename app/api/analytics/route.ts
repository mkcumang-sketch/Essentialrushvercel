export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import connectDB from "@/lib/mongodb"; // Aapka standard db connection import
import { NextResponse } from "next/server";
import mongoose from "mongoose"; // 🚀 FIX: mongoose import kiya

import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import Lead from '@/models/Lead';
import User from '@/models/usertemp';
import ActivityLog from '@/models/ActivityLog';

// 🚀 THE ULTIMATE FIX: Sabhi models ko explicitly cast kiya taaki TS(2349) errors hat jayein
const OrderModel = Order as mongoose.Model<any>;
const ProductModel = Product as mongoose.Model<any>;
const LeadModel = Lead as mongoose.Model<any>;
const UserModel = User as mongoose.Model<any>;
const ActivityLogModel = ActivityLog as mongoose.Model<any>;

/**
 * INTELLIGENCE CONTROLLER v4.0
 * Real-time aggregation of Enterprise Metrics for the Imperial Dashboard
 */

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "ALL"; // TODAY | WEEK | MONTH | ALL

    // 1. Defining Time Boundaries
    let dateFilter = {};
    const now = new Date();
    if (timeframe === "TODAY") {
      dateFilter = { createdAt: { $gte: new Date(now.setHours(0, 0, 0, 0)) } };
    } else if (timeframe === "WEEK") {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      dateFilter = { createdAt: { $gte: weekAgo } };
    }

    // 2. Parallel Data Aggregation (Optimized for Speed)
    const [
      revenueData,
      totalOrders,
      totalLeads,
      totalCustomers,
      inventoryStats,
      recentLogs
    ] = await Promise.all([
      // Revenue Aggregation
      OrderModel.aggregate([
        { $match: { status: { $ne: 'Cancelled' }, ...dateFilter } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      // Order Counts
      OrderModel.countDocuments(dateFilter),
      // Lead Counts
      LeadModel.countDocuments(dateFilter),
      // Customer Database Size
      UserModel.countDocuments(),
      // Inventory Health
      ProductModel.aggregate([
        {
          $group: {
            _id: null,
            totalStock: { $sum: "$stock" },
            lowStockCount: { $sum: { $cond: [{ $lt: ["$stock", 3] }, 1, 0] } },
            totalValue: { $sum: { $multiply: ["$price", "$stock"] } }
          }
        }
      ]),
      // Security/Audit Trail
      ActivityLogModel.find().sort({ createdAt: -1 }).limit(10).lean()
    ]);
    
    // 3. Calculating Conversion Rate (Leads to Orders)
    const conversionRate = totalLeads > 0 ? ((totalOrders / totalLeads) * 100).toFixed(2) : 0;

    // 4. Fetching Top Performing Assets (By Ranking Score)
    const topAssets = await ProductModel.find({})
      .sort({ rankingScore: -1 })
      .limit(5)
      .select('name price rankingScore imageUrl')
      .lean();

    // 5. Compiling the Imperial Intelligence Payload
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        revenue: revenueData[0]?.total || 0,
        orders: totalOrders,
        leads: totalLeads,
        customers: totalCustomers,
        conversionRate: `${conversionRate}%`,
        liveVisitors: Math.floor(Math.random() * (25 - 5 + 1)) + 5, // Simulated for Phase 8
      },
      inventory: {
        totalUnits: inventoryStats[0]?.totalStock || 0,
        lowStockAlerts: inventoryStats[0]?.lowStockCount || 0,
        vaultValuation: inventoryStats[0]?.totalValue || 0
      },
      topAssets,
      auditTrail: recentLogs
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: Event Tracking (Phase 5: Customer Intelligence)
 * Tracks clicks, views, and session duration
 */
export async function POST(req: Request) {
  try {
    await connectDB();
    const { event, productId, metadata } = await req.json();

    if (event === "PRODUCT_VIEW" && productId) {
      // Incrementing Click Rate and Ranking Score (Phase 7)
      await ProductModel.findByIdAndUpdate(productId, {
        $inc: { clickRate: 1, rankingScore: 0.15 }
      });
    }

    return NextResponse.json({ success: true, message: "Intelligence Node Synced" });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}