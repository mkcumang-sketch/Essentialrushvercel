export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Order } from '@/models/Order';
import User from '@/models/usertemp';
import { Agent } from '@/models/Agent';
import Razorpay from 'razorpay';
import { z } from 'zod';
import crypto from 'crypto';

// 🛡️ BUILD-SAFE RAZORPAY INITIALIZATION
let razorpay: any = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
}

// 🛡️ PAYMENT VERIFICATION SCHEMA
const paymentVerificationSchema = z.object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
      orderId: z.string(), // Our internal order ID
});

export async function POST(req: Request) {
      try {
            // 1. Check if Razorpay is configured
            if (!razorpay) {
                  return NextResponse.json({
                        success: false,
                        error: "Payment Gateway is currently under maintenance (Missing Keys)."
                  }, { status: 503 });
            }

            await connectDB();
            const body = await req.json();

            // 2. Zod Validation
            const validation = paymentVerificationSchema.safeParse(body);
            if (!validation.success) {
                  return NextResponse.json({ success: false, error: "Invalid payment verification data." }, { status: 400 });
            }
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = validation.data;

            // 3. Verify Payment Signature
            const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string);
            shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
            const digest = shasum.digest('hex');

            if (digest !== razorpay_signature) {
                  // Signature mismatch, payment failed or tampered
                  await Order.findOneAndUpdate({ orderId: orderId }, { status: 'PAYMENT_FAILED' });
                  return NextResponse.json({ success: false, error: "Payment verification failed: Signature mismatch." }, { status: 400 });
            }

            // 4. Update Order Status in DB
            const updatedOrder = await Order.findOneAndUpdate(
                  { orderId: orderId },
                  {
                        status: 'PAID',
                        razorpayPaymentId: razorpay_payment_id,
                        razorpaySignature: razorpay_signature,
                        paidAt: new Date(),
                  },
                  { new: true }
            );

            if (!updatedOrder) {
                  return NextResponse.json({ success: false, error: "Order not found for status update." }, { status: 404 });
            }

            return NextResponse.json({ success: true, message: "Payment verified successfully", order: updatedOrder });
      } catch (error: any) {
            console.error("Payment Verification Error:", error);
            return NextResponse.json({ success: false, error: "Internal Server Error during verification." }, { status: 500 });
      }
}