import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Order } from '@/models/Order';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = (session.user as any).id;
        const userRole = (session.user as any).role;
        const db = mongoose.connection.db;

        let orders;
        if (userRole === 'SUPER_ADMIN') {
            orders = await Order.find({}).sort({ createdAt: -1 }).lean();
        } else {
            orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
        }

        let loyaltyTier = 'Silver Vault';
        if (db) {
            const userDoc = await db.collection('users').findOne({
                _id: mongoose.Types.ObjectId.isValid(userId)
                    ? new mongoose.Types.ObjectId(userId)
                    : userId,
            });
            if (userDoc) loyaltyTier = userDoc.loyaltyTier || 'Silver Vault';
        }

        return NextResponse.json(
            {
                success: true,
                data: orders,
                totalSpent: orders.reduce(
                    (acc: number, o: any) => acc + (Number(o.totalAmount) || 0),
                    0
                ),
                loyaltyTier,
            },
            { headers: { 'Cache-Control': 'no-store, no-cache' } }
        );
    } catch (error) {
        console.error('Get Orders Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server Error' },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        await connectDB();
        const body = await req.json();
        const { id, status, trackingId } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Order ID required' },
                { status: 400 }
            );
        }

        const order = await Order.findById(id);
        if (!order) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        const updateData: Partial<{
            status: string;
            trackingId: string;
            isRewardCredited: boolean;
        }> = {};

        if (status) updateData.status = status;
        if (trackingId !== undefined) updateData.trackingId = trackingId;

        const currentStatus = status ? String(status).toUpperCase() : '';

        // 🚀 Reward payout logic on delivery
        if (
            currentStatus === 'DELIVERED' &&
            order.referralCode &&
            !order.isRewardCredited
        ) {
            const cleanCode = order.referralCode.trim().toUpperCase();
            console.log(`🔍 Processing Reward for LINK: ${cleanCode}`);
            const db = mongoose.connection.db;

            if (db) {
                const agentUpdate = await db.collection('agents').updateOne(
                    { code: new RegExp(`^${cleanCode}$`, 'i') },
                    { $inc: { revenue: (order.totalAmount * 10) / 100 } }
                );

                if (agentUpdate.modifiedCount > 0) {
                    console.log('✅ AGENT PAYOUT SUCCESS!');
                    updateData.isRewardCredited = true;
                } else {
                    const userDoc = await db.collection('users').findOne({
                        myReferralCode: new RegExp(`^${cleanCode}$`, 'i'),
                    });

                    if (userDoc) {
                        const deductPending =
                            (userDoc.pendingWalletBalance || 0) >= 100 ? -100 : 0;

                        await db.collection('users').updateOne(
                            { _id: userDoc._id },
                            {
                                $inc: {
                                    walletBalance: 100,
                                    totalEarned: 100,
                                    pendingWalletBalance: deductPending,
                                },
                            }
                        );

                        console.log(
                            `💰 ₹100 wallet payout success for link: ${cleanCode}`
                        );
                        updateData.isRewardCredited = true;
                    }
                }
            }
        }

        const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
            new: true,
        });

        revalidatePath('/godmode');

        return NextResponse.json({ success: true, data: updatedOrder });
    } catch (error) {
        console.error('Patch Order Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update order' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        await connectDB();
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Order ID required' },
                { status: 400 }
            );
        }

        await Order.findByIdAndDelete(id);
        revalidatePath('/godmode');

        return NextResponse.json({ success: true, message: 'Order Deleted' });
    } catch (error) {
        console.error('Delete Order Error:', error);
        return NextResponse.json(
            { success: false, error: 'Delete failed' },
            { status: 500 }
        );
    }
}