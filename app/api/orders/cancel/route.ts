import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { sendEmail } from '@/lib/mail';
import { sanitizeString } from '@/lib/sanitize';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = sanitizeString(session?.user?.email, 100).toLowerCase();

    if (!userEmail) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const cleanOrderId = sanitizeString(body?.orderId, 50);

    if (!cleanOrderId || !mongoose.Types.ObjectId.isValid(cleanOrderId)) {
      return NextResponse.json({ success: false, message: 'Valid Order ID required' }, { status: 400 });
    }

    await connectDB();

    // 🛡️ Scoped query prevents cancelling another customer's order
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(cleanOrderId),
        'customer.email': { $eq: userEmail },
        status: { $in: ['Pending', 'Processing'] },
      },
      {
        $set: { status: 'Cancelled' },
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ success: false, message: 'Order cannot be cancelled or was not found.' }, { status: 400 });
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 40px 20px; background-color: #0A0A0A; color: #ffffff; text-align: center;">
        <h2 style="color: #D4AF37; font-style: italic;">Essential Rush</h2>
        <h3 style="color: #ff4444;">Order Cancelled</h3>
        <p style="color: #cccccc;">Your order <strong>${updatedOrder.orderId}</strong> has been cancelled.</p>
        <p style="color: #888; font-size: 12px; margin-top: 20px;">If paid online, refunds process within 5-7 business days.</p>
      </div>
    `;

    sendEmail(userEmail, `Order Cancelled - ${updatedOrder.orderId}`, emailHtml).catch(() => {});

    return NextResponse.json({ success: true, message: 'Order successfully cancelled.' });
  } catch (error: any) {
    console.error('Cancel Order Error:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}