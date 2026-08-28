import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Order } from '@/models/Order';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sanitizeString, escapeRegex } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const db = mongoose.connection.db;

    let orders;
    if (userRole === 'SUPER_ADMIN') {
      orders = await Order.find({}).sort({ createdAt: -1 }).lean();
    } else {
      orders = await Order.find({
        $or: [
          { userId: { $eq: userId } },
          { 'customer.email': { $eq: session.user.email?.toLowerCase() } },
        ],
      }).sort({ createdAt: -1 }).lean();
    }

    let loyaltyTier = 'Silver Vault';
    if (db && userId && mongoose.Types.ObjectId.isValid(userId)) {
      const userDoc = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
      if (userDoc) loyaltyTier = userDoc.loyaltyTier || 'Silver Vault';
    }

    const totalSpent = orders.reduce((acc: number, o: any) => acc + (Number(o.totalAmount) || 0), 0);

    return NextResponse.json({
      success: true,
      data: orders,
      totalSpent,
      loyaltyTier,
    });
  } catch (error) {
    console.error('Get Orders Error:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const id = sanitizeString(body?.id, 50);
    const status = sanitizeString(body?.status, 30);
    const trackingId = sanitizeString(body?.trackingId, 100);

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Valid Order ID required' }, { status: 400 });
    }

    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    const updateData: Record<string, any> = {};
    if (status) updateData.status = status;
    if (trackingId !== undefined) updateData.trackingId = trackingId;

    const currentStatus = status ? status.toUpperCase() : '';

    // 🛡️ Atomic Reward Credit Check
    if (currentStatus === 'DELIVERED' && order.referralCode && !order.isRewardCredited) {
      const cleanCode = escapeRegex(order.referralCode.trim().toUpperCase());
      const db = mongoose.connection.db;

      if (db) {
        const agentUpdate = await db.collection('agents').updateOne(
          { code: new RegExp(`^${cleanCode}$`, 'i') },
          { $inc: { revenue: (order.totalAmount * 10) / 100 } }
        );

        if (agentUpdate.modifiedCount > 0) {
          updateData.isRewardCredited = true;
        } else {
          const userDoc = await db.collection('users').findOne({
            myReferralCode: new RegExp(`^${cleanCode}$`, 'i'),
          });

          if (userDoc) {
            const deductPending = (userDoc.pendingWalletBalance || 0) >= 100 ? -100 : 0;
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
            updateData.isRewardCredited = true;
          }
        }
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    revalidatePath('/godmode');

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('Patch Order Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const { id } = await req.json();
    const cleanId = sanitizeString(id, 50);

    if (!cleanId || !mongoose.Types.ObjectId.isValid(cleanId)) {
      return NextResponse.json({ success: false, error: 'Valid Order ID required' }, { status: 400 });
    }

    await Order.findByIdAndDelete(cleanId);
    revalidatePath('/godmode');

    return NextResponse.json({ success: true, message: 'Order Deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }
}