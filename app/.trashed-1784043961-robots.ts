import { MetadataRoute } from 'next';
import mongoose from 'mongoose';

// 💡 Direct Model Definition (No import needed)
const GlobalSeo = mongoose.models.GlobalSeo || mongoose.model('GlobalSeo', new mongoose.Schema({}, { strict: false }));

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://essentialrush.com';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/godmode/', '/account/', '/api/'], // Protects admin and account pages from Google
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}