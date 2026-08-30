export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { MyrioKnowledge } from "@/models/MyrioKnowledge";

// ============================================================================
// TYPES
// ============================================================================

interface RadarItem {
  rank: number;
  model: string;
  brand?: string;
  demandScore: number;
  source: string;
  suggestedPrice?: string;
  reason: string;
}

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

// ============================================================================
// AUTH
// ============================================================================

function isAdmin(session: any): boolean {
  const role = session?.user?.role;

  return (
    !!session &&
    (role === "SUPER_ADMIN" ||
      role === "ADMIN")
  );
}

// ============================================================================
// JSON HELPERS
// ============================================================================

function cleanJsonResponse(
  value: string
): string {
  return value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

// ============================================================================
// RADAR NORMALIZATION
// ============================================================================

function normalizeRadarItem(
  item: any,
  index: number
): RadarItem | null {
  if (
    !item ||
    typeof item !== "object"
  ) {
    return null;
  }

  const model =
    typeof item.model === "string"
      ? item.model.trim()
      : "";

  const reason =
    typeof item.reason === "string"
      ? item.reason.trim()
      : "";

  const source =
    typeof item.source === "string"
      ? item.source.trim()
      : "AI Market Assessment";

  if (!model || !reason) {
    return null;
  }

  let demandScore =
    Number(item.demandScore);

  if (!Number.isFinite(demandScore)) {
    demandScore = 0;
  }

  demandScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(demandScore)
    )
  );

  return {
    rank: index + 1,
    model,
    brand:
      typeof item.brand === "string"
        ? item.brand.trim()
        : undefined,
    demandScore,
    source,
    suggestedPrice:
      typeof item.suggestedPrice ===
      "string"
        ? item.suggestedPrice.trim()
        : undefined,
    reason,
  };
}

function normalizeRadar(
  items: any[]
): RadarItem[] {
  return items
    .map((item, index) =>
      normalizeRadarItem(
        item,
        index
      )
    )
    .filter(
      (
        item
      ): item is RadarItem =>
        item !== null
    )
    .slice(0, 10)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}

// ============================================================================
// FALLBACK INTELLIGENCE
// ============================================================================

