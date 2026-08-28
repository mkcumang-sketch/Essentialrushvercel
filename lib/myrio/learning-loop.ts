import connectDB from "@/lib/mongodb";
import { MyrioLearningEvent } from "@/models/MyrioLearningEvent";
import { MyrioMemory } from "@/models/MyrioMemory";
import { Order } from "@/models/Order";
import { emitAiAuditLog } from "@/lib/ai-telemetry";

export interface LearningCenterMetrics {
  totalPredictionsRecorded: number;
  totalEvaluated: number;
  accuratePredictions: number;
  accuracyRate: number; // 0 - 100%
  falsePositives: number;
  falseNegatives: number;
  confidenceDistribution: {
    high: number;   // > 0.8
    medium: number; // 0.5 - 0.8
    low: number;    // < 0.5
  };
  domainBreakdown: Record<string, { total: number; accurate: number; accuracyRate: number }>;
  recentLearnings: Array<{
    id: string;
    domain: string;
    predicted: string;
    actual: string;
    isAccurate: boolean;
    confidence: number;
    signals: string[];
    date: string;
  }>;
}

/**
 * 🎯 1. Record a new prediction
 */
export async function recordMyrioPrediction(input: {
  targetDomain: "ORDER_DELAY" | "STOCKOUT_RISK" | "PAYMENT_FRAUD" | "CART_ABANDONMENT";
  entityId: string;
  predictedValue: string;
  predictionConfidence: number;
  evidenceSignals: string[];
}) {
  await connectDB();
  const predictionId = `PRED-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  const event = await MyrioLearningEvent.create({
    predictionId,
    targetDomain: input.targetDomain,
    entityId: input.entityId,
    predictedValue: input.predictedValue,
    predictionConfidence: Math.min(1, Math.max(0, input.predictionConfidence)),
    evidenceSignals: input.evidenceSignals,
    actualOutcome: null,
    isAccurate: null,
    evaluationTimestamp: null,
  });

  return event;
}

/**
 * 🔄 2. Continuous Outcome Evaluation Loop
 * Evaluates pending prediction events against real-world database states.
 */
export async function evaluatePendingOutcomes(): Promise<{ evaluatedCount: number; newLearningsDerived: number }> {
  await connectDB();

  const unevaluatedEvents = await MyrioLearningEvent.find({ isAccurate: null }).limit(100);
  let evaluatedCount = 0;
  let newLearningsDerived = 0;

  for (const event of unevaluatedEvents) {
    if (event.targetDomain === "ORDER_DELAY") {
      const order = await Order.findOne({
        $or: [{ orderId: event.entityId }, { _id: event.entityId }],
      }).lean();

      if (order && ["DELIVERED", "Delivered", "CANCELLED", "Cancelled"].includes(order.status)) {
        const orderCreated = new Date(order.createdAt).getTime();
        const orderCompleted = new Date(order.updatedAt || Date.now()).getTime();
        const actualHours = (orderCompleted - orderCreated) / (1000 * 60 * 60);

        const wasActuallyDelayed = actualHours > 48;
        const predictedDelay = event.predictedValue.toUpperCase().includes("DELAY");

        event.actualOutcome = wasActuallyDelayed ? "DELAYED_IN_FULFILLMENT" : "DELIVERED_ON_TIME";
        event.isAccurate = predictedDelay === wasActuallyDelayed;
        event.evaluationTimestamp = new Date();
        event.learningAdjustmentNotes = `Order completed in ${Math.round(actualHours)} hours. Evaluation outcome validated.`;
        await event.save();
        evaluatedCount++;

        // 🧠 Derive Memory Pattern if high-confidence prediction failed
        if (!event.isAccurate && event.predictionConfidence > 0.8) {
          const memoryKey = `learning:pattern:order_delay_eval_${event.entityId}`;
          await MyrioMemory.findOneAndUpdate(
            { memoryKey },
            {
              $set: {
                memoryKey,
                layer: "LEARNING",
                category: "ORDER",
                title: `Prediction Calibration: Order ${event.entityId}`,
                content: `High confidence delay prediction failed. SLA completed in ${Math.round(actualHours)}h.`,
                derivedInsight: "Fulfillment routing for this category is faster than historical baseline.",
                source: "EVALUATION_LOOP",
                confidenceScore: 0.85,
                importanceScore: 6,
                accessPermission: "SUPER_ADMIN",
                isActive: true,
              },
            },
            { upsert: true, new: true }
          );
          newLearningsDerived++;
        }
      }
    }
  }

  if (evaluatedCount > 0) {
    await emitAiAuditLog({
      agentName: "Learning Orchestrator",
      requestedOperation: "OUTCOME_EVALUATION_CYCLE",
      decision: `Evaluated ${evaluatedCount} historical predictions. Derived ${newLearningsDerived} memory adjustments.`,
      toolUsed: "Outcome-Evaluator-Engine",
      permissionLevel: "AUTO",
      riskScore: 0,
      status: "SUCCESS",
      resultSummary: `Evaluated: ${evaluatedCount}, New Insights: ${newLearningsDerived}`,
    });
  }

  return { evaluatedCount, newLearningsDerived };
}

/**
 * 📊 3. Calculate Learning Center Telemetry
 */
export async function computeLearningMetrics(): Promise<LearningCenterMetrics> {
  await connectDB();

  const [allEvents, memoryCount] = await Promise.all([
    MyrioLearningEvent.find({}).sort({ createdAt: -1 }).limit(200).lean(),
    MyrioMemory.countDocuments({ layer: "LEARNING", isActive: true }),
  ]);

  const totalPredictionsRecorded = allEvents.length;
  const evaluatedEvents = allEvents.filter((e) => e.isAccurate !== null);
  const accuratePredictions = evaluatedEvents.filter((e) => e.isAccurate === true).length;
  const falsePositives = evaluatedEvents.filter((e) => e.isAccurate === false && e.predictionConfidence >= 0.7).length;
  const falseNegatives = evaluatedEvents.filter((e) => e.isAccurate === false && e.predictionConfidence < 0.5).length;

  const totalEvaluated = evaluatedEvents.length;
  const accuracyRate = totalEvaluated > 0 ? Math.round((accuratePredictions / totalEvaluated) * 100) : 0;

  // Confidence distribution
  const highConf = allEvents.filter((e) => e.predictionConfidence >= 0.8).length;
  const medConf = allEvents.filter((e) => e.predictionConfidence >= 0.5 && e.predictionConfidence < 0.8).length;
  const lowConf = allEvents.filter((e) => e.predictionConfidence < 0.5).length;

  // Domain breakdown
  const domainMap: Record<string, { total: number; accurate: number; accuracyRate: number }> = {};
  for (const ev of evaluatedEvents) {
    if (!domainMap[ev.targetDomain]) {
      domainMap[ev.targetDomain] = { total: 0, accurate: 0, accuracyRate: 0 };
    }
    domainMap[ev.targetDomain].total++;
    if (ev.isAccurate) domainMap[ev.targetDomain].accurate++;
  }

  for (const d of Object.keys(domainMap)) {
    domainMap[d].accuracyRate = Math.round((domainMap[d].accurate / domainMap[d].total) * 100);
  }

  return {
    totalPredictionsRecorded,
    totalEvaluated,
    accuratePredictions,
    accuracyRate,
    falsePositives,
    falseNegatives,
    confidenceDistribution: {
      high: highConf,
      medium: medConf,
      low: lowConf,
    },
    domainBreakdown: domainMap,
    recentLearnings: evaluatedEvents.slice(0, 10).map((e) => ({
      id: e.predictionId,
      domain: e.targetDomain,
      predicted: e.predictedValue,
      actual: e.actualOutcome || "Pending Evaluation",
      isAccurate: Boolean(e.isAccurate),
      confidence: Math.round(e.predictionConfidence * 100),
      signals: e.evidenceSignals,
      date: new Date(e.createdAt).toLocaleDateString("en-IN"),
    })),
  };
}