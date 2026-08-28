export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { Product } from "@/models/Product";
import { handleError } from "@/lib/error-handler";
import { sanitizeString } from "@/lib/sanitize";
import { emitAiAlert, emitAiAuditLog } from "@/lib/ai-telemetry";

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({}).sort({ priority: -1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: products }, { status: 200 });
  } catch (error) {
    const err = handleError(error);
    return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userEmail = session?.user?.email;

    if (!session?.user || userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: SuperAdmin required." }, { status: 403 });
    }

    const body = await req.json();
    const name = sanitizeString(body.name, 150);
    const brand = sanitizeString(body.brand || "Essential Rush", 100);
    const price = Number(body.price);
    const stock = Number(body.stock || 0);

    if (!name || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ success: false, error: "Valid name and positive price are required." }, { status: 400 });
    }

    if (!Array.isArray(body.images) || body.images.filter(Boolean).length === 0) {
      return NextResponse.json({ success: false, error: "At least one product image is required." }, { status: 400 });
    }

    await connectDB();
    const product = await Product.create({
      ...body,
      name,
      brand,
      price,
      stock,
    });

    // 🛡️ Telemetry: Log creation & check stock threshold
    emitAiAuditLog({
      agentName: "Inventory Agent",
      requestedOperation: "CREATE_PRODUCT_ASSET",
      decision: `Published new timepiece '${name}' (${brand}) at ₹${price.toLocaleString("en-IN")}.`,
      toolUsed: "Products-API-Post",
      permissionLevel: "APPROVAL",
      executedBy: userEmail || "SUPER_ADMIN",
      riskScore: 0,
      status: "SUCCESS",
      resultSummary: `Product ID: ${product._id}, Initial Stock: ${stock}`,
    });

    if (stock <= 2) {
      emitAiAlert({
        category: "INVENTORY",
        severity: "LOW",
        title: `Low Initial Stock for ${name}`,
        description: `Product created with only ${stock} units.`,
        impact: "Early depletion warning for newly published timepiece.",
        aiAnalysis: "Product added with low initial inventory.",
        recommendedAction: "Verify if additional units are available in vault reserve.",
        affectedEntityId: product._id.toString(),
      });
    }

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/godmode");

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    const err = handleError(error);
    return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode || 500 });
  }
}