export const dynamic = 'force-dynamic'; // 🚨 KILLS FAKE CACHE
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGODB_URI as string);
};

export async function GET() {
    try {
        await connectDB();
        
        // 🚀 THE ULTIMATE FIX: Explicitly casted to mongoose.Model<any> to resolve ts(2349)
        const Order = (mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({}, { strict: false }))) as mongoose.Model<any>;
        
        // Fetch ONLY real orders
        // Ab sirf 'CANCELLED' orders hide honge, baaki saare naye orders (Pending) turant dikhenge
        const allOrders = await Order.find({ status: { $ne: 'CANCELLED' } });
        
        // 🚀 FIX: Added types to reduce parameters to prevent implicit 'any' errors
        const totalRevenue = allOrders.reduce((sum: number, order: any) => sum + (Number(order.totalAmount) || 0), 0);

        return NextResponse.json({
            success: true,
            metrics: {
                totalOrders: allOrders.length, // REAL COUNT
                totalRevenue: totalRevenue     // REAL REVENUE
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, metrics: { totalOrders: 0, totalRevenue: 0 } });
    }
}