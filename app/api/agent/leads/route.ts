export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { AbandonedCart } from "@/models/AbandonedCart";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const allowed = ["AGENT", "STAFF", "ADMIN", "SUPER_ADMIN"];

    if (!session || !allowed.includes(role)) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    
    // Read directly from AbandonedCart where status is active/abandoned
    const leads = await AbandonedCart.find({})
      .sort({ lastInteraction: -1, createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      data: leads.map((l: any) => ({
        _id: l._id.toString(),
        name: l.name || "Vault Client",
        phone: l.phone || "",
        email: l.email || "",
        cartTotal: l.cartTotal || 0,
        itemsCount: (l.items || []).length,
        status: l.status || "new",
        createdAt: l.createdAt || l.lastInteraction,
      })),
    });
  } catch (error: any) {
    console.error("Agent leads fetch error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}