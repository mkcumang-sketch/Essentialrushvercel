export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { Product } from "@/models/Product";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(role)) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    const ProductModel = Product as mongoose.Model<any>;
    const products = await ProductModel.find({});

    let updatedCount = 0;
    for (const prod of products) {
      const name = prod.name || prod.title || "Timepiece";
      const brand = prod.brand || "Essential Rush";
      const cleanSlug = prod.slug || `${brand}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

      const seoPayload = {
        metaTitle: prod.seo?.metaTitle || `${brand} ${name} | Essential Rush Official Vault`,
        metaDescription: prod.seo?.metaDescription || `Acquire the authentic ${brand} ${name}. Chronometer-certified, diplomatic provenance verification with global insured dispatch.`,
        focusKeyword: prod.seo?.focusKeyword || `${brand} ${name}`,
        slug: cleanSlug,
        imageAltTexts: {
          ...(prod.seo?.imageAltTexts || {}),
          ...(prod.imageUrl ? { [prod.imageUrl]: `${brand} ${name} Luxury Watch Dial View` } : {}),
        },
      };

      await ProductModel.findByIdAndUpdate(prod._id, {
        $set: { seo: seoPayload, slug: cleanSlug, updatedAt: new Date() },
      });

      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      count: updatedCount,
      message: `MYRIO SEO Agent automatically synthesized metadata and ALT tags for ${updatedCount} products.`,
    });
  } catch (error: any) {
    console.error("SEO Synthesize All Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}