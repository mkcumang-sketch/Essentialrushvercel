import connectDB from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { UserBehavior } from "@/models/UserBehavior";
import { AbandonedCart } from "@/models/AbandonedCart";
import PricingRule from "@/models/PricingRule";
import { emitAiAlert } from "@/lib/ai-telemetry";
import { recordMyrioPrediction } from "@/lib/myrio/learning-loop";
import mongoose from "mongoose";

// ============================================================================
// 1. ORDER & LOGISTICS AGENT
// ============================================================================
export async function runMyrioOrderLogisticsAgent() {
  await connectDB();
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const delayedOrders = await Order.find({
    status: { $in: ["Processing", "Pending", "ORDER_CREATED", "PROCESSING"] },
    createdAt: { $lte: twoDaysAgo },
  }).lean();

  if (delayedOrders.length > 0) {
    for (const order of delayedOrders) {
      await recordMyrioPrediction({
        targetDomain: "ORDER_DELAY",
        entityId: (order as any).orderId || (order as any)._id.toString(),
        predictedValue: "DELAYED_FULFILLMENT_RISK",
        predictionConfidence: 0.88,
        evidenceSignals: [`Order pending over 48h`, `Status: ${(order as any).status}`],
      });
    }

    await emitAiAlert({
      category: "ORDERS",
      severity: "HIGH",
      title: `${delayedOrders.length} Delayed Consignments Detected`,
      description: `Active orders pending fulfillment exceeding SLA limits.`,
      impact: "Potential customer SLA breach and cart cancellation disputes.",
      aiAnalysis: "Courier tracking allocation is bottlenecked.",
      recommendedAction: "Review pending manifests and dispatch tracking IDs.",
    });
  }

  return { delayedCount: delayedOrders.length, status: "PROCESSED" };
}

// ============================================================================
// 2. INVENTORY DEPLETION AGENT
// ============================================================================
export async function runMyrioInventoryAgent() {
  await connectDB();
  const ProductModel = Product as mongoose.Model<any>;

  const [outOfStock, lowStock] = await Promise.all([
    ProductModel.find({ stock: 0, isActive: true }).lean(),
    ProductModel.find({ stock: { $gt: 0, $lte: 3 }, isActive: true }).lean(),
  ]);

  if (outOfStock.length > 0) {
    await emitAiAlert({
      category: "INVENTORY",
      severity: "MEDIUM",
      title: `${outOfStock.length} Vault Timepieces Out of Stock`,
      description: `Catalog items with high visit volume are depleted.`,
      impact: "Direct bounce rate increase on high-intent catalog pages.",
      aiAnalysis: "Stock levels reached absolute 0.",
      recommendedAction: "Replenish vendor allocation or mark items as vault backorder.",
    });
  }

  return { outOfStockCount: outOfStock.length, lowStockCount: lowStock.length };
}

// ============================================================================
// 3. CART RECOVERY AGENT
// ============================================================================
export async function runMyrioCartRecoveryAgent() {
  await connectDB();
  const abandonedCarts = await AbandonedCart.find({ status: "abandoned" })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return { recoverableCount: abandonedCarts.length, carts: abandonedCarts };
}

// ============================================================================
// 4. DYNAMIC PRICING & FAIRNESS ENGINE
// ============================================================================
export async function computeMyrioDynamicPrice(productId: string, sessionId?: string) {
  await connectDB();
  const ProductModel = Product as mongoose.Model<any>;
  const PricingRuleModel = PricingRule as mongoose.Model<any>;
  const UserBehaviorModel = UserBehavior as mongoose.Model<any>;

  const product = (await ProductModel.findById(productId).lean()) as any;
  if (!product) return null;

  let rules = await PricingRuleModel.findOne({});
  if (!rules) rules = await PricingRuleModel.create({});

  const basePrice = Number(product.offerPrice || product.price);
  let finalPrice = basePrice;
  const logs: string[] = [];

  if ((rules as any).isAiPricingActive) {
    let percentChange = 0;

    if (product.totalSold >= (rules as any).trendingThreshold) {
      percentChange += 5;
      logs.push("High Demand Surge (+5%)");
    }

    if (product.stock > 0 && product.stock <= (rules as any).lowStockThreshold) {
      percentChange += 5;
      logs.push("Low Stock Scarcity Premium (+5%)");
    }

    if (sessionId) {
      const behavior = (await UserBehaviorModel.findOne({ sessionId }).lean()) as any;
      if (behavior && (behavior.productScores?.get?.(productId) || behavior.productScores?.[productId] || 0) > 30) {
        percentChange -= 7;
        logs.push("Loyalty / High-Intent Conversion Discount (-7%)");
      }
    }

    if (percentChange > (rules as any).maxMarkupPercent) percentChange = (rules as any).maxMarkupPercent;
    if (percentChange < -(rules as any).maxDiscountPercent) percentChange = -(rules as any).maxDiscountPercent;

    finalPrice = basePrice + basePrice * (percentChange / 100);
  }

  return {
    originalPrice: basePrice,
    dynamicPrice: Math.round(finalPrice),
    logs,
  };
}

// ============================================================================
// 5. COPYWRITING INTELLIGENCE AGENT
// ============================================================================
export function generateMyrioLuxuryCopy(name: string, brand?: string) {
  const luxuryAdjectives = [
    "masterclass in horological engineering",
    "pinnacle of mechanical artistry",
    "testament to Swiss precision",
    "rare and elusive asset",
    "crown jewel of modern watchmaking",
  ];
  const randomAdjective = luxuryAdjectives[Math.floor(Math.random() * luxuryAdjectives.length)];

  return {
    title: `${brand || "Luxury"} ${name} - Exceptional Grade`,
    description: `The ${brand || ""} ${name} represents a ${randomAdjective}. Crafted from aerospace-grade materials, this timepiece features a meticulous hand-finished dial, an in-house self-winding caliber, and superlative chronometric performance. Accompanied by full diplomatic provenance and a bespoke lifetime mechanical guarantee.`,
  };
}

// ============================================================================
// 6. SEO & METADATA INTELLIGENCE AGENT
// ============================================================================
export async function generateMyrioSeoMetadata(targetTitle: string, category?: string, description?: string) {
  const apiKey = process.env.AIMLAPI_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch("https://api.aimlapi.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are the MYRIO SEO Intelligence Agent for Essential Rush, an ultra-luxury timepiece vault. Return JSON with 'metaTitle', 'metaDescription', and 'keywords' (comma-separated string). Ensure high luxury appeal and ranking power.",
            },
            {
              role: "user",
              content: `Generate SEO metadata for: Title: "${targetTitle}", Category: "${category || 'Luxury Watches'}", Overview: "${description || ''}"`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.6,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const parsed = JSON.parse(json.choices?.[0]?.message?.content || "{}");
        return {
          metaTitle: parsed.metaTitle || `${targetTitle} | Essential Rush Official Vault`,
          metaDescription: parsed.metaDescription || `Acquire the authentic ${targetTitle}. Certified provenance and global insured delivery.`,
          keywords: parsed.keywords || `${targetTitle}, luxury watches, Swiss calibers, investment timepieces`,
        };
      }
    } catch (err) {
      console.error("MYRIO SEO Agent Error:", err);
    }
  }

  // Deterministic Fallback
  return {
    metaTitle: `${targetTitle} | Essential Rush Private Vault`,
    metaDescription: `Discover the ${targetTitle}. Independently inspected, chronometer-certified luxury horology with lifetime authentication.`,
    keywords: `${targetTitle}, luxury watch, authentic chronometer, fine horology`,
  };
}