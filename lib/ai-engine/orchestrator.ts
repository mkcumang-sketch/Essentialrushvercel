import connectDB from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { AiAlert } from "@/models/AiAlert";
import { AiIncident } from "@/models/AiIncident";
import { AbandonedCart } from "@/models/AbandonedCart";
import { emitAiAuditLog } from "@/lib/ai-telemetry";

export interface SystemAuditReport {
  timestamp: string;
  systemHealthScore: number; // 0 - 100
  securityThreatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  metrics: {
    totalOrdersToday: number;
    pendingOrdersCount: number;
    delayedOrdersCount: number;
    failedPaymentsCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    activeIncidentsCount: number;
    unresolvedAlertsCount: number;
    cartAbandonmentRate: number;
  };
  highPriorityIssues: Array<{
    id: string;
    category: string;
    severity: string;
    title: string;
    possibleCause: string;
    impact: string;
    recommendedFix: string;
    actionRequired: "AUTO_SAFE" | "HUMAN_APPROVAL";
  }>;
}

export async function runFullSystemAudit(): Promise<SystemAuditReport> {
  await connectDB();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // Parallel Telemetry Aggregation
  const [
    todayOrders,
    delayedOrders,
    failedPayments,
    lowStockProducts,
    outOfStockProducts,
    activeIncidents,
    unresolvedAlerts,
    abandonedCartsCount,
  ] = await Promise.all([
    Order.find({ createdAt: { $gte: todayStart } }).lean(),
    Order.find({
      status: { $in: ["Processing", "Pending", "ORDER_CREATED", "PROCESSING"] },
      createdAt: { $lte: twoDaysAgo },
    }).lean(),
    Order.find({ paymentStatus: { $in: ["Failed", "FAILED"] } }).lean(),
    Product.find({ stock: { $gt: 0, $lte: 3 }, isActive: true }).lean(),
    Product.find({ stock: 0, isActive: true }).lean(),
    AiIncident.find({ status: { $in: ["OPEN", "INVESTIGATING"] } }).sort({ lastSeenAt: -1 }).lean(),
    AiAlert.find({ isResolved: false }).sort({ severity: -1, createdAt: -1 }).lean(),
    AbandonedCart.countDocuments({ status: "ABANDONED" }),
  ]);

  const totalOrdersCount = todayOrders.length;
  const pendingOrdersCount = todayOrders.filter(
    (o) => o.status === "Pending" || o.status === "ORDER_CREATED"
  ).length;

  // Calculate Health Score (100 Base)
  let healthDeductions = 0;
  if (activeIncidents.some((i) => i.severity === "P0")) healthDeductions += 40;
  if (activeIncidents.some((i) => i.severity === "P1")) healthDeductions += 20;
  healthDeductions += Math.min(20, delayedOrders.length * 5);
  healthDeductions += Math.min(15, outOfStockProducts.length * 3);
  healthDeductions += Math.min(15, failedPayments.length * 5);

  const systemHealthScore = Math.max(0, 100 - healthDeductions);

  // Determine Threat Level
  let securityThreatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  const securityAlerts = unresolvedAlerts.filter((a) => a.category === "SECURITY");
  if (securityAlerts.some((a) => a.severity === "CRITICAL")) securityThreatLevel = "CRITICAL";
  else if (securityAlerts.some((a) => a.severity === "HIGH")) securityThreatLevel = "HIGH";
  else if (securityAlerts.length > 2) securityThreatLevel = "MEDIUM";

  // Build High-Priority Diagnostic Issues
  const highPriorityIssues: SystemAuditReport["highPriorityIssues"] = [];

  // 1. Check Delayed Orders
  if (delayedOrders.length > 0) {
    highPriorityIssues.push({
      id: "ISSUE-ORD-DELAY",
      category: "ORDERS",
      severity: "HIGH",
      title: `${delayedOrders.length} orders pending dispatch for over 48 hours`,
      possibleCause: "Fulfillment bottleneck or courier assignment delay.",
      impact: "Risk of customer cancellation and refund escalations.",
      recommendedFix: "Assign express courier tracking IDs or notify buyers of timeline update.",
      actionRequired: "HUMAN_APPROVAL",
    });
  }

  // 2. Check Stock Depletion
  if (outOfStockProducts.length > 0) {
    highPriorityIssues.push({
      id: "ISSUE-INV-OOS",
      category: "INVENTORY",
      severity: "MEDIUM",
      title: `${outOfStockProducts.length} active timepieces are completely out of stock`,
      possibleCause: "Inventory not replenished following vault sales.",
      impact: "Direct storefront revenue loss on organic search visits.",
      recommendedFix: "Restock items or toggle catalog status to unlisted.",
      actionRequired: "HUMAN_APPROVAL",
    });
  }

  // 3. Active Incident Transcripts
  for (const inc of activeIncidents.slice(0, 3)) {
    highPriorityIssues.push({
      id: inc.incidentId,
      category: "SYSTEM",
      severity: inc.severity === "P0" ? "CRITICAL" : inc.severity === "P1" ? "HIGH" : "MEDIUM",
      title: `${inc.service}: ${inc.errorTitle} (${inc.frequency}x)`,
      possibleCause: inc.possibleCause,
      impact: inc.impact,
      recommendedFix: inc.recommendedFix,
      actionRequired: "HUMAN_APPROVAL",
    });
  }

  // Audit Log the Diagnostic Execution
  await emitAiAuditLog({
    agentName: "Executive Orchestrator",
    requestedOperation: "SYSTEM_HEALTH_AUDIT",
    decision: `Computed system score of ${systemHealthScore}/100 with ${highPriorityIssues.length} priority items.`,
    toolUsed: "Full-Telemetry-Scan",
    permissionLevel: "READ",
    executedBy: "AI_ORCHESTRATOR",
    riskScore: 0,
    status: "SUCCESS",
    resultSummary: `Health: ${systemHealthScore}%, Issues: ${highPriorityIssues.length}`,
  });

  return {
    timestamp: now.toISOString(),
    systemHealthScore,
    securityThreatLevel,
    metrics: {
      totalOrdersToday: totalOrdersCount,
      pendingOrdersCount,
      delayedOrdersCount: delayedOrders.length,
      failedPaymentsCount: failedPayments.length,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      activeIncidentsCount: activeIncidents.length,
      unresolvedAlertsCount: unresolvedAlerts.length,
      cartAbandonmentRate: totalOrdersCount + abandonedCartsCount > 0
        ? Math.round((abandonedCartsCount / (totalOrdersCount + abandonedCartsCount)) * 100)
        : 0,
    },
    highPriorityIssues,
  };
}

