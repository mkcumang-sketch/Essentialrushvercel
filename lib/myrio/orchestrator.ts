import connectDB from "@/lib/mongodb";
import { generateTruthAnalysisReport } from "@/lib/myrio/truth-engine";
import { generateSystemHealthReport } from "@/lib/myrio/self-health";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { AiIncident } from "@/models/AiIncident";
import { MyrioCustomerSession } from "@/models/MyrioCustomerSession";
import { sanitizeString } from "@/lib/sanitize";

export type MyrioRole = "PUBLIC" | "CUSTOMER" | "AGENT" | "SUPER_ADMIN";

export interface MyrioRequestPayload {
  role: MyrioRole;
  userId?: string | null;
  customerEmail?: string | null;
  sessionId?: string;
  query: string;
  intent?: "CHAT" | "TRUTH_MODE" | "HEALTH_CHECK" | "OUTCOME_EVAL" | "TOOL_EXECUTION";
  toolName?: string;
  toolParameters?: Record<string, any>;
}

export interface MyrioResponsePayload {
  success: boolean;
  classification: "FACT" | "INFERENCE" | "PREDICTION" | "UNKNOWN";
  response: string;
  data?: any;
  requiresHumanHandoff?: boolean;
  executionLatencyMs: number;
}

export async function executeMyrioOrchestration(
  payload: MyrioRequestPayload
): Promise<MyrioResponsePayload> {
  const startTime = Date.now();
  await connectDB();

  const rawQuery = payload.query || "";
  const cleanQuery = sanitizeString(rawQuery, 500);
  const lowerQuery = cleanQuery.toLowerCase();
  const role = payload.role || "PUBLIC";

  try {
    // =========================================================================
    // 1. ADMIN INTELLIGENCE AGENTS (SUPER_ADMIN)
    // =========================================================================
    if (role === "SUPER_ADMIN") {
      if (payload.intent === "TRUTH_MODE" || lowerQuery.includes("truth mode") || lowerQuery.includes("fair analysis")) {
        const truthReport = await generateTruthAnalysisReport();
        return {
          success: true,
          classification: "FACT",
          response: truthReport.summaryVerdict,
          data: truthReport,
          executionLatencyMs: Date.now() - startTime,
        };
      }

      if (payload.intent === "HEALTH_CHECK" || lowerQuery.includes("system health") || lowerQuery.includes("diagnose")) {
        const healthReport = await generateSystemHealthReport();
        return {
          success: true,
          classification: "FACT",
          response: `MYRIO core status: ${healthReport.aiAvailabilityStatus}. Daily tokens: ${healthReport.metrics.estimatedDailyTokenUsage}.`,
          data: healthReport,
          executionLatencyMs: Date.now() - startTime,
        };
      }

      if (lowerQuery.includes("delayed") || lowerQuery.includes("orders")) {
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const delayedOrders = await Order.find({
          status: { $in: ["Processing", "Pending", "ORDER_CREATED", "PROCESSING"] },
          createdAt: { $lte: twoDaysAgo },
        }).lean();

        const responseText = delayedOrders.length > 0
          ? `Detected ${delayedOrders.length} orders exceeding fulfillment SLAs. Immediate courier dispatch recommended.`
          : "All active vault consignments are within standard SLA dispatch windows.";

        return {
          success: true,
          classification: "FACT",
          response: responseText,
          data: { delayedCount: delayedOrders.length, orders: delayedOrders.slice(0, 5) },
          executionLatencyMs: Date.now() - startTime,
        };
      }
    }

    // =========================================================================
    // 2. LIVE DATABASE CONTEXT RETRIEVAL
    // =========================================================================
    let userOrdersContext = "";
    if (payload.customerEmail) {
      const orders = await Order.find({ "customer.email": payload.customerEmail.toLowerCase().trim() })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      if (orders.length > 0) {
        userOrdersContext = orders
          .map((o: any) => `Order #${o.orderId || o._id.toString().slice(-6)}: Status ${o.status}, Amount ₹${o.totalAmount}`)
          .join("; ");
      }
    }

    const activeProducts = await Product.find({ isActive: true }).sort({ priority: -1 }).limit(5).lean();
    const catalogContext = activeProducts
      .map((p: any) => `${p.name} (${p.brand}) - Price ₹${p.offerPrice || p.price} - Stock: ${p.stock}`)
      .join("; ");

    // =========================================================================
    // 3. AIML API CALL (OR FALLBACK)
    // =========================================================================
    let finalAiResponse = "";
    const requiresHandoff = lowerQuery.includes("support") || lowerQuery.includes("human") || lowerQuery.includes("contact");
    const apiKey = process.env.AIMLAPI_API_KEY;

    if (apiKey) {
      const systemPrompt = `You are MYRIO, the authoritative horology intelligence and luxury concierge for Essential Rush (fine luxury watches).
User Role: ${role}
Customer Email: ${payload.customerEmail || "Not signed in"}
User Order History: ${userOrdersContext || "No orders found or user unauthenticated"}
Live Vault Catalog: ${catalogContext}
Store Policy: 7-day inspection window on unworn watches with intact security seals. Accepted payment methods: Razorpay (Cards, UPI, NetBanking), Wire Transfer, and COD.

Guidelines:
1. Respond with high elegance, precision, and luxury tone.
2. If the user asks about personal orders without being logged in, direct them to sign in.
3. If they ask for human support, confirm that their concierge handoff is initiated.
4. Answer strictly based on store policies and live catalog items.`;

      const aiRes = await fetch("https://api.aimlapi.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: cleanQuery },
          ],
          temperature: 0.7,
          max_tokens: 400,
        }),
      });

      if (aiRes.ok) {
        const json = await aiRes.json();
        finalAiResponse = json.choices?.[0]?.message?.content || "";
      }
    }

    // Deterministic Offline Fallback if API key is missing or request fails
    if (!finalAiResponse) {
      if (lowerQuery.includes("order") || lowerQuery.includes("track")) {
        finalAiResponse = payload.customerEmail && userOrdersContext
          ? `📦 Here are your active vault consignments:\n${userOrdersContext}`
          : "To protect your privacy, please sign in to track your vault consignments.";
      } else if (lowerQuery.includes("return") || lowerQuery.includes("refund")) {
        finalAiResponse = "🔄 Essential Rush offers a 7-day inspection window on all authentic timepieces. Original seals must remain intact.";
      } else if (lowerQuery.includes("payment") || lowerQuery.includes("pay") || lowerQuery.includes("upi")) {
        finalAiResponse = "💳 We accept UPI, Credit/Debit cards, NetBanking via Razorpay, Bank Transfers, and Cash on Delivery (COD).";
      } else {
        finalAiResponse = "Welcome to Essential Rush. I am MYRIO. How may I assist your horology journey today?";
      }
    }

    // Store message session state in DB
    if (payload.sessionId) {
      await MyrioCustomerSession.findOneAndUpdate(
        { sessionId: payload.sessionId },
        {
          $set: { userId: payload.userId, customerEmail: payload.customerEmail, isEscalatedToHuman: requiresHandoff },
          $push: {
            messages: [
              { sender: "CUSTOMER", text: cleanQuery, timestamp: new Date() },
              { sender: "MYRIO", text: finalAiResponse, timestamp: new Date() },
            ],
          },
        },
        { upsert: true }
      );
    }

    return {
      success: true,
      classification: "INFERENCE",
      response: finalAiResponse,
      requiresHumanHandoff: requiresHandoff,
      executionLatencyMs: Date.now() - startTime,
    };
  } catch (err: any) {
    console.error("MYRIO AIML API Orchestration Error:", err);
    return {
      success: false,
      classification: "UNKNOWN",
      response: "MYRIO encountered an unexpected internal error.",
      executionLatencyMs: Date.now() - startTime,
    };
  }
}