function createFallbackRadar(
  category: string
): RadarItem[] {
  const normalized =
    category.toLowerCase();

  // --------------------------------------------------------------------------
  // ROLEX
  // --------------------------------------------------------------------------

  if (
    normalized.includes("rolex") ||
    normalized.includes("sports")
  ) {
    return [
      {
        rank: 1,
        model:
          "Rolex Submariner Date 126610LN",
        brand: "Rolex",
        demandScore: 98,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "₹12–15 lakh approx.",
        reason:
          "Strong global recognition, sports-watch positioning, and consistently high collector interest.",
      },
      {
        rank: 2,
        model:
          "Rolex GMT-Master II 126710BLRO",
        brand: "Rolex",
        demandScore: 97,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "₹18–23 lakh approx.",
        reason:
          "Highly recognizable GMT configuration with strong enthusiast and collector demand.",
      },
      {
        rank: 3,
        model:
          "Rolex Daytona 126500LN",
        brand: "Rolex",
        demandScore: 96,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "₹25–35 lakh approx.",
        reason:
          "Iconic chronograph with exceptional brand recognition and strong collector positioning.",
      },
      {
        rank: 4,
        model:
          "Rolex GMT-Master II 126710BLNR",
        brand: "Rolex",
        demandScore: 94,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "₹16–20 lakh approx.",
        reason:
          "Versatile GMT sports configuration with strong travel and everyday-wear appeal.",
      },
      {
        rank: 5,
        model:
          "Rolex Submariner No-Date 124060",
        brand: "Rolex",
        demandScore: 93,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "₹10–13 lakh approx.",
        reason:
          "Classic tool-watch design with broad luxury sports-watch appeal.",
      },
      {
        rank: 6,
        model:
          "Rolex Oyster Perpetual 41",
        brand: "Rolex",
        demandScore: 90,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "₹7–10 lakh approx.",
        reason:
          "Accessible entry into the Rolex luxury ecosystem with strong everyday usability.",
      },
      {
        rank: 7,
        model: "Rolex Explorer 40",
        brand: "Rolex",
        demandScore: 87,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "₹7–10 lakh approx.",
        reason:
          "Understated sports and tool-watch character appeals to buyers seeking versatility.",
      },
      {
        rank: 8,
        model:
          "Rolex Sea-Dweller 126600",
        brand: "Rolex",
        demandScore: 85,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "₹14–18 lakh approx.",
        reason:
          "Professional diving heritage gives the model strong enthusiast credibility.",
      },
      {
        rank: 9,
        model:
          "Rolex Yacht-Master 40",
        brand: "Rolex",
        demandScore: 82,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "₹11–16 lakh approx.",
        reason:
          "Sport-luxury positioning combines technical design with refined everyday appeal.",
      },
      {
        rank: 10,
        model:
          "Rolex Air-King 126900",
        brand: "Rolex",
        demandScore: 78,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "₹7–9 lakh approx.",
        reason:
          "Distinctive aviation-inspired design with strong Rolex brand recognition.",
      },
    ];
  }

  // --------------------------------------------------------------------------
  // PATEK / AP
  // --------------------------------------------------------------------------

  if (
    normalized.includes("patek") ||
    normalized.includes("audemars") ||
    normalized.includes("ap")
  ) {
    return [
      {
        rank: 1,
        model:
          "Patek Philippe Nautilus",
        brand: "Patek Philippe",
        demandScore: 98,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "Model-dependent",
        reason:
          "Iconic integrated-bracelet luxury sports positioning and strong collector recognition.",
      },
      {
        rank: 2,
        model:
          "Audemars Piguet Royal Oak",
        brand: "Audemars Piguet",
        demandScore: 97,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "Model-dependent",
        reason:
          "One of the defining modern luxury sports-watch designs.",
      },
      {
        rank: 3,
        model:
          "Patek Philippe Aquanaut",
        brand: "Patek Philippe",
        demandScore: 95,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "Model-dependent",
        reason:
          "Contemporary sports-luxury design with strong collector demand.",
      },
      {
        rank: 4,
        model:
          "Audemars Piguet Royal Oak Offshore",
        brand: "Audemars Piguet",
        demandScore: 91,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "Model-dependent",
        reason:
          "Bold sports chronograph identity with established collector appeal.",
      },
      {
        rank: 5,
        model:
          "Patek Philippe Calatrava",
        brand: "Patek Philippe",
        demandScore: 89,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "Model-dependent",
        reason:
          "Classic dress-watch positioning and high horological prestige.",
      },
      {
        rank: 6,
        model:
          "Audemars Piguet Code 11.59",
        brand: "Audemars Piguet",
        demandScore: 84,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "Model-dependent",
        reason:
          "Modern collection with strong technical and design credentials.",
      },
      {
        rank: 7,
        model:
          "Patek Philippe Complications",
        brand: "Patek Philippe",
        demandScore: 83,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "Model-dependent",
        reason:
          "High horological complexity supports specialist collector interest.",
      },
      {
        rank: 8,
        model:
          "Royal Oak Perpetual Calendar",
        brand: "Audemars Piguet",
        demandScore: 82,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "Model-dependent",
        reason:
          "Complication depth combined with iconic Royal Oak design.",
      },
      {
        rank: 9,
        model:
          "Patek Philippe Grand Complications",
        brand: "Patek Philippe",
        demandScore: 80,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "Model-dependent",
        reason:
          "Extremely high-end horology with specialist collector relevance.",
      },
      {
        rank: 10,
        model:
          "Audemars Piguet Millenary",
        brand: "Audemars Piguet",
        demandScore: 74,
        source:
          "MYRIO Fallback Intelligence",
        suggestedPrice:
          "Model-dependent",
        reason:
          "Distinctive architecture and niche collector positioning.",
      },
    ];
  }

  // --------------------------------------------------------------------------
  // GENERIC CATEGORY
  // --------------------------------------------------------------------------

  return [
    {
      rank: 1,
      model:
        `${category} — Collector Favorite`,
      demandScore: 94,
      source:
        "MYRIO Fallback Intelligence",
      suggestedPrice:
        "Market-dependent",
      reason:
        `Strong potential demand within the ${category} segment based on luxury positioning and collector relevance.`,
    },
    {
      rank: 2,
      model:
        `${category} — Heritage Selection`,
      demandScore: 91,
      source:
        "MYRIO Fallback Intelligence",
      suggestedPrice:
        "Market-dependent",
      reason:
        "Heritage and recognizable design language can support strong collector interest.",
    },
    {
      rank: 3,
      model:
        `${category} — Sport Luxury`,
      demandScore: 89,
      source:
        "MYRIO Fallback Intelligence",
      suggestedPrice:
        "Market-dependent",
      reason:
        "Sport-luxury positioning provides broad appeal across enthusiast and lifestyle buyers.",
    },
    {
      rank: 4,
      model:
        `${category} — Modern Icon`,
      demandScore: 87,
      source:
        "MYRIO Fallback Intelligence",
      suggestedPrice:
        "Market-dependent",
      reason:
        "Modern styling and strong visual identity can attract newer luxury buyers.",
    },
    {
      rank: 5,
      model:
        `${category} — Limited Production`,
      demandScore: 85,
      source:
        "MYRIO Fallback Intelligence",
      suggestedPrice:
        "Market-dependent",
      reason:
        "Scarcity and controlled production can increase collector desirability.",
    },
    {
      rank: 6,
      model:
        `${category} — Executive Choice`,
      demandScore: 83,
      source:
        "MYRIO Fallback Intelligence",
      suggestedPrice:
        "Market-dependent",
      reason:
        "Premium positioning makes this segment relevant for executive and occasion-driven buyers.",
    },
    {
      rank: 7,
      model:
        `${category} — Everyday Luxury`,
      demandScore: 81,
      source:
        "MYRIO Fallback Intelligence",
      suggestedPrice:
        "Market-dependent",
      reason:
        "Versatility and daily wearability broaden the potential customer base.",
    },
    {
      rank: 8,
      model:
        `${category} — Specialist Pick`,
      demandScore: 79,
      source:
        "MYRIO Fallback Intelligence",
      suggestedPrice:
        "Market-dependent",
      reason:
        "Specialist characteristics can create strong niche demand among enthusiasts.",
    },
    {
      rank: 9,
      model:
        `${category} — Emerging Interest`,
      demandScore: 76,
        source:
        "MYRIO Fallback Intelligence",
      suggestedPrice:
        "Market-dependent",
      reason:
        "Growing awareness can create an emerging opportunity within this category.",
    },
    {
      rank: 10,
      model:
        `${category} — Value Position`,
      demandScore: 73,
      source:
        "MYRIO Fallback Intelligence",
      suggestedPrice:
        "Market-dependent",
      reason:
        "Value-oriented positioning can attract buyers entering the luxury category.",
    },
  ];
}

