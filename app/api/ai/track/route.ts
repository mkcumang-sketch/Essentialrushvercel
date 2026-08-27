export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// 🌟 THE LEAD SCHEMA (For tracking Abandoned Carts) 🌟
const leadSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    action: String,
    productId: String,
    category: String,
    phone: String,
    email: String,
    cartTotal: { type: Number, default: 0 },
    status: { type: String, default: 'abandoned' }
}, { timestamps: true });

// 🚀 FIX: Poore expression ko bracket mein daal kar explicitly cast kiya
const Lead = (mongoose.models.Lead || mongoose.model('Lead', leadSchema)) as mongoose.Model<any>;

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    try { await mongoose.connect(process.env.MONGODB_URI as string); } catch (e) {}
};

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { sessionId, action, productId, category } = body;
        
        // (Stray 'a' removed from here)

        // Generate a random session ID if browser didn't send one
        const safeSessionId = sessionId || `GUEST_${Date.now()}`;

        // Save the silent drop to database
        await Lead.findOneAndUpdate(
            { sessionId: safeSessionId },
            { 
                $set: { updatedAt: new Date() },
                $setOnInsert: { sessionId: safeSessionId, action, productId, category, status: 'abandoned' }
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, message: "Tracked securely." });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}