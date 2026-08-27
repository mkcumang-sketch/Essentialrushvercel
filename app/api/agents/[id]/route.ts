export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id: affiliateId } = await params;

        // 🚀 THE ULTIMATE FIX: Poore expression ko brackets mein daal kar cast kiya hai
        const Agent = (mongoose.models.Agent || mongoose.model('Agent', new mongoose.Schema({}, { strict: false }))) as mongoose.Model<any>;
        
        // 🚀 HARD DELETE FROM DB
        await Agent.findByIdAndDelete(affiliateId);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}