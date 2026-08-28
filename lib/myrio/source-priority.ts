import connectDB from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { MyrioMemory } from "@/models/MyrioMemory";

export type OutputClassification = "FACT" | "INFERENCE" | "PREDICTION" | "UNKNOWN";

export interface ResolvedKnowledge {
  classification: OutputClassification;
  priorityLevel: 1 | 2 | 3 | 4 | 5;
  sourceOrigin: string;
  data: any;
  confidence: number;
  explanation: string;
}

/**
 * 🛡️ 5-TIER SOURCE PRIORITY RESOLVER
 * LEVEL 1: Live Authoritative Database
 * LEVEL 2: Current App Configuration
 * LEVEL 3: Approved Business Documentation / Policies
 * LEVEL 4: Historical Memory
 * LEVEL 5: AI Inference
 */
export async function resolveProductKnowledge(productIdOrSlug: string): Promise<ResolvedKnowledge> {
  await connectDB();

  // LEVEL 1: Live Authoritative Database Query
  const liveProduct = await Product.findOne({
    $or: [{ _id: productIdOrSlug }, { slug: productIdOrSlug }],
    isActive: true,
  }).lean();

  if (liveProduct) {
    return {
      classification: "FACT",
      priorityLevel: 1,
      sourceOrigin: "LIVE_DATABASE_RECORD",
      data: {
        id: liveProduct._id.toString(),
        name: liveProduct.name,
        brand: liveProduct.brand,
        price: liveProduct.offerPrice || liveProduct.price,
        stock: liveProduct.stock,
        specifications: liveProduct.amazonDetails || [],
      },
      confidence: 1.0,
      explanation: "Resolved directly from live database inventory state.",
    };
  }

  // LEVEL 3 & 4: Check Approved Knowledge / Memory
  const memoryRecord = await MyrioMemory.findOne({
    memoryKey: `product:${productIdOrSlug}`,
    isActive: true,
  }).lean();

  if (memoryRecord) {
    return {
      classification: memoryRecord.layer === "BUSINESS_KNOWLEDGE" ? "FACT" : "INFERENCE",
      priorityLevel: memoryRecord.layer === "BUSINESS_KNOWLEDGE" ? 3 : 4,
      sourceOrigin: `MYRIO_MEMORY_${memoryRecord.layer}`,
      data: {
        title: memoryRecord.title,
        insight: memoryRecord.derivedInsight,
        content: memoryRecord.content,
      },
      confidence: memoryRecord.confidenceScore,
      explanation: `Resolved from MYRIO ${memoryRecord.layer} memory tier.`,
    };
  }

  // Fallback: Insufficient verified data
  return {
    classification: "UNKNOWN",
    priorityLevel: 5,
    sourceOrigin: "INSUFFICIENT_DATA",
    data: null,
    confidence: 0.0,
    explanation: "No authoritative source found. Fallback triggered without hallucination.",
  };
}

export async function resolveOrderKnowledge(orderId: string, customerEmail?: string): Promise<ResolvedKnowledge> {
  await connectDB();

  const query: Record<string, any> = {
    $or: [{ orderId }, { _id: orderId }],
  };

  if (customerEmail) {
    query["customer.email"] = customerEmail.toLowerCase().trim();
  }

  const liveOrder = await Order.findOne(query).lean();

  if (liveOrder) {
    return {
      classification: "FACT",
      priorityLevel: 1,
      sourceOrigin: "LIVE_ORDER_RECORD",
      data: {
        orderId: liveOrder.orderId,
        status: liveOrder.status,
        totalAmount: liveOrder.totalAmount,
        trackingNumber: liveOrder.trackingId || (liveOrder as any).trackingNumber,
        courier: (liveOrder as any).courier || "Assigned Vault Courier",
        itemsCount: (liveOrder.items || []).length,
        createdAt: liveOrder.createdAt,
      },
      confidence: 1.0,
      explanation: "Authenticated order dossier retrieved from live database.",
    };
  }

  return {
    classification: "UNKNOWN",
    priorityLevel: 5,
    sourceOrigin: "ORDER_NOT_FOUND_OR_UNAUTHORIZED",
    data: null,
    confidence: 0.0,
    explanation: "Order could not be verified under the given customer credentials.",
  };
}