export async function processAiAssistantQuery(query: string): Promise<string> {
  await connectDB();
  const clean = query.trim().toLowerCase();

  if (clean.includes("delayed") || clean.includes("shipping")) {
    const delayed = await Order.find({
      status: { $in: ["Processing", "Pending", "ORDER_CREATED", "PROCESSING"] },
      createdAt: { $lte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    }).lean();

    if (delayed.length === 0) {
      return "✅ No delayed orders found. All active orders are within normal fulfillment windows.";
    }
    return `⚠️ Found ${delayed.length} delayed orders exceeding 48h:\n` +
      delayed.map((o) => `• ${o.orderId} (${o.customer.name}) - Total: ₹${o.totalAmount.toLocaleString("en-IN")}`).join("\n");
  }

  if (clean.includes("stock") || clean.includes("inventory")) {
    const oos = await Product.find({ stock: 0, isActive: true }).select("name brand").lean();
    const low = await Product.find({ stock: { $gt: 0, $lte: 3 }, isActive: true }).select("name brand stock").lean();

    return `📦 Inventory Status:\n• Out of Stock (${oos.length}): ${oos.map((p) => p.name).join(", ") || "None"}\n• Low Stock (${low.length}): ${low.map((p) => `${p.name} (${p.stock} left)`).join(", ") || "None"}`;
  }

  if (clean.includes("security") || clean.includes("threat")) {
    const secAlerts = await AiAlert.find({ category: "SECURITY", isResolved: false }).sort({ createdAt: -1 }).limit(5).lean();
    if (secAlerts.length === 0) {
      return "🛡️ Security Threat Level: LOW. No active malicious login attempts or rate-limit violations detected.";
    }
    return `🚨 Active Security Alerts (${secAlerts.length}):\n` +
      secAlerts.map((a) => `• [${a.severity}] ${a.title} - ${a.description}`).join("\n");
  }

  if (clean.includes("error") || clean.includes("incident") || clean.includes("wrong")) {
    const incidents = await AiIncident.find({ status: "OPEN" }).sort({ frequency: -1 }).limit(5).lean();
    if (incidents.length === 0) {
      return "✅ All backend services, payment webhooks, and database pipelines are operating normally. Zero open incidents.";
    }
    return `⚠️ Open Incidents Detected (${incidents.length}):\n` +
      incidents.map((i) => `• ${i.service} (${i.severity}): ${i.errorTitle} (Count: ${i.frequency}x)\n  Fix: ${i.recommendedFix}`).join("\n\n");
  }

  const audit = await runFullSystemAudit();
  return `📊 System Operations Summary:\n• Health Score: ${audit.systemHealthScore}/100\n• Threat Level: ${audit.securityThreatLevel}\n• Today's Orders: ${audit.metrics.totalOrdersToday}\n• Delayed Orders: ${audit.metrics.delayedOrdersCount}\n• Low Stock Items: ${audit.metrics.lowStockCount}\n• Open Incidents: ${audit.metrics.activeIncidentsCount}`;
}