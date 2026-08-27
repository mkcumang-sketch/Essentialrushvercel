export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose'; // 🚀 FIX: mongoose ko import kiya
import connectDB from '@/lib/mongodb';
import PricingRule from '@/models/PricingRule';

// 🚀 THE ULTIMATE FIX: Model ko strongly cast kiya taaki 5 ke 5 ts(2349) errors ek saath hat jayein
const PricingRuleModel = PricingRule as mongoose.Model<any>;

export async function GET() {
  try {
    await connectDB();
    // 🚀 FIX: PricingRule ki jagah PricingRuleModel use kiya
    let rules = await PricingRuleModel.findOne({});
    if (!rules) rules = await PricingRuleModel.create({});
    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    // 🚀 FIX: PricingRule ki jagah PricingRuleModel use kiya
    let rules = await PricingRuleModel.findOne({});
    
    if (rules) {
      rules = await PricingRuleModel.findByIdAndUpdate(rules._id, { $set: body }, { new: true });
    } else {
      rules = await PricingRuleModel.create(body);
    }
    
    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}