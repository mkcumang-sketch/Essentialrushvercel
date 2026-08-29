export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeMyrioOrchestration } from "@/lib/myrio/orchestrator";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { AiIncident } from "@/models/AiIncident";
import { AbandonedCart } from "@/models/AbandonedCart";
import connectDB from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const [
      todayOrders,
      pendingOrders,
      delayedOrders,
      failedPayments,
      lowStock,
      outOfStock,
      activeIncidents,
      totalCarts,
      abandonedCarts,
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: todayStart } }),
      Order.countDocuments({ status: { $in: ["Processing", "Pending", "ORDER_CREATED", "PROCESSING"] } }),
      Order.countDocuments({
        status: { $in: ["Processing", "Pending", "ORDER_CREATED", "PROCESSING"] },
        createdAt: { $lte: twoDaysAgo },
      }),
      Order.countDocuments({ paymentStatus: { $in: ["Failed", "FAILED"] } }),
      Product.countDocuments({ stock: { $gt: 0, $lte: 3 }, isActive: true }),
      Product.countDocuments({ stock: 0, isActive: true }),
      AiIncident.countDocuments({ status: "OPEN" }),
      AbandonedCart.countDocuments(),
      AbandonedCart.countDocuments({ status: "ABANDONED" }),
    ]);

    const issues: any[] = [];
    if (delayedOrders > 0) {
      issues.push({
        id: "ISS-DELAY-01",
        category: "LOGISTICS",
        severity: "HIGH",
        title: `${delayedOrders} Overdue Consignments`,
        possibleCause: "Courier fulfillment bottleneck or missing tracking dispatch.",
        impact: "Customer SLA breach and potential cancellation risk.",
        recommendedFix: "Assign courier tracking IDs to overdue orders immediately.",
      });
    }

    if (outOfStock > 0) {
      issues.push({
        id: "ISS-STOCK-01",
        category: "INVENTORY",
        severity: "MEDIUM",
        title: `${outOfStock} Products Depleted`,
        possibleCause: "High sales velocity or delayed vendor supply restock.",
        impact: "Direct bounce rate increase on unfulfillable items.",
        recommendedFix: "Mark items as backorder or update supplier purchase orders.",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        systemHealthScore: delayedOrders === 0 && outOfStock === 0 ? 98 : 84,
        securityThreatLevel: "LOW",
        metrics: {
          totalOrdersToday: todayOrders,
          pendingOrdersCount: pendingOrders,
          delayedOrdersCount: delayedOrders,
          failedPaymentsCount: failedPayments,
          lowStockCount: lowStock,
          outOfStockCount: outOfStock,
          activeIncidentsCount: activeIncidents,
          unresolvedAlertsCount: activeIncidents,
          cartAbandonmentRate: totalCarts > 0 ? Math.round((abandonedCarts / totalCarts) * 100) : 0,
        },
        highPriorityIssues: issues,
      },
    });
  } catch (error: any) {
    console.error("AI Command API GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();

    if (body.action === "RESOLVE_INCIDENT" && body.incidentId) {
      await connectDB();
      await AiIncident.findOneAndUpdate({ _id: body.incidentId }, { status: "RESOLVED" });
      return NextResponse.json({ success: true, message: "Incident marked as resolved." });
    }

    const result = await executeMyrioOrchestration({
      role: "SUPER_ADMIN",
      userId: (session.user as any)?.id,
      customerEmail: session.user?.email,
      query: body.query || "",
      intent: "CHAT",
    });

    return NextResponse.json({
      success: result.success,
      response: result.response,
      data: result.data,
    });
  } catch (error: any) {
    console.error("AI Command API POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}