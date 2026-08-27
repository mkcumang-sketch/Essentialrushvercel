// Sabse upar line 1 par ye chipka de
export const dynamic = "force-dynamic";

// Baaki tera code jaisa hai waisa hi rahega...
import { MetadataRoute } from 'next';
import mongoose from 'mongoose';

// 💡 Direct Model Definition (No import needed)
const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://essentialrush.com';

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }

  // Fetch all active, indexable products
  const products = await Product.find({ 'seo.noindex': { $ne: true } }).select('slug _id updatedAt').lean();

  // 💡 Fixed the 'any' type error here
  const productUrls = products.map((product: any) => ({
    url: `${baseUrl}/product/${product.slug || product._id}`,
    lastModified: product.updatedAt || new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const staticUrls = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
  ];

  return [...staticUrls, ...productUrls];
}