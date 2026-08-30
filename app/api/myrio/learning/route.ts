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
// HELPERS
// ============================================================================

function isAdmin(session: any): boolean {
  const role = session?.user?.role;

  return (
    !!session &&
    (role === "SUPER_ADMIN" || role === "ADMIN")
  );
}

function cleanJsonResponse(value: string): string {
  return value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function normalizeRadarItem(
  item: any,
  index: number
): RadarItem | null {
  if (!item || typeof item !== "object") {
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
      : "AI Market Analysis";

  if (!model || !reason) {
    return null;
  }

  let demandScore = Number(item.demandScore);

  if (!Number.isFinite(demandScore)) {
    demandScore = 0;
  }

  demandScore = Math.max(
    0,
    Math.min(100, Math.round(demandScore))
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
      typeof item.suggestedPrice === "string"
        ? item.suggestedPrice.trim()
        : undefined,
    reason,
  };
}

function normalizeRadar(items: any[]): RadarItem[] {
  return items
    .map((item, index) =>
      normalizeRadarItem(item, index)
    )
    .filter(
      (item): item is RadarItem =>
        item !== null
    )
    .slice(0, 10)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}

// ============================================================================
// GET
// ============================================================================

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!isAdmin(session)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    await connectDB();

    const rules = await MyrioKnowledge.find({})
      .sort({ createdAt: -1 })
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
      {
        status: 500,
      }
    );
  }
}

