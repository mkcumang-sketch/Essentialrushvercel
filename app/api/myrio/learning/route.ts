export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { MyrioKnowledge } from "@/models/MyrioKnowledge";
import { Product } from "@/models/Product";

const DEFAULT_TONE = "Luxury Concierge";
const DEFAULT_CATEGORY = "GENERAL";

function jsonError(message: string, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function normalizeRadar(items: any[]) {
  return items
    .filter((item) => item && typeof item === "object")
    .slice(0, 10)
    .map((item, index) => ({
      rank: index + 1,
      model: String(item.model || item.name || "Unknown product"),
      brand: String(item.brand || "Unknown"),
      demandScore: Math.max(
        0,
        Math.min(100, Number(item.demandScore) || 0)
      ),
      source: String(item.source || "AI market synthesis"),
      suggestedPrice: String(item.suggestedPrice || "Not available"),
      reason: String(item.reason || "No explanation available."),
    }));
}

async function getExternalMarketSignals(category: string) {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    return {
      available: false,
      signals: [] as any[],
      message: "SERPAPI_KEY is not configured; using catalog/AI analysis only.",
    };
  }

  const queries = [
    `"${category}" luxury watches trending`,
    `site:amazon.in "${category}" watches best seller`,
  ];

  const results: any[] = [];

  for (const q of queries) {
    try {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("engine", "google");
      url.searchParams.set("q", q);
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("num", "10");

      const response = await fetch(url.toString(), {
        cache: "no-store",
      });

      if (!response.ok) continue;

      const data = await response.json();

      for (const item of data.organic_results || []) {
        results.push({
          title: item.title,
          snippet: item.snippet,
          link: item.link,
          source: item.source,
        });
      }
    } catch (error) {
      console.error("External market signal error:", error);
    }
  }

  return {
    available: results.length > 0,
    signals: results.slice(0, 20),
    message:
      results.length > 0
        ? "External Google/Amazon search signals retrieved."
        : "External search returned no usable signals.",
  };
}

