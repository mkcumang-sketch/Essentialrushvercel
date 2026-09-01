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
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 1. IP & Rate Limiting Enforcement
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateResult = await checkRateLimit(ip, "ai");
    if (!rateResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "High concierge query traffic. Please pause a moment before asking MYRIO again.",
        },
        { status: 429, headers: getRateLimitHeaders(rateResult) }
      );
    }

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
    let requiresHandoff =
      cleanQuery.includes("human") ||
      cleanQuery.includes("support") ||
      cleanQuery.includes("representative") ||
      cleanQuery.includes("agent");

    // 2. Fetch Relevant Live Database Context
    let userOrdersContext = "No prior vault consignments found.";
    if (userEmail) {
      const userOrders = await Order.find({ "customer.email": userEmail })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      if (userOrders.length > 0) {
        userOrdersContext = userOrders
          .map(
            (o: any) =>
              `• Consignment #${o.orderId || o._id.toString().slice(-6)}: Status ${o.status}, Amount ₹${Number(
                o.totalAmount || 0
              ).toLocaleString("en-IN")}`
          )
          .join("\n");
      }
    }

    const topProducts = await Product.find({ isActive: true })
      .sort({ priority: -1 })
      .limit(4)
      .lean();

    const catalogSummary = topProducts
      .map(
        (p: any) =>
          `• ${p.name || p.title} (${p.brand}) - ₹${Number(p.offerPrice || p.price || 0).toLocaleString("en-IN")}`
      )
      .join("\n");

    // 3. Groq AI Real-Time Execution
    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      try {
        const systemPrompt = `You are MYRIO, the bespoke Horology Concierge for "Essential Rush" (luxury Swiss timepiece boutique).

CLIENT CONTEXT:
- Authenticated Email: ${userEmail || "Guest (Not logged in)"}
- Client Orders:
${userOrdersContext}

AVAILABLE VAULT CATALOG:
${catalogSummary}

POLICIES:
- Returns: 7-day inspection window on unworn watches with unbroken security seals.
- Shipping: Global insured diplomatic courier dispatch.
- Payment: Razorpay (Cards, UPI, NetBanking), Bank Wire, and COD for verified accounts.

RESPONSE RULES:
- Respond elegantly, concisely, and with genuine horological expertise.
- If a Guest asks about order status, politely invite them to sign in.
- Keep response under 75 words.`;

        const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userQuery },
            ],
            temperature: 0.6,
            max_tokens: 250,
          }),
        });

        if (aiRes.ok) {
          const json = await aiRes.json();
          aiResponse = json.choices?.[0]?.message?.content?.trim() || "";
        }
      } catch (err) {
        console.error("Groq Concierge Error:", err);
      }
    }

    // 4. Deterministic Fallback if Offline
    if (!aiResponse) {
      if (cleanQuery.includes("order") || cleanQuery.includes("track")) {
        aiResponse = userEmail
          ? `📦 Here are your active vault consignments:\n${userOrdersContext}`
          : "To protect your privacy, please sign in to your vault account to inspect consignment telemetry.";
      } else if (cleanQuery.includes("return") || cleanQuery.includes("refund")) {
        aiResponse = "🔄 Essential Rush offers a 7-day inspection window on all unworn timepieces with intact security seals.";
      } else if (cleanQuery.includes("payment") || cleanQuery.includes("pay")) {
        aiResponse = "💳 We accept UPI, Cards, and NetBanking via Razorpay, along with Wire Transfers and Cash on Delivery.";
      } else if (cleanQuery.includes("watch") || cleanQuery.includes("product") || cleanQuery.includes("recommend")) {
        aiResponse = `⌚ Here are current highlights from the vault:\n${catalogSummary}`;
      } else {
        aiResponse = "Welcome to Essential Rush. I am MYRIO, your horological concierge. How may I assist your acquisition today?";
      }
    }

    // 5. Store Conversation Session Turn
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

    return NextResponse.json(
      {
        success: true,
        response: aiResponse,
        requiresHandoff,
      },
      { headers: getRateLimitHeaders(rateResult) }
    );
  } catch (error: any) {
    console.error("Ask MYRIO Customer API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}