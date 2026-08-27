import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Order } from '@/models/Order';
import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';
import { handleError } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface CheckoutRequest {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
  };
  items: Array<{
    productId: string;
    name: string;
    price: number;
    qty: number;
    imageUrl: string;
  }>;
  totalAmount: number;
  paymentStatus: string;
  couponCode?: string | null;
  referralCode?: string | null;
  discountApplied?: number;
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const body: CheckoutRequest = await req.json();

        // 🔧 VALIDATION WITH PROPER TYPING
        if (!body.customerInfo?.firstName || !body.customerInfo?.email) {
            return NextResponse.json(
                { success: false, error: 'Missing required customer info' },
                { status: 400 }
            );
        }

        if (!Array.isArray(body.items) || body.items.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Order must contain at least one item' },
                { status: 400 }
            );
        }

        // Use the typed Order model directly
        const newOrder = await Order.create({
            orderId: `ORD-${Date.now().toString().slice(-6)}`,
            customer: {
                name: `${body.customerInfo.firstName} ${body.customerInfo.lastName}`,
                email: body.customerInfo.email,
                phone: body.customerInfo.phone,
            },
            shippingData: body.customerInfo,
            items: body.items,
            totalAmount: body.totalAmount,
            paymentStatus: body.paymentStatus || 'Paid',
            status: 'Processing',
            couponCode: body.couponCode || null,
            referralCode: body.referralCode || null,
            discountApplied: body.discountApplied || 0,
            isRewardCredited: false
        });

        // 🚀 MONGODB BYPASS: Pending Wallet
        if (body.referralCode) {
            const cleanCode = body.referralCode.trim().toUpperCase();
            const db = mongoose.connection.db; 

            if(db) {
                const agentUpdate = await db.collection('agents').updateOne(
                    { code: new RegExp(`^${cleanCode}$`, 'i') }, 
                    { $inc: { sales: 1 } }
                );

                if (agentUpdate.modifiedCount === 0) {
                    await db.collection('users').updateOne(
                        { myReferralCode: new RegExp(`^${cleanCode}$`, 'i') },
                        { $inc: { pendingWalletBalance: 100 } }
                    );
                    console.log(`✅ [CHECKOUT] Added ₹100 PENDING wallet for Link: ${cleanCode}`);
                }
            }
        }

        revalidatePath('/godmode'); 
        revalidatePath('/api/orders');

        return NextResponse.json(
            { success: true, order: newOrder },
            { status: 201 }
        );

    } catch (error) {
        // 🔧 PROPER ERROR HANDLING - TYPED
        const errorInfo = handleError(error);
        console.error("❌ POST Checkout Error:", errorInfo);
        
        return NextResponse.json(
            { 
                success: false, 
                error: errorInfo.message,
                details: errorInfo.details
            }, 
            { status: errorInfo.statusCode }
        );
    }
}