export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { MyrioCustomerSession } from "@/models/MyrioCustomerSession";
import { sanitizeString } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email?.toLowerCase() || null;
    const userId = (session?.user as any)?.id || null;

    const body = await req.json();
    const sessionId = sanitizeString(body.sessionId || "guest-session", 100);
    const userQuery = sanitizeString(body.query || "", 500);

    if (!userQuery) {
      return NextResponse.json({ success: false, error: "Query is required" }, { status: 400 });
    }

    const cleanQuery = userQuery.toLowerCase();
    let aiResponse = "";
    let requiresHandoff = false;

    // 1. Order Status Tracking (Requires Authentication & Ownership)
    if (cleanQuery.includes("order") || cleanQuery.includes("track") || cleanQuery.includes("shipping")) {
      if (!userEmail) {
        aiResponse = "To protect your privacy, please sign in to your account to track your orders.";
      } else {
        const userOrders = await Order.find({ "customer.email": userEmail }).sort({ createdAt: -1 }).limit(3).lean();
        if (userOrders.length === 0) {
          aiResponse = `I couldn't locate any active orders associated with your email (${userEmail}).`;
        } else {
          aiResponse = `📦 Here are your recent vault consignments:\n` +
            userOrders.map((o: any) => `• Order #${o.orderId || o._id.toString().slice(-6)}: Status *${o.status}* (Total: ₹${o.totalAmount.toLocaleString("en-IN")})`).join("\n");
        }
      }
    }
    // 2. Return Policy
    else if (cleanQuery.includes("return") || cleanQuery.includes("refund")) {
      aiResponse = "🔄 Essential Rush offers a 7-day inspection window for all luxury timepieces. Watches must be unworn with original seals intact. Would you like me to initiate a return request with support?";
    }
    // 3. Payment Methods
    else if (cleanQuery.includes("payment") || cleanQuery.includes("pay") || cleanQuery.includes("upi") || cleanQuery.includes("card")) {
      aiResponse = "💳 We accept secure online payments via Razorpay (UPI, Credit/Debit Cards, NetBanking), Bank Wire Transfers, and Cash on Delivery (COD) for verified vault accounts.";
    }
    // 4. Products & Catalog Advisory
    else if (cleanQuery.includes("watch") || cleanQuery.includes("product") || cleanQuery.includes("recommend") || cleanQuery.includes("best")) {
      const topProducts = await Product.find({ isActive: true }).sort({ priority: -1 }).limit(3).lean();
      aiResponse = `⌚ Here are our top featured timepieces currently available in the vault:\n` +
        topProducts.map((p: any) => `• *${p.name}* (${p.brand}) - ₹${(p.offerPrice || p.price).toLocaleString("en-IN")}`).join("\n");
    }
    // 5. Support / Contact
    else if (cleanQuery.includes("support") || cleanQuery.includes("contact") || cleanQuery.includes("human") || cleanQuery.includes("problem")) {
      requiresHandoff = true;
      aiResponse = "📞 I am connecting you with a human concierge specialist right now. Your conversation summary has been attached to the support ticket.";
    }
    // General Fallback
    else {
      aiResponse = "Hello! I am MYRIO, your personal horology assistant. You can ask me about order tracking, watch specifications, payment methods, or return policies.";
    }

    // Save Chat Session state in DB
    await MyrioCustomerSession.findOneAndUpdate(
      { sessionId },
      {
        $set: { userId, userEmail, isEscalatedToHuman: requiresHandoff },
        $push: {
          messages: [
            { sender: "CUSTOMER", text: userQuery, timestamp: new Date() },
            { sender: "MYRIO", text: aiResponse, timestamp: new Date() },
          ],
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      response: aiResponse,
      requiresHandoff,
    });
  } catch (error: any) {
    console.error("Ask MYRIO Customer API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}