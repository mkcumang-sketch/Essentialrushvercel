export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose'; // 🚀 FIX: mongoose import kiya
import connectDB from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { UserBehavior } from '@/models/UserBehavior';
import PricingRule from '@/models/PricingRule';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const sessionId = searchParams.get('sessionId');

    // 🚀 THE ULTIMATE FIX: Teeno models ko strictly cast kiya TS2349 errors hatane ke liye
    const ProductModel = Product as mongoose.Model<any>;
    const PricingRuleModel = PricingRule as mongoose.Model<any>;
    const UserBehaviorModel = UserBehavior as mongoose.Model<any>;

    const product = await ProductModel.findById(productId);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Fetch Global Rules
    let rules = await PricingRuleModel.findOne({});
    if (!rules) rules = await PricingRuleModel.create({});

    let finalPrice = Number(product.offerPrice || product.price);
    const basePrice = finalPrice;
    let adjustmentLog: string[] = []; // 🚀 FIX: Strongly typed array

    if (rules.isAiPricingActive) {
      let percentChange = 0;

      // 1. Demand Based (High Sales = Surge Price)
      if (product.totalSold >= rules.trendingThreshold) {
        percentChange += 5; 
        adjustmentLog.push("High Demand Surge (+5%)");
      }

      // 2. Stock Based (Scarcity = Surge Price)
      if (product.stock > 0 && product.stock <= rules.lowStockThreshold) {
        percentChange += 5;
        adjustmentLog.push("Low Stock Premium (+5%)");
      }

      // 3. User Behavior Based (High Interest = Discount to convert)
      if (sessionId) {
        const behavior = await UserBehaviorModel.findOne({ sessionId });
        if (behavior) {
          const userScore = behavior.productScores?.get(productId) || 0; // Added optional chaining
          if (userScore > 30) { // User has viewed multiple times or ATC
            percentChange -= 7;
            adjustmentLog.push("Loyalty/Conversion Discount (-7%)");
          }
        }
      }

      // 4. Enforce Fairness Rules (Cap limits)
      if (percentChange > rules.maxMarkupPercent) percentChange = rules.maxMarkupPercent;
      if (percentChange < -rules.maxDiscountPercent) percentChange = -rules.maxDiscountPercent;

      // Calculate Final Price
      finalPrice = basePrice + (basePrice * (percentChange / 100));
    }

    return NextResponse.json({ 
      success: true, 
      originalPrice: basePrice,
      dynamicPrice: Math.round(finalPrice), 
      logs: adjustmentLog 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}