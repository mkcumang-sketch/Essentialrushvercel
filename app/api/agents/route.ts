import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import { Agent } from '@/models/Agent';

export const dynamic = 'force-dynamic';

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI as string);
};

// 🚀 FIX: Agent ko explicitly cast kar diya taaki teeno routes mein ts(2349) error na aaye
const AgentModel = Agent as mongoose.Model<any>;

export async function GET() {
  try {
    await connectDB();
    // 🚀 FIX: Agent ki jagah AgentModel use kiya
    const agents = await AgentModel.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: agents });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch agents" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    
    if (body.code) {
      body.code = body.code.toUpperCase();
    }

    const agentData = {
        name: body.name,
        email: body.email,
        code: body.code,
        tier: body.role || body.tier || 'Partner',
        commissionRate: body.commission || body.commissionRate || 5,
        clicks: body.clicks || 0,
        sales: body.sales || 0,
        revenue: body.revenue || 0
    };

    // 🚀 FIX: Agent ki jagah AgentModel use kiya
    const newAgent = await AgentModel.create(agentData);
    revalidatePath('/godmode');
    return NextResponse.json({ success: true, data: newAgent });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: "Duplicate referral code detected." }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to create agent" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ success: false, error: "ID missing" }, { status: 400 });

    // 🚀 FIX: Agent ki jagah AgentModel use kiya
    await AgentModel.findByIdAndDelete(id);
    revalidatePath('/godmode');

    return NextResponse.json({ success: true, message: "Agent Deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}