// ============================================================================
// GET — KNOWLEDGE RULES
// ============================================================================

export async function GET() {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (!isAdmin(session)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const rules =
      await MyrioKnowledge.find({})
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();

    return NextResponse.json({
      success: true,
      rules,
    });
  } catch (error: any) {
    console.error(
      "MYRIO Learning GET Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to load MYRIO knowledge.",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST
// ============================================================================

export async function POST(
  req: NextRequest
) {
  try {
    // ------------------------------------------------------------------------
    // AUTH
    // ------------------------------------------------------------------------

    const session =
      await getServerSession(
        authOptions
      );

    if (!isAdmin(session)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // ------------------------------------------------------------------------
    // BODY
    // ------------------------------------------------------------------------

    let body: any;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    const action =
      typeof body?.action === "string"
        ? body.action.trim()
        : "";

    // =========================================================================
    // TREND RADAR
    // =========================================================================
    //
    // IMPORTANT:
    // No MongoDB connection here.
    // Trend Radar only needs Groq + fallback intelligence.
    // This reduces unnecessary latency.
    // =========================================================================

    if (action === "TREND_RADAR") {
      const rawCategory =
        typeof body.category === "string"
          ? body.category.trim()
          : "";

      const targetCategory =
        rawCategory ||
        "Luxury Timepieces";

      if (targetCategory.length > 100) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Category must be 100 characters or less.",
          },
          { status: 400 }
        );
      }

      const fallbackRadar =
        createFallbackRadar(
          targetCategory
        );

      const groqApiKey =
        process.env.GROQ_API_KEY;

      // ----------------------------------------------------------------------
      // NO API KEY
      // ----------------------------------------------------------------------

      if (!groqApiKey) {
        return NextResponse.json({
          success: true,
          category: targetCategory,
          radar: fallbackRadar,
          metadata: {
            provider:
              "MYRIO Fallback Intelligence",
            model: "Fallback",
            dataType:
              "AI market assessment fallback",
            liveExternalData: false,
            generatedAt:
              new Date().toISOString(),
          },
          warning:
            "GROQ_API_KEY is not configured. Fallback intelligence returned.",
        });
      }

      // ----------------------------------------------------------------------
      // PROMPTS
      // ----------------------------------------------------------------------

      const systemPrompt = `
You are MYRIO, the market-intelligence analyst for Essential Rush.

Your task is to analyze a requested luxury product category and return
structured market-intelligence candidates.

TRUTHFULNESS RULES:

1. You do NOT have direct live access to Google Trends.
2. You do NOT have direct live access to Amazon.
3. You do NOT have direct live access to Chrono24.
4. You do NOT have direct live access to auction-house databases.
5. Never claim you queried a live source unless actual source data was supplied.
6. Never invent fake market measurements.
7. Never invent fake sales numbers.
8. Never invent fake search volumes.
9. Use known real-world products/models whenever possible.
10. Never use placeholder names such as "Edition A" or "Model B".
11. demandScore is an AI estimate from 0-100.
12. Output JSON only.
13. Return exactly 10 useful candidates whenever possible.

JSON FORMAT:

{
  "radar": [
    {
      "rank": 1,
      "model": "Real product/model name",
      "brand": "Brand",
      "demandScore": 95,
      "source": "AI Market Assessment",
      "suggestedPrice": "Approximate range",
      "reason": "Concise explanation"
    }
  ]
}
`.trim();

      const userPrompt = `
Analyze this requested luxury category:

"${targetCategory}"

Prioritize:

- real products/models
- recognizable brands
- category relevance
- collector interest
- luxury positioning
- scarcity
- customer demand
- secondary-market relevance
- price positioning
- purchase intent

No live external dataset is supplied.

Therefore do NOT claim that Google Trends, Amazon,
Chrono24, auctions, or social platforms were actually queried.

Return exactly 10 candidates.

Return JSON only:
{
  "radar": [...]
}
`.trim();

      // ----------------------------------------------------------------------
      // GROQ
      // ----------------------------------------------------------------------

      try {
        const controller =
          new AbortController();

        const timeout =
          setTimeout(
            () => controller.abort(),
            25000
          );

        let aiRes: Response;

        try {
          aiRes = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${groqApiKey}`,
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                model:
                  "llama-3.3-70b-versatile",

                messages: [
                  {
                    role: "system",
                    content:
                      systemPrompt,
                  },
                  {
                    role: "user",
                    content:
                      userPrompt,
                  },
                ],

                response_format: {
                  type: "json_object",
                },

                temperature: 0.2,

                max_tokens: 4000,
              }),

              cache: "no-store",

              signal: controller.signal,
            }
          );
        } finally {
          clearTimeout(timeout);
        }

        // --------------------------------------------------------------------
        // GROQ ERROR → FALLBACK
        // --------------------------------------------------------------------

        if (!aiRes.ok) {
          const errorText =
            await aiRes.text();

          console.error(
            "MYRIO Groq API Error:",
            aiRes.status,
            errorText
          );

          return NextResponse.json({
            success: true,
            category: targetCategory,
            radar: fallbackRadar,
            metadata: {
              provider:
                "MYRIO Fallback Intelligence",
              model: "Fallback",
              dataType:
                "AI market assessment fallback",
              liveExternalData: false,
              generatedAt:
                new Date().toISOString(),
            },
            warning:
              "Primary AI provider temporarily unavailable. Fallback intelligence returned.",
          });
        }

        // --------------------------------------------------------------------
        // PARSE GROQ RESPONSE
        // --------------------------------------------------------------------

        const json =
          (await aiRes.json()) as GroqResponse;

        let rawContent =
          json?.choices?.[0]?.message
            ?.content || "";

        if (!rawContent) {
          return NextResponse.json({
            success: true,
            category: targetCategory,
            radar: fallbackRadar,
            metadata: {
              provider:
                "MYRIO Fallback Intelligence",
              model: "Fallback",
              dataType:
                "AI market assessment fallback",
              liveExternalData: false,
              generatedAt:
                new Date().toISOString(),
            },
            warning:
              "MYRIO returned an empty AI response. Fallback intelligence returned.",
          });
        }

        rawContent =
          cleanJsonResponse(
            rawContent
          );

        // --------------------------------------------------------------------
        // JSON PARSE
        // --------------------------------------------------------------------

        let parsed: any;

        try {
          parsed = JSON.parse(
            rawContent
          );
        } catch (parseError) {
          console.error(
            "MYRIO Radar JSON Parse Error:",
            parseError,
            rawContent
          );

          return NextResponse.json({
            success: true,
            category: targetCategory,
            radar: fallbackRadar,
            metadata: {
              provider:
                "MYRIO Fallback Intelligence",
              model: "Fallback",
              dataType:
                "AI market assessment fallback",
              liveExternalData: false,
              generatedAt:
                new Date().toISOString(),
            },
            warning:
              "MYRIO returned malformed AI data. Fallback intelligence returned.",
          });
        }

        // --------------------------------------------------------------------
        // NORMALIZE
        // --------------------------------------------------------------------

        if (
          !Array.isArray(
            parsed?.radar
          )
        ) {
          return NextResponse.json({
            success: true,
            category: targetCategory,
            radar: fallbackRadar,
            metadata: {
              provider:
                "MYRIO Fallback Intelligence",
              model: "Fallback",
              dataType:
                "AI market assessment fallback",
              liveExternalData: false,
              generatedAt:
                new Date().toISOString(),
            },
            warning:
              "MYRIO returned an invalid radar structure. Fallback intelligence returned.",
          });
        }

        const radar =
          normalizeRadar(
            parsed.radar
          );

        // --------------------------------------------------------------------
        // QUALITY CHECK
        // --------------------------------------------------------------------

        if (radar.length === 0) {
          return NextResponse.json({
            success: true,
            category: targetCategory,
            radar: fallbackRadar,
            metadata: {
              provider:
                "MYRIO Fallback Intelligence",
              model: "Fallback",
              dataType:
                "AI market assessment fallback",
              liveExternalData: false,
              generatedAt:
                new Date().toISOString(),
            },
            warning:
              "MYRIO could not produce valid candidates. Fallback intelligence returned.",
          });
        }

        // --------------------------------------------------------------------
        // SUCCESS
        // --------------------------------------------------------------------

        return NextResponse.json({
          success: true,

          category:
            targetCategory,

          radar,

          metadata: {
            provider: "Groq",
            model:
              "llama-3.3-70b-versatile",
            dataType:
              "AI market assessment",
            liveExternalData: false,
            generatedAt:
              new Date().toISOString(),
          },
        });
      } catch (error: any) {
        console.error(
          "MYRIO Trend Radar Provider Error:",
          error
        );

        // IMPORTANT:
        // Provider/network failure should never
        // destroy the MYRIO experience.

        return NextResponse.json({
          success: true,
          category: targetCategory,
          radar: fallbackRadar,
          metadata: {
            provider:
              "MYRIO Fallback Intelligence",
            model: "Fallback",
            dataType:
              "AI market assessment fallback",
            liveExternalData: false,
            generatedAt:
              new Date().toISOString(),
          },
          warning:
            error?.name === "AbortError"
              ? "AI provider timed out. Fallback intelligence returned."
              : "AI provider was unavailable. Fallback intelligence returned.",
        });
      }
    }

    // =========================================================================
    // DATABASE ACTIONS
    // =========================================================================

    await connectDB();

    // =========================================================================
    // ADD RULE
    // =========================================================================

    if (action === "ADD_RULE") {
      const triggerQuery =
        typeof body.triggerQuery ===
        "string"
          ? body.triggerQuery.trim()
          : "";

      const responseGuideline =
        typeof body.responseGuideline ===
        "string"
          ? body.responseGuideline.trim()
          : "";

      const tone =
        typeof body.tone === "string"
          ? body.tone.trim()
          : "";

      const category =
        typeof body.category === "string"
          ? body.category.trim()
          : "";

      if (!triggerQuery) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Trigger query is required.",
          },
          { status: 400 }
        );
      }

      if (triggerQuery.length > 500) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Trigger query must be 500 characters or less.",
          },
          { status: 400 }
        );
      }

      if (!responseGuideline) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Response guideline is required.",
          },
          { status: 400 }
        );
      }

      if (
        responseGuideline.length >
        2000
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Response guideline must be 2000 characters or less.",
          },
          { status: 400 }
        );
      }

      const rule =
        await MyrioKnowledge.create({
          triggerQuery,
          responseGuideline,
          tone,
          category,
          isActive: true,
        });

      return NextResponse.json({
        success: true,
        rule,
      });
    }

    // =========================================================================
    // DELETE RULE
    // =========================================================================

    if (action === "DELETE_RULE") {
      const id =
        typeof body.id === "string"
          ? body.id.trim()
          : "";

      if (!id) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Rule ID is required.",
          },
          { status: 400 }
        );
      }

      const deletedRule =
        await MyrioKnowledge.findByIdAndDelete(
          id
        );

      if (!deletedRule) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Rule not found.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          "Rule purged successfully.",
      });
    }

    // =========================================================================
    // INVALID ACTION
    // =========================================================================

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action.",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error(
      "MYRIO Learning API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unexpected MYRIO learning API error.",
      },
      { status: 500 }
    );
  }
}