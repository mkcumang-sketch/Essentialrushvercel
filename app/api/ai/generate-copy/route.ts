export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { name, brand, category } = body;

    if (!name || !brand) {
      return NextResponse.json({ success: false, error: "Name and Brand are required" }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      const prompt = `You are the master horologist and luxury copywriter for "Essential Rush".
Generate an ultra-luxury product profile for the following timepiece:
Timepiece Name: ${name}
Brand: ${brand}
Category: ${category || "Investment Grade"}

Output strictly valid JSON with the exact structure:
{
  "description": "2-3 paragraphs of evocative, authoritative luxury description highlighting hand-finishing, chronometric accuracy, materials, and diplomatic provenance.",
  "badge": "Masterpiece",
  "specifications": [
    { "key": "Movement", "value": "Self-Winding Automatic Calibre" },
    { "key": "Case Material", "value": "Aerospace-Grade 904L Steel / Precious Metal" },
    { "key": "Dial", "value": "Hand-Guilloché with Luminescent Markers" },
    { "key": "Water Resistance", "value": "100m / 10 ATM" },
    { "key": "Power Reserve", "value": "72 Hours" }
  ],
  "metaTitle": "${brand} ${name} | Essential Rush Official Vault",
  "metaDescription": "Acquire the certified authentic ${brand} ${name}. Chronometer-tested provenance verification with insured global delivery."
}`;

      const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You generate luxury watch product metadata strictly formatted as JSON." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.6,
        }),
      });

      if (aiRes.ok) {
        const json = await aiRes.json();
        const parsed = JSON.parse(json.choices?.[0]?.message?.content || "{}");
        return NextResponse.json({ success: true, data: parsed });
      }
    }

    // Fallback if AI Key is missing
    return NextResponse.json({
      success: true,
      data: {
        description: `The ${brand} ${name} stands as an uncompromising testament to haute horlogerie. Engineered with meticulous precision, this timepiece houses a superlative mechanical caliber within a hand-finished case, accompanied by diplomatic provenance and lifetime verification.`,
        badge: "Investment Grade",
        specifications: [
          { key: "Movement", value: "Automatic Calibre" },
          { key: "Case Material", value: "Sapphire & 904L Alloy" },
          { key: "Dial", value: "Custom Finished" },
          { key: "Provenance", value: "Independently Verified" },
        ],
        metaTitle: `${brand} ${name} | Essential Rush`,
        metaDescription: `Discover the ${brand} ${name}. Certified chronometer luxury timepiece with insured global dispatch.`,
      },
    });
  } catch (error: any) {
    console.error("AI Copy Generation Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}