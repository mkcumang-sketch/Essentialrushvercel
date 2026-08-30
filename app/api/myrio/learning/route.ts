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
    const userRole = (session?.user as any)?.role;

    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { action } = body;

    // 1. ADD RULE
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

    // 2. DELETE RULE
    if (action === "DELETE_RULE") {
      await MyrioKnowledge.findByIdAndDelete(body.id);
      return NextResponse.json({ success: true, message: "Rule purged" });
    }

    // 3. TOP 10 MARKET TREND RADAR
    if (action === "TREND_RADAR") {
      const apiKey = process.env.GROQ_API_KEY || process.env.AIMLAPI_API_KEY;
      const fallbackRadar = [
        { rank: 1, model: "Rolex Cosmograph Daytona 116500LN", brand: "Rolex", demandScore: 99, source: "Google Trends + Chrono24 Index", suggestedPrice: "₹28,50,000", reason: "Global luxury demand surge (+38%) with high secondary appreciation." },
        { rank: 2, model: "Patek Philippe Nautilus 5711/1A-010", brand: "Patek Philippe", demandScore: 97, source: "Secondary Market Index", suggestedPrice: "₹85,00,000", reason: "Discontinued blue dial creating competitive investment bidding." },
        { rank: 3, model: "Audemars Piguet Royal Oak Jumbo 15202ST", brand: "Audemars Piguet", demandScore: 95, source: "Global Auction Indices", suggestedPrice: "₹45,00,000", reason: "Iconic complication with steady daily acquisition demand." },
        { rank: 4, model: "Richard Mille RM 11-03 Flyback", brand: "Richard Mille", demandScore: 94, source: "VIP & Celebrity Wristwear Trends", suggestedPrice: "₹1,90,00,000", reason: "High athlete and diplomat acquisition volume." },
        { rank: 5, model: "Rolex Submariner Date 'Kermit' 126610LV", brand: "Rolex", demandScore: 93, source: "Amazon Luxury + WatchBox", suggestedPrice: "₹14,50,000", reason: "Green ceramic bezel remains the most resilient daily sports watch." },
        { rank: 6, model: "Vacheron Constantin Overseas 4500V", brand: "Vacheron Constantin", demandScore: 91, source: "Google Search Surges", suggestedPrice: "₹24,00,000", reason: "Surging alternative to integrated steel bracelet complications." },
        { rank: 7, model: "Cartier Santos de Cartier Skeleton", brand: "Cartier", demandScore: 90, source: "Editorial Horology Index", suggestedPrice: "₹22,00,000", reason: "Trending geometric skeleton dial with high executive appeal." },
        { rank: 8, model: "Omega Speedmaster Moonwatch Professional", brand: "Omega", demandScore: 89, source: "Amazon Best Seller Watch Index", suggestedPrice: "₹6,80,000", reason: "Calibre 3861 upgrade driving strong volume." },
        { rank: 9, model: "A. Lange & Söhne Lange 1 Moonphase", brand: "A. Lange & Söhne", demandScore: 88, source: "European Collector Index", suggestedPrice: "₹38,00,000", reason: "Surge in German high-complication dress watch interest." },
        { rank: 10, model: "Rolex GMT-Master II 'Pepsi' 126710BLRO", brand: "Rolex", demandScore: 87, source: "Secondary Market Spot Demand", suggestedPrice: "₹18,00,000", reason: "Jubilee dual-time preference across global business travelers." },
      ];

      if (!apiKey) {
        return NextResponse.json({ success: true, radar: fallbackRadar });
      }

      try {
        const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: "You are a luxury watch market analyst. Output valid JSON with key 'radar' containing 10 items.",
              },
              {
                role: "user",
                content: "Analyze global horology market trends, Amazon best-sellers, and Google Trends. Output JSON: { radar: [{ rank, model, brand, demandScore, source, suggestedPrice, reason }] }.",
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.4,
          }),
        });

        if (aiRes.ok) {
          const json = await aiRes.json();
          const parsed = JSON.parse(json.choices?.[0]?.message?.content || "{}");
          if (Array.isArray(parsed.radar) && parsed.radar.length > 0) {
            return NextResponse.json({ success: true, radar: parsed.radar });
          }
        }
      } catch (err) {
        console.error("Groq Learning Radar Error:", err);
      }

      return NextResponse.json({ success: true, radar: fallbackRadar });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Learning API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}