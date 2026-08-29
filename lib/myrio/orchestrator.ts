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
    // 1. ADMIN DIAGNOSTIC TOOLS (SUPER_ADMIN ONLY)
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
    }

    // 2. LIVE DATABASE CONTEXT RETRIEVAL
    let userOrdersContext = "No prior vault orders found.";
    if (payload.customerEmail) {
      const orders = await Order.find({ "customer.email": payload.customerEmail.toLowerCase().trim() })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      if (orders.length > 0) {
        userOrdersContext = orders
          .map((o: any) => `Order #${o.orderId || o._id.toString().slice(-6)}: Status ${o.status}, Amount ₹${o.totalAmount?.toLocaleString("en-IN")}`)
          .join("; ");
      }
    }

    const activeProducts = await Product.find({ isActive: true }).sort({ priority: -1 }).limit(6).lean();
    const catalogSummary = activeProducts
      .map((p: any) => `${p.name || p.title} (${p.brand}) - ₹${(p.offerPrice || p.price)?.toLocaleString("en-IN")} [Stock: ${p.stock}]`)
      .join("; ");

    // 3. RETRIEVE RECENT CONVERSATION MEMORY
    let conversationHistory: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
    if (payload.sessionId) {
      const existingSession = await MyrioCustomerSession.findOne({ sessionId: payload.sessionId }).lean();
      if (existingSession && Array.isArray((existingSession as any).messages)) {
        const recentMessages = (existingSession as any).messages.slice(-6);
        conversationHistory = recentMessages.map((m: any) => ({
          role: m.sender === "CUSTOMER" ? "user" : "assistant",
          content: m.text,
        }));
      }
    }

    // 4. CALL HIGH-SPEED LLAMA-3.3 70B VIA GROQ (OR FALLBACK)
    let finalAiResponse = "";
    const requiresHandoff = lowerQuery.includes("human") || lowerQuery.includes("agent") || lowerQuery.includes("representative");
    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      const systemPrompt = `You are MYRIO, the bespoke Horology Concierge and intelligence agent for "Essential Rush" (an ultra-luxury, investment-grade Swiss timepiece boutique).

CORE CONTEXT:
- Patron Email: ${payload.customerEmail || "Guest (Not signed in)"}
- Patron Orders: ${userOrdersContext}
- Available Vault Catalog: ${catalogSummary}
- Store Guarantees: 7-day inspection window on unworn watches with unbroken security seals. Diplomatic insured global shipping. Payments via Razorpay (UPI, NetBanking, Cards), Wire, and COD.

BEHAVIOR RULES:
1. Act with genuine human-like luxury intelligence, wit, and high horological expertise. 
2. NEVER give generic robotic answers or robotic placeholders.
3. If the user asks about their specific order and is a Guest, kindly invite them to log in to access vault dispatch telemetry.
4. When recommending watches, speak passionately about their craftsmanship, calibers, and exclusivity using the Live Vault Catalog.
5. Keep answers refined, concise, and structured.`;

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
            ...conversationHistory,
            { role: "user", content: cleanQuery },
          ],
          temperature: 0.7,
          max_tokens: 350,
        }),
      });

      if (aiRes.ok) {
        const json = await aiRes.json();
        finalAiResponse = json.choices?.[0]?.message?.content?.trim() || "";
      }
    }

    // Fallback if key is missing or network fails
    if (!finalAiResponse) {
      if (lowerQuery.includes("order") || lowerQuery.includes("track")) {
        finalAiResponse = payload.customerEmail && userOrdersContext !== "No prior vault orders found."
          ? `📦 Here is your active consignment telemetry:\n${userOrdersContext}`
          : "To track your consignment, please authenticate your vault credentials.";
      } else {
        finalAiResponse = "Welcome to Essential Rush. I am MYRIO. How may I assist your timepiece acquisition today?";
      }
    }

    // 5. STORE CONVERSATION TURN IN SESSION
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
    console.error("MYRIO Agent Error:", err);
    return {
      success: false,
      classification: "UNKNOWN",
      response: "MYRIO encountered a communication delay.",
      executionLatencyMs: Date.now() - startTime,
    };
  }
}