export async function GET() {
  try {
    await connectDB();

    const rules = await MyrioKnowledge.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, rules });
  } catch (error: any) {
    console.error("MYRIO Learning GET Error:", error);
    return jsonError(error?.message || "Unable to load MYRIO learning rules.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
      return jsonError("Unauthorized", 401);
    }

    await connectDB();

    const body = await req.json();
    const action = String(body?.action || "");

    if (action === "ADD_RULE") {
      const triggerQuery = String(body?.triggerQuery || "").trim();
      const responseGuideline = String(body?.responseGuideline || "").trim();
      const tone = String(body?.tone || DEFAULT_TONE).trim();
      const category = String(body?.category || DEFAULT_CATEGORY).trim();

      if (!triggerQuery || !responseGuideline) {
        return jsonError("Missing required fields", 400);
      }

      const rule = await MyrioKnowledge.create({
        triggerQuery,
        responseGuideline,
        tone: tone || DEFAULT_TONE,
        category: category || DEFAULT_CATEGORY,
        isActive: true,
      });

      return NextResponse.json({ success: true, rule });
    }

    if (action === "DELETE_RULE") {
      const id = String(body?.id || "").trim();

      if (!id) {
        return jsonError("Rule ID is required", 400);
      }

      const deleted = await MyrioKnowledge.findByIdAndDelete(id);

      if (!deleted) {
        return jsonError("Rule not found", 404);
      }

      return NextResponse.json({
        success: true,
        message: "Rule purged",
      });
    }

    if (action === "TREND_RADAR") {
      const category = String(
        body?.category || "Rolex & Luxury Sports"
      ).trim();

      if (!category) {
        return jsonError("Category is required", 400);
      }

      /*
       * IMPORTANT:
       * Groq by itself does not browse Google Trends or Amazon.
       * When SERPAPI_KEY exists, external Google/Amazon search signals
       * are supplied to the model. Without it, the model is restricted
       * to the local catalog and must not invent live-market claims.
       */
      const [products, marketSignals] = await Promise.all([
        Product.find({}).limit(100).lean(),
        getExternalMarketSignals(category),
      ]);

      const apiKey =
        process.env.GROQ_API_KEY || process.env.AIMLAPI_API_KEY;

      if (!apiKey) {
        const catalogMatches = products
          .filter((product: any) => {
            const haystack = [
              product?.name,
              product?.brand,
              product?.category,
              product?.description,
              product?.seoTags,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return haystack.includes(category.toLowerCase());
          })
          .slice(0, 10);

        const radar = normalizeRadar(
          catalogMatches.map((product: any, index: number) => ({
            rank: index + 1,
            model: product.name,
            brand: product.brand,
            demandScore: 0,
            source: "Local Catalog Match",
            suggestedPrice:
              product.offerPrice || product.price || "Not available",
            reason:
              "Matched from the current catalog. Live market verification is unavailable because GROQ_API_KEY is not configured.",
          }))
        );

        return NextResponse.json({
          success: true,
          radar,
          meta: {
            category,
            liveMarketData: marketSignals.available,
            source: marketSignals.message,
          },
        });
      }

      try {
        const catalog = products.map((product: any) => ({
          name: product?.name,
          brand: product?.brand,
          category: product?.category,
          price: product?.price,
          offerPrice: product?.offerPrice,
          description: product?.description,
        }));

        const externalSignals = marketSignals.signals.map((signal: any) => ({
          title: signal.title,
          snippet: signal.snippet,
          source: signal.source,
          link: signal.link,
        }));

        const aiRes = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
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
                  content: `
You are MYRIO, a luxury-watch market intelligence analyst.

Your job is to rank EXACTLY 10 relevant products for the requested category.

Rules:
1. Return ONLY valid JSON.
2. JSON must have exactly one key: "radar".
3. "radar" must contain exactly 10 objects.
4. Each object must contain:
   rank, model, brand, demandScore, source, suggestedPrice, reason.
5. demandScore must be an integer from 0 to 100.
6. Do not invent Google Trends, Amazon, auction, sales, search-volume,
   price, or demand statistics.
7. If external search signals are supplied, you may use them as evidence,
   but do not claim a source contains information that is not present.
8. If there are fewer than 10 directly supported products, use the best
   relevant products from the supplied catalog and clearly say so in reason.
9. Never fabricate a product just to reach 10.
10. A source must describe the actual evidence used, such as
    "Google/Amazon search signals", "Local Catalog", or "AI synthesis".
                  `.trim(),
                },
                {
                  role: "user",
                  content: JSON.stringify({
                    task: "Find the top 10 products for this category.",
                    category,
                    externalMarketSignals: externalSignals,
                    localCatalog: catalog,
                  }),
                },
              ],
              response_format: { type: "json_object" },
              temperature: 0.2,
            }),
          }
        );

        if (aiRes.ok) {
          const json = await aiRes.json();
          const rawContent =
            json?.choices?.[0]?.message?.content || "{}";

          const parsed = JSON.parse(rawContent);
          const radar = normalizeRadar(parsed?.radar || []);

          if (radar.length === 10) {
            return NextResponse.json({
              success: true,
              radar,
              meta: {
                category,
                liveMarketData: marketSignals.available,
                source: marketSignals.message,
              },
            });
          }
        }
      } catch (error) {
        console.error("MYRIO Trend Radar AI Error:", error);
      }

      /*
       * Safe fallback: never fabricate ten products.
       * Return only actual catalog matches.
       */
      const catalogMatches = products
        .filter((product: any) => {
          const haystack = [
            product?.name,
            product?.brand,
            product?.category,
            product?.description,
            product?.seoTags,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(category.toLowerCase());
        })
        .slice(0, 10);

      const radar = normalizeRadar(
        catalogMatches.map((product: any, index: number) => ({
          rank: index + 1,
          model: product.name,
          brand: product.brand,
          demandScore: 0,
          source: marketSignals.available
            ? "Catalog + External Search Signals"
            : "Local Catalog Match",
          suggestedPrice:
            product.offerPrice || product.price || "Not available",
          reason:
            "Returned from the current product catalog after the AI ranking step could not produce a complete verified set of 10.",
        }))
      );

      return NextResponse.json({
        success: true,
        radar,
        meta: {
          category,
          liveMarketData: marketSignals.available,
          source: marketSignals.message,
          partial: radar.length < 10,
        },
      });
    }

    return jsonError("Invalid action", 400);
  } catch (error: any) {
    console.error("MYRIO Learning API Error:", error);
    return jsonError(
      error?.message || "MYRIO Learning API request failed."
    );
  }
}
