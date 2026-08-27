import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { sendEmail } from '@/lib/mail';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, message: 'Login required' },
                { status: 401 }
            );
        }

        const { orderId } = await req.json();

        if (!orderId) {
            return NextResponse.json(
                { success: false, message: 'Order ID is required' },
                { status: 400 }
            );
        }

        await connectDB();

        const order = await Order.findOne({
            _id: orderId,
            'customer.email': session.user.email,
        });

        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        if (order.status !== 'Pending' && order.status !== 'Processing') {
            return NextResponse.json(
                { success: false, message: 'Too late to cancel.' },
                { status: 400 }
            );
        }

        // Status update
        order.status = 'Cancelled';
        await order.save();

        // Customer ko cancellation email bhejo
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; padding: 40px 20px; background-color: #0A0A0A; color: #ffffff; text-align: center;">
                <h2 style="color: #D4AF37; font-style: italic;">Essential Rush</h2>
                <h3 style="color: #ff4444;">Order Cancelled</h3>
                <p style="color: #cccccc;">Your order for <strong>${order.items?.[0]?.name || 'your luxury item'}</strong> has been successfully cancelled.</p>
                <div style="margin: 30px auto; padding: 20px; border: 1px solid #333; border-radius: 10px; max-width: 400px; text-align: left;">
                    <p style="color: #888; font-size: 12px; margin: 0;">Order ID</p>
                    <p style="color: #fff; margin: 5px 0 15px 0;">${order.orderId}</p>

                    <p style="color: #888; font-size: 12px; margin: 0;">Refund Status</p>
                    <p style="color: #fff; margin: 5px 0 0 0;">If you paid online, the amount will be reversed to your original payment method within 5-7 business days.</p>
                </div>
                <p style="color: #888; font-size: 12px; margin-top: 30px;">We hope to serve you again soon.</p>
            </div>
        `;

        // Background mein mail bhej do, request block nahi karna
        sendEmail(
            session.user.email,
            `Order Cancelled - ${order.orderId}`,
            emailHtml
        ).catch((err) => console.error('Email send failed:', err));

        return NextResponse.json({
            success: true,
            message: 'Order cancelled and email sent!',
        });
    } catch (error: any) {
        console.error('Cancel Order Error:', error.message);
        return NextResponse.json(
            { success: false, message: 'Server Error' },
            { status: 500 }
        );
    }
}