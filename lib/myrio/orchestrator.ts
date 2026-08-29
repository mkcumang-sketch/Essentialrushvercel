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
    // 1. ADMIN INTELLIGENCE DISPATCH
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

        return {
          success: true,
          classification: "FACT",
          response: delayedOrders.length > 0
            ? `Detected ${delayedOrders.length} orders exceeding fulfillment SLAs. Immediate courier dispatch recommended.`
            : "All active vault consignments are within standard SLA dispatch windows.",
          data: { delayedCount: delayedOrders.length, orders: delayedOrders.slice(0, 5) },
          executionLatencyMs: Date.now() - startTime,
        };
      }
    }

    // 2. LIVE STORE DATA
    let userOrdersContext = "No orders found.";
    if (payload.customerEmail) {
      const orders = await Order.find({ "customer.email": payload.customerEmail.toLowerCase().trim() })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      if (orders.length > 0) {
        userOrdersContext = orders
          .map((o: any) => `Order #${o.orderId || o._id.toString().slice(-6)}: Status ${o.status}, Amount ₹${o.totalAmount?.toLocaleString("en-IN")}`)
          .join("\n");
      }
    }

    const activeProducts = await Product.find({ isActive: true }).sort({ priority: -1 }).limit(6).lean();
    const catalogSummary = activeProducts
      .map((p: any) => `• ${p.name || p.title} (${p.brand}) - ₹${(p.offerPrice || p.price)?.toLocaleString("en-IN")} [Stock: ${p.stock}]`)
      .join("\n");

    // 3. CONVERSATION HISTORY RETRIEVAL
    let conversationHistory: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
    if (payload.sessionId) {
      const existingSession = await MyrioCustomerSession.findOne({ sessionId: payload.sessionId }).lean();
      if (existingSession && Array.isArray((existingSession as any).messages)) {
        const lastTurns = (existingSession as any).messages.slice(-4);
        conversationHistory = lastTurns.map((m: any) => ({
          role: m.sender === "CUSTOMER" ? "user" : "assistant",
          content: m.text,
        }));
      }
    }

    // 4. CALL AIML API
    let finalAiResponse = "";
    const requiresHandoff = lowerQuery.includes("human") || lowerQuery.includes("agent") || lowerQuery.includes("complaint");
    const apiKey = process.env.AIMLAPI_API_KEY;

    if (apiKey) {
      const systemPrompt = `You are MYRIO, the authoritative horology intelligence and luxury concierge for Essential Rush (a premier boutique for investment-grade Swiss timepieces).
Client Authenticated Email: ${payload.customerEmail || "Not authenticated (Guest)"}

LIVE VAULT DATA:
Orders for this client:
${userOrdersContext}

Available Vault Collection:
${catalogSummary}

Store Guarantees:
- 7-day inspection window with intact security seals.
- Diplomatic courier dispatch with full in-transit insurance.
- Payments: Razorpay (Cards, NetBanking, UPI), Wire Transfer, COD for verified clients.

RESPONSE GUIDELINES:
- Respond naturally, eloquently, and adaptively as an expert luxury concierge.
- NEVER repeat a single hardcoded script. Provide fresh, engaging, context-aware answers.
- If the user asks about specific order status and is NOT signed in, gently ask them to log into their vault account.
- For watch recommendations, cite models from the Live Vault Collection with pricing and design character.
- Keep responses concise (under 80 words) and exquisitely formatted.`;

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
            ...conversationHistory,
            { role: "user", content: cleanQuery },
          ],
          temperature: 0.75,
          max_tokens: 300,
        }),
      });

      if (aiRes.ok) {
        const json = await aiRes.json();
        finalAiResponse = json.choices?.[0]?.message?.content?.trim() || "";
      }
    }

    // Deterministic Fallback if offline
    if (!finalAiResponse) {
      if (lowerQuery.includes("order") || lowerQuery.includes("track")) {
        finalAiResponse = payload.customerEmail && userOrdersContext !== "No orders found."
          ? `📦 Here are your active vault consignments:\n${userOrdersContext}`
          : "To inspect your consignment status, please sign in to your vault account.";
      } else if (lowerQuery.includes("return") || lowerQuery.includes("refund")) {
        finalAiResponse = "🔄 Essential Rush offers a 7-day inspection window on all unworn timepieces with unbroken security seals.";
      } else if (lowerQuery.includes("payment") || lowerQuery.includes("pay")) {
        finalAiResponse = "💳 We support UPI, Cards, and NetBanking via Razorpay, along with Bank Wire and COD.";
      } else {
        finalAiResponse = "Welcome to Essential Rush. I am MYRIO. How may I assist your timepiece acquisition today?";
      }
    }

    // Save Session Turn
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
    console.error("MYRIO Orchestration Error:", err);
    return {
      success: false,
      classification: "UNKNOWN",
      response: "MYRIO encountered a communication bottleneck.",
      executionLatencyMs: Date.now() - startTime,
    };
  }
}