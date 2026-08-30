export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Product } from "@/models/Product";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    await connectDB();
    const ProductModel = Product as mongoose.Model<any>;
    const products = await ProductModel.find({ isActive: true }).select("slug updatedAt _id").lean();

    const host = req.headers.get("host") || "essentialrush.com";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    const staticPages = ["", "/shop", "/account", "/checkout"];
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${page}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>${page === "" ? "1.0" : "0.8"}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic Product pages
    for (const prod of products) {
      const identifier = (prod as any).slug || (prod as any)._id?.toString();
      if (!identifier) continue;
      const lastMod = (prod as any).updatedAt ? new Date((prod as any).updatedAt).toISOString() : new Date().toISOString();
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/product/${identifier}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("Sitemap Generation Error:", err);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}