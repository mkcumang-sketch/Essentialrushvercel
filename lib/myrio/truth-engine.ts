import connectDB from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { AbandonedCart } from "@/models/AbandonedCart";
import { AiIncident } from "@/models/AiIncident";
import { emitAiAuditLog } from "@/lib/ai-telemetry";

export interface TruthAnalysisReport {
  timestamp: string;
  mode: "FAIR_ANALYSIS_TRUTH_MODE";
  summaryVerdict: string;
  confidence: number;
  positives: string[];
  negatives: string[];
  risks: string[];
  opportunities: string[];
  evidence: Array<{
    claim: string;
    sourceType: "LIVE_DB" | "TELEMETRY" | "INFERENCE";
    supportingData: string;
  }>;
  uncertainties: string[];
  recommendedNextAction: string;
}

export async function generateTruthAnalysisReport(): Promise<TruthAnalysisReport> {
  await connectDB();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const [
    totalOrders,
    delayedOrders,
    failedPayments,
    outOfStockProducts,
    openIncidents,
    abandonedCartsCount,
  ] = await Promise.all([
    Order.find({ createdAt: { $gte: todayStart } }).lean(),
    Order.find({
      status: { $in: ["Processing", "Pending", "ORDER_CREATED", "PROCESSING"] },
      createdAt: { $lte: twoDaysAgo },
    }).lean(),
    Order.find({ paymentStatus: { $in: ["Failed", "FAILED"] } }).lean(),
    Product.find({ stock: 0, isActive: true }).lean(),
    AiIncident.find({ status: "OPEN" }).lean(),
    AbandonedCart.countDocuments({ status: "ABANDONED" }),
  ]);

  const positives: string[] = [];
  const negatives: string[] = [];
  const risks: string[] = [];
  const opportunities: string[] = [];
  const evidence: Array<{ claim: string; sourceType: "LIVE_DB" | "TELEMETRY" | "INFERENCE"; supportingData: string }> = [];
  const uncertainties: string[] = [];

  if (totalOrders.length > 0) {
    positives.push(`Storefront is actively converting visitors, with ${totalOrders.length} orders recorded during the current cycle.`);
    evidence.push({
      claim: "Active transaction throughput verified.",
      sourceType: "LIVE_DB",
      supportingData: `${totalOrders.length} orders found in database created since midnight.`,
    });
  } else {
    negatives.push("Zero orders recorded during the current cycle, indicating a potential traffic or conversion drop.");
  }

  if (openIncidents.length === 0) {
    positives.push("Zero open runtime incidents or React hydration crashes reported by client telemetry.");
  } else {
    negatives.push(`${openIncidents.length} backend/frontend system incidents are currently unaddressed.`);
    evidence.push({
      claim: "Active system exceptions present.",
      sourceType: "TELEMETRY",
      supportingData: openIncidents.map((i: any) => i.errorTitle).join("; "),
    });
  }

  if (delayedOrders.length > 0) {
    negatives.push(`${delayedOrders.length} active orders have exceeded the 48-hour fulfillment SLA.`);
    risks.push("High risk of customer dissatisfaction, payment chargeback disputes, and cart refund requests due to logistics delays.");
    evidence.push({
      claim: "Fulfillment SLA breach detected.",
      sourceType: "LIVE_DB",
      supportingData: `${delayedOrders.length} orders pending processing for over 48 hours.`,
    });
  } else {
    positives.push("All active orders are currently within standard fulfillment windows (<48h).");
  }

  if (outOfStockProducts.length > 0) {
    negatives.push(`${outOfStockProducts.length} high-intent products are completely out of stock.`);
    risks.push("Direct revenue leakage as organic search traffic lands on unfulfillable catalog items.");
  }

  if (failedPayments.length > 0) {
    negatives.push(`${failedPayments.length} payment transactions reported failure states.`);
    risks.push("Gateway dropouts or user friction during final checkout authorization.");
  }

  if (abandonedCartsCount > 5) {
    opportunities.push(`High recovery potential with ${abandonedCartsCount} abandoned carts waiting in the telemetry queue for concierge outreach.`);
  }
  opportunities.push("Catalog restructuring to feature high-stock alternative timepieces in place of out-of-stock items.");

  uncertainties.push("Visitor bounce rates and exact page-level drop-off analytics require deeper third-party telemetry integration.");
  uncertainties.push("Exact courier transit speed variation outside domestic metro hubs remains unquantified.");

  let confidence = 85;
  if (delayedOrders.length === 0 && outOfStockProducts.length === 0) {
    confidence = 92;
  } else if (openIncidents.length > 2) {
    confidence = 70;
  }

  const summaryVerdict = negatives.length > 2
    ? "Operations are experiencing notable bottlenecks in fulfillment and inventory availability that require immediate intervention."
    : "Platform core is stable, though specific logistics delays and inventory gaps require operational attention.";

  const recommendedNextAction = delayedOrders.length > 0
    ? "Assign courier tracking IDs to overdue orders immediately and review stock replenishment queues."
    : "Continue standard monitoring and evaluate cart abandonment outreach.";

  await emitAiAuditLog({
    agentName: "Executive Orchestrator",
    requestedOperation: "TRUTH_MODE_ANALYSIS",
    decision: `Generated neutral evaluation report. Confidence: ${confidence}%. Identified ${negatives.length} negatives and ${risks.length} risks.`,
    toolUsed: "Truth-Engine-Analyzer",
    permissionLevel: "READ",
    riskScore: risks.length > 0 ? 45 : 10,
    status: "SUCCESS",
    resultSummary: `Verdict: ${summaryVerdict}`,
  });

  return {
    timestamp: now.toISOString(),
    mode: "FAIR_ANALYSIS_TRUTH_MODE",
    summaryVerdict,
    confidence,
    positives,
    negatives,
    risks,
    opportunities,
    evidence,
    uncertainties,
    recommendedNextAction,
  };
}