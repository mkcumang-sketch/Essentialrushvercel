export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { MyrioKnowledge } from "@/models/MyrioKnowledge";
import { Product } from "@/models/Product";

export async function GET() {
  try {
    await connectDB();
    const rules = await MyrioKnowledge.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, rules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { action } = body;

    // Action 1: Save Custom Response Rule
    if (action === "ADD_RULE") {
      const { triggerQuery, responseGuideline, tone, category } = body;
      if (!triggerQuery || !responseGuideline) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
      }

      const rule = await MyrioKnowledge.create({
        triggerQuery,
        responseGuideline,
        tone: tone || "Luxury Concierge",
        category: category || "GENERAL",
        isActive: true,
      });

      return NextResponse.json({ success: true, rule });
    }

    // Action 2: Delete Rule
    if (action === "DELETE_RULE") {
      const { id } = body;
      await MyrioKnowledge.findByIdAndDelete(id);
      return NextResponse.json({ success: true, message: "Rule purged" });
    }

    // Action 3: Market Trend & Competitor Synthesis (Top 10 Radar)
    if (action === "TREND_RADAR") {
      const apiKey = process.env.GROQ_API_KEY || process.env.AIMLAPI_API_KEY;
      const products = await Product.find({ isActive: true }).select("name brand price category").lean();

      if (!apiKey) {
        return NextResponse.json({
          success: true,
          radar: [
            { rank: 1, model: "Rolex Submariner Date 126610LN", demandScore: 98, source: "Google Trends / Amazon Top", action: "Stock Recommended", reason: "Sustained high luxury search volume." },
            { rank: 2, model: "Patek Philippe Nautilus 5711/1A", demandScore: 96, source: "Secondary Market Index", action: "Vault Backorder", reason: "Investment hedge with high secondary appreciation." },
            { rank: 3, model: "Audemars Piguet Royal Oak Jumbo 15202", demandScore: 94, source: "Global Auction Trends", action: "Stock Recommended", reason: "Iconic complication demand." },
          ],
        });
      }

      const prompt = `You are the Horology Market Intelligence Engine for Essential Rush.
Analyze global luxury watch sales, Amazon best-seller watch trends, secondary market arbitrage, and Google search demand.
Current store catalog sample: ${JSON.stringify(products.slice(0, 10))}

Return a JSON array of TOP 10 trending investment-grade watches that Essential Rush should prioritize or feature.
Format JSON only with key "radar":
[
  {
    "rank": 1,
    "model": "Rolex Daytona 116500LN",
    "brand": "Rolex",
    "demandScore": 99,
    "source": "Google Trends + Chrono24 Index",
    "suggestedPrice": "₹28,50,000",
    "reason": "Search volume surged 24% globally with ultra-low retail allocation."
  }
]`;

      const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.5,
        }),
      });

      if (aiRes.ok) {
        const json = await aiRes.json();
        const parsed = JSON.parse(json.choices?.[0]?.message?.content || "{}");
        return NextResponse.json({ success: true, radar: parsed.radar || [] });
      }

      throw new Error("AI provider failed to generate trend radar");
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Learning API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}