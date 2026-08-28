import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Order } from '@/models/Order';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sanitizeString, escapeRegex } from '@/lib/sanitize';
import { emitAiAlert, emitAiAuditLog } from '@/lib/ai-telemetry';

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
    const isStaffOrAdmin = ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'AGENT'].includes(userRole);

    if (isStaffOrAdmin) {
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
    const userRole = (session?.user as any)?.role;
    const userEmail = session?.user?.email;
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'AGENT'];

    if (!session || !session.user || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const id = sanitizeString(body?.id || body?.orderId, 50);
    const status = sanitizeString(body?.status, 30);
    const trackingId = sanitizeString(body?.trackingId || body?.trackingNumber, 100);
    const courier = sanitizeString(body?.courier, 100);

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Valid Order ID required' }, { status: 400 });
    }

    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    const updateData: Record<string, any> = {};
    if (status) updateData.status = status;
    if (trackingId !== undefined) {
      updateData.trackingId = trackingId;
      updateData.trackingNumber = trackingId;
    }
    if (courier !== undefined) {
      updateData.courier = courier;
    }

    const currentStatus = status ? status.toUpperCase() : '';

    // 🛡️ Atomic Referral & Agent Reward Processing
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

    // 🛡️ Emit Non-blocking AI Audit Log
    emitAiAuditLog({
      agentName: 'Order Agent',
      requestedOperation: 'UPDATE_ORDER_LIFECYCLE',
      decision: `Order #${order.orderId || id} updated to status '${status || order.status}'.`,
      toolUsed: 'Orders-API-Patch',
      permissionLevel: 'AUTO',
      executedBy: userEmail || userRole || 'STAFF',
      riskScore: currentStatus === 'CANCELLED' ? 40 : 5,
      status: 'SUCCESS',
      resultSummary: `Status: ${status || order.status}, Tracking: ${trackingId || 'N/A'}`,
      dataAccessed: { orderId: order.orderId, previousStatus: order.status, newStatus: status },
    });

    if (currentStatus === 'CANCELLED') {
      emitAiAlert({
        category: 'ORDERS',
        severity: 'MEDIUM',
        title: `Order Voided / Cancelled: #${order.orderId}`,
        description: `Order valued at ₹${order.totalAmount.toLocaleString('en-IN')} was marked as Cancelled.`,
        impact: 'Loss of conversion and potential inventory restock requirement.',
        aiAnalysis: 'Order cancellation executed via administrative interface.',
        recommendedAction: 'Verify if inventory units must be restored.',
        affectedEntityId: order.orderId,
      });
    }

    revalidatePath('/godmode');
    revalidatePath('/agent');

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('Patch Order Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userEmail = session?.user?.email;

    if (!session || !session.user || userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const { id } = await req.json();
    const cleanId = sanitizeString(id, 50);

    if (!cleanId || !mongoose.Types.ObjectId.isValid(cleanId)) {
      return NextResponse.json({ success: false, error: 'Valid Order ID required' }, { status: 400 });
    }

    const deletedOrder = await Order.findByIdAndDelete(cleanId);

    // 🛡️ Telemetry on deletion
    emitAiAuditLog({
      agentName: 'Security Agent',
      requestedOperation: 'DELETE_ORDER_RECORD',
      decision: `Purged order ${cleanId} from persistent database.`,
      toolUsed: 'Orders-API-Delete',
      permissionLevel: 'APPROVAL',
      executedBy: userEmail || 'SUPER_ADMIN',
      riskScore: 70,
      status: 'SUCCESS',
      resultSummary: `Order ${cleanId} deleted permanently.`,
    });

    revalidatePath('/godmode');
    revalidatePath('/agent');

    return NextResponse.json({ success: true, message: 'Order Deleted', deletedOrder });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }
}