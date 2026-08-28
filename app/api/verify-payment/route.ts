export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Order } from '@/models/Order';
import Razorpay from 'razorpay';
import { z } from 'zod';
import crypto from 'crypto';
import { sanitizeString } from '@/lib/sanitize';

let razorpay: any = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

const paymentVerificationSchema = z.object({
  razorpay_order_id: z.string().trim().min(1),
  razorpay_payment_id: z.string().trim().min(1),
  razorpay_signature: z.string().trim().min(1),
  orderId: z.string().trim().min(1),
});

export async function POST(req: Request) {
  try {
    if (!razorpay || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({
        success: false,
        error: "Payment Gateway is currently inactive (Missing Configuration)."
      }, { status: 503 });
    }

    await connectDB();
    const rawBody = await req.json().catch(() => null);

    const validation = paymentVerificationSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Malformed payment payload." }, { status: 400 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = validation.data;
    const cleanOrderId = sanitizeString(orderId, 50);

    // 🛡️ Timing-Safe Cryptographic Signature Verification
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const signatureBuffer = Buffer.from(razorpay_signature);
    const generatedBuffer = Buffer.from(generatedSignature);

    const isMatch = signatureBuffer.length === generatedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, generatedBuffer);

    if (!isMatch) {
      await Order.findOneAndUpdate(
        { orderId: { $eq: cleanOrderId } },
        { $set: { paymentStatus: 'FAILED', status: 'Payment Failed' } }
      );
      return NextResponse.json({ success: false, error: "Tampered or invalid signature." }, { status: 400 });
    }

    // 🛡️ Atomic Order Finalization
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: { $eq: cleanOrderId } },
      {
        $set: {
          paymentStatus: 'Paid',
          status: 'Confirmed',
          razorpayPaymentId: sanitizeString(razorpay_payment_id, 100),
          razorpaySignature: sanitizeString(razorpay_signature, 200),
          paidAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ success: false, error: "Target order record not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified and vault acquisition confirmed.",
      order: updatedOrder
    });
  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error during verification." }, { status: 500 });
  }
}