export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { generateMyrioSeoMetadata } from "@/lib/myrio/agents";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    const ProductModel = Product as mongoose.Model<any>;

    // Fetch all active products
    const products = await ProductModel.find({ isActive: true });
    let updatedCount = 0;

    for (const prod of products) {
      const title = prod.name || prod.title || "Luxury Timepiece";
      const brand = prod.brand || "Essential Rush";
      const desc = prod.description || "";

      // Generate via MYRIO SEO Agent
      const seoData = await generateMyrioSeoMetadata(title, prod.category, desc);

      const existingSeo = prod.seo || {};
      const updatedSeo = {
        ...existingSeo,
        metaTitle: existingSeo.metaTitle || seoData.metaTitle,
        metaDescription: existingSeo.metaDescription || seoData.metaDescription,
        focusKeyword: existingSeo.focusKeyword || seoData.keywords?.split(",")[0] || `${brand} watch`,
        slug: prod.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
      };

      // Generate Image Alt texts if missing
      const imageAltTexts: Record<string, string> = existingSeo.imageAltTexts || {};
      if (prod.imageUrl && !imageAltTexts[prod.imageUrl]) {
        imageAltTexts[prod.imageUrl] = `${brand} ${title} authentic luxury watch dial close-up`;
      }
      if (Array.isArray(prod.images)) {
        prod.images.forEach((imgUrl: string, idx: number) => {
          if (imgUrl && !imageAltTexts[imgUrl]) {
            imageAltTexts[imgUrl] = `${brand} ${title} luxury timepiece angle view ${idx + 1}`;
          }
        });
      }
      updatedSeo.imageAltTexts = imageAltTexts;

      await ProductModel.findByIdAndUpdate(prod._id, {
        $set: { seo: updatedSeo, updatedAt: new Date() },
      });

      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      count: updatedCount,
      message: `MYRIO SEO Agent successfully synthesized metadata for ${updatedCount} products.`,
    });
  } catch (error: any) {
    console.error("SEO Synthesize All Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}