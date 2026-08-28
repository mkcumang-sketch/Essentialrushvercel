export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { AbandonedCart } from "@/models/AbandonedCart";
import { AgentActivity } from "@/models/AgentActivity";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const agentId = (session?.user as any)?.id || session?.user?.email;

    if (!session || !["AGENT", "STAFF", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const todayDate = new Date().toISOString().split("T")[0];

    // 1. Fetch Today's Attendance
    const todayAttendance = await AgentActivity.findOne({
      agentId,
      date: todayDate,
    }).lean();

    // 2. Fetch Leads & Sales Stats
    const allLeads = await AbandonedCart.find({}).sort({ createdAt: -1 }).lean();

    const convertedLeads = allLeads.filter(
      (l: any) => l.status === "CONVERTED" && l.convertedBy === agentId
    );

    const totalSalesAmount = convertedLeads.reduce(
      (acc: number, l: any) => acc + Number(l.cartTotal || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        attendance: todayAttendance || null,
        stats: {
          totalSales: totalSalesAmount,
          convertedCount: convertedLeads.length,
          totalAssigned: allLeads.length,
        },
        leads: allLeads.map((l: any) => ({
          _id: l._id.toString(),
          name: l.name || "Vault Client",
          phone: l.phone || "",
          email: l.email || "",
          cartTotal: l.cartTotal || 0,
          items: l.items || [],
          status: l.status || "ABANDONED",
          convertedBy: l.convertedBy || null,
          createdAt: l.createdAt || l.lastInteraction,
        })),
      },
    });
  } catch (error: any) {
    console.error("Agent Action GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const agentId = (session?.user as any)?.id || session?.user?.email;
    const agentEmail = session?.user?.email || "";

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { action, leadId, newStatus } = body;
    const todayDate = new Date().toISOString().split("T")[0];

    // Action A: Toggle Attendance
    if (action === "CLOCK_IN") {
      const record = await AgentActivity.findOneAndUpdate(
        { agentId, date: todayDate },
        {
          $setOnInsert: { agentId, agentEmail, date: todayDate, clockIn: new Date() },
        },
        { upsert: true, new: true }
      );
      return NextResponse.json({ success: true, message: "Clocked in successfully", record });
    }

    if (action === "CLOCK_OUT") {
      const record = await AgentActivity.findOneAndUpdate(
        { agentId, date: todayDate },
        { $set: { clockOut: new Date() } },
        { new: true }
      );
      return NextResponse.json({ success: true, message: "Clocked out successfully", record });
    }

    // Action B: Convert/Update Lead Status
    if (action === "UPDATE_LEAD_STATUS" && leadId) {
      const updatedLead = await AbandonedCart.findByIdAndUpdate(
        leadId,
        {
          $set: {
            status: newStatus,
            ...(newStatus === "CONVERTED" ? { convertedBy: agentId, convertedAt: new Date() } : {}),
          },
        },
        { new: true }
      );
      return NextResponse.json({ success: true, lead: updatedLead });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Agent Action POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}