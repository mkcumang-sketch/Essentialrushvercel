export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose, { Model, Schema } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sanitizeString } from "@/lib/sanitize";

const FaqSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, default: "General" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const FaqModel =
  (mongoose.models.Faq as Model<any>) ||
  mongoose.model("Faq", FaqSchema);

export async function GET() {
  try {
    await connectDB();
    const dbFaqs = await FaqModel.find({}).sort({ order: 1 }).lean();

    if (dbFaqs && dbFaqs.length > 0) {
      return NextResponse.json({ success: true, data: dbFaqs });
    }

    // Default static fallback
    return NextResponse.json({
      success: true,
      data: [
        { _id: "1", question: "Are they authentic?", answer: "100% Swiss Guaranteed." },
        { _id: "2", question: "What is the delivery timeline?", answer: "Insured delivery within 2-4 business days." }
      ]
    });
  } catch {
    return NextResponse.json([
      { _id: "1", q: "Are they authentic?", a: "100% Swiss Guaranteed." }
    ], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));

    const question = sanitizeString(body.question || body.q, 300);
    const answer = sanitizeString(body.answer || body.a, 2000);
    const category = sanitizeString(body.category, 50) || "General";

    if (!question || !answer) {
      return NextResponse.json({ success: false, error: "Question and answer required." }, { status: 400 });
    }

    const faq = await FaqModel.create({
      question,
      answer,
      category,
      order: Number(body.order) || 0,
    });

    return NextResponse.json({ success: true, data: faq }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}