// ============================================================================
// POST
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // ------------------------------------------------------------------------
    // AUTH
    // ------------------------------------------------------------------------

    const session = await getServerSession(
      authOptions
    );

    if (!isAdmin(session)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // ------------------------------------------------------------------------
    // DATABASE
    // ------------------------------------------------------------------------

    await connectDB();

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
          error: "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    const action =
      typeof body?.action === "string"
        ? body.action.trim()
        : "";

    // =========================================================================
    // ADD RULE
    // =========================================================================

    if (action === "ADD_RULE") {
      const triggerQuery =
        typeof body.triggerQuery === "string"
          ? body.triggerQuery.trim()
          : "";

      const responseGuideline =
        typeof body.responseGuideline === "string"
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
            error: "Trigger query is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!responseGuideline) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Response guideline is required.",
          },
          {
            status: 400,
          }
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
            error: "Rule ID is required.",
          },
          {
            status: 400,
          }
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
            error: "Rule not found.",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Rule purged successfully.",
      });
    }

    // =========================================================================
    // TREND RADAR
    // =========================================================================

    if (action === "TREND_RADAR") {
      const rawCategory =
        typeof body.category === "string"
          ? body.category.trim()
          : "";

      const targetCategory =
        rawCategory || "Luxury Timepieces";

      // ----------------------------------------------------------------------
      // SECURITY / INPUT LIMIT
      // ----------------------------------------------------------------------

      if (targetCategory.length > 100) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Category must be 100 characters or less.",
          },
          {
            status: 400,
          }
        );
      }

      const groqApiKey =
        process.env.GROQ_API_KEY;

      // ----------------------------------------------------------------------
      // NO API KEY
      // ----------------------------------------------------------------------

      if (!groqApiKey) {
        return NextResponse.json(
          {
            success: false,
            error:
              "MYRIO market intelligence is not configured. GROQ_API_KEY is missing.",
            radar: [],
          },
          {
            status: 503,
          }
        );
      }

      // ----------------------------------------------------------------------
      // IMPORTANT:
      // Groq itself does NOT have live Google Trends / Amazon access.
      //
      // Therefore we explicitly tell it NOT to pretend that it has verified
      // live data.
      // ----------------------------------------------------------------------

      const systemPrompt = `
You are MYRIO, the market-intelligence analyst for Essential Rush.

Your task is to analyze a requested luxury product category and return
structured market-intelligence candidates.

CRITICAL TRUTHFULNESS RULES:

1. You do NOT have direct live access to Google Trends.
2. You do NOT have direct live access to Amazon.
3. You do NOT have direct live access to Chrono24.
4. You do NOT have direct live access to auction-house databases.
5. Never claim that you checked a live source unless actual source data
   has been supplied to you in this request.
6. Never invent fake products, fake editions, fake market indexes,
   fake search volumes, fake sales numbers, or fake source measurements.
7. Use known real-world products/models when possible.
8. If a claim cannot be verified from supplied data, clearly describe it
   as an AI market assessment rather than verified live data.
9. Never create placeholder names such as:
   "Flagship Edition A",
   "Complication B",
   "Modern D",
   "Vault J", etc.
10. Return exactly 10 useful candidates whenever possible.
11. demandScore must be an estimated AI assessment from 0-100,
    NOT presented as an actual measured Google Trends score.
12. Output JSON only.

Return:

{
  "radar": [
    {
      "rank": 1,
      "model": "Real product/model name",
      "brand": "Brand",
      "demandScore": 0,
      "source": "AI Market Assessment",
      "suggestedPrice": "Approximate market range",
      "reason": "Concise explanation"
    }
  ]
}
`.trim();

      const userPrompt = `
Analyze this requested category:

"${targetCategory}"

Build a market-intelligence radar focused specifically on this category.

Prioritize:

- real products/models
- recognizable brands
- current category relevance
- collector interest
- luxury positioning
- scarcity/availability considerations
- likely customer demand
- resale/secondary-market relevance
- price positioning
- purchase intent

Because no live external market dataset is supplied, DO NOT claim
that Google Trends, Amazon, Chrono24, auctions, or social platforms
were actually queried.

If a price is uncertain, describe it as an approximate range.

Return exactly:

{
  "radar": [...]
}

with 10 items.
`.trim();

      // ----------------------------------------------------------------------
      // GROQ REQUEST
      // ----------------------------------------------------------------------

      try {
        const aiRes = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",

            headers: {
              Authorization: `Bearer ${groqApiKey}`,
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              model:
                "llama-3.3-70b-versatile",

              messages: [
                {
                  role: "system",
                  content: systemPrompt,
                },
                {
                  role: "user",
                  content: userPrompt,
                },
              ],

              response_format: {
                type: "json_object",
              },

              temperature: 0.2,

              max_tokens: 5000,
            }),

            cache: "no-store",
          }
        );

        // --------------------------------------------------------------------
        // API ERROR
        // --------------------------------------------------------------------

        if (!aiRes.ok) {
          const errorText =
            await aiRes.text();

          console.error(
            "MYRIO Groq API Error:",
            aiRes.status,
            errorText
          );

          return NextResponse.json(
            {
              success: false,
              error:
                "MYRIO market intelligence provider returned an error.",
              radar: [],
            },
            {
              status: 502,
            }
          );
        }

        // --------------------------------------------------------------------
        // PARSE RESPONSE
        // --------------------------------------------------------------------

        const json =
          (await aiRes.json()) as GroqResponse;

        let rawContent =
          json?.choices?.[0]?.message
            ?.content || "";

        if (!rawContent) {
          return NextResponse.json(
            {
              success: false,
              error:
                "MYRIO returned an empty intelligence response.",
              radar: [],
            },
            {
              status: 502,
            }
          );
        }

        rawContent =
          cleanJsonResponse(rawContent);

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

          return NextResponse.json(
            {
              success: false,
              error:
                "MYRIO returned invalid intelligence data.",
              radar: [],
            },
            {
              status: 502,
            }
          );
        }

        // --------------------------------------------------------------------
        // NORMALIZE
        // --------------------------------------------------------------------

        if (
          !Array.isArray(parsed?.radar)
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                "MYRIO returned an invalid radar structure.",
              radar: [],
            },
            {
              status: 502,
            }
          );
        }

        const radar =
          normalizeRadar(
            parsed.radar
          );

        // --------------------------------------------------------------------
        // QUALITY CHECK
        // --------------------------------------------------------------------

        if (radar.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error:
                "MYRIO could not produce valid market candidates for this category.",
              radar: [],
            },
            {
              status: 422,
            }
          );
        }

        // --------------------------------------------------------------------
        // RESPONSE
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

            liveExternalData:
              false,

            generatedAt:
              new Date().toISOString(),
          },
        });
      } catch (error: any) {
        console.error(
          "MYRIO Trend Radar Error:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            error:
              error?.message ||
              "Unable to generate MYRIO market intelligence.",
            radar: [],
          },
          {
            status: 500,
          }
        );
      }
    }

    // =========================================================================
    // INVALID ACTION
    // =========================================================================

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action.",
      },
      {
        status: 400,
      }
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
      {
        status: 500,
      }
    );
  }
}