export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose'; // 🚀 FIX: mongoose ko import kiya
import connectDB from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { UserBehavior } from '@/models/UserBehavior';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    // 🚀 THE FIX: Models ko strongly cast kiya taaki ts(2349) error na aaye
    const ProductModel = Product as mongoose.Model<any>;
    const UserBehaviorModel = UserBehavior as mongoose.Model<any>;

    const allProducts = await ProductModel.find({}).lean();
    let recommended = [...allProducts];
    let recentlyViewed: any[] = [];
    let trending = [...allProducts].sort((a: any, b: any) => (b.totalSold || 0) - (a.totalSold || 0)).slice(0, 4);

    if (sessionId) {
      // 🚨 TS Fix: Cast to 'any' to bypass strict Map indexing errors safely
      const behavior = await UserBehaviorModel.findOne({ sessionId }).populate('recentlyViewed').lean() as any;
      
      if (behavior) {
        recentlyViewed = behavior.recentlyViewed || [];

        const productScores: Record<string, number> = behavior.productScores || {};
        const categoryScores: Record<string, number> = behavior.categoryScores || {};

        // Sort Recommended based on User's Category Affinity & Product Scores safely
        recommended.sort((a: any, b: any) => {
          const scoreA = (productScores[a._id.toString()] || 0) + (categoryScores[a.category || ''] || 0);
          const scoreB = (productScores[b._id.toString()] || 0) + (categoryScores[b.category || ''] || 0);
          return scoreB - scoreA;
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      recommended: recommended.slice(0, 8), 
      recentlyViewed: recentlyViewed.slice(0, 4),
      trending 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}