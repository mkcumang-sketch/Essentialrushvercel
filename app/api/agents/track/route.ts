export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose'; // 🚀 FIX: Imported mongoose for type casting
import connectDB from '@/lib/mongodb';
import { Agent } from '@/models/Agent'; 

export async function POST(req: Request) {
  try {
    await connectDB();
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ success: false, message: 'Code is required' }, { status: 400 });
    }

    // 🚀 FIX: Explicitly cast Agent to mongoose.Model<any> to resolve the union type error
    const AgentModel = Agent as mongoose.Model<any>;

    // Agent dhundho aur uske 'clicks' ko 1 se badha do
    const agent = await AgentModel.findOneAndUpdate(
      { code: { $regex: new RegExp(`^${code.trim()}$`, 'i') } },
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!agent) {
      return NextResponse.json({ success: false, message: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Click tracked successfully' });
  } catch (error) {
    console.error('Tracking Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}