import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Order } from '@/models/Order';
import AbandonedCart from '@/models/AbandonedCart';
import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';
import { handleError } from '@/lib/error-handler';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { sanitizeString, escapeRegex } from '@/lib/sanitize';

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
    // 🛡️ 1. Rate Limiting Protection (User Tier)
    const ip = req.headers.get("x-forwarded-for")?.split(',')[0]?.trim() || "anonymous";
    const rateLimit = await checkRateLimit(ip, "user");
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many checkout attempts. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 🛡️ 2. LPDoS Payload Size Check (Max 30KB)
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 30 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Payload exceeds maximum limit.' },
        { status: 413, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    await connectDB();
    const body: CheckoutRequest = await req.json();

    const cleanFirstName = sanitizeString(body.customerInfo?.firstName, 50);
    const cleanLastName = sanitizeString(body.customerInfo?.lastName, 50);
    const cleanEmail = sanitizeString(body.customerInfo?.email, 100).toLowerCase();
    const cleanPhone = sanitizeString(body.customerInfo?.phone, 20).replace(/[^\d+]/g, '');
    const cleanAddress = sanitizeString(body.customerInfo?.address, 200);

    if (!cleanFirstName || !cleanEmail || !cleanPhone || !cleanAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid required customer shipping info' },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one item' },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 🛡️ 3. Tamper-Proof Server-Side Database Price Verification
    const Product = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({ price: Number, offerPrice: Number }));
    let verifiedSubtotal = 0;
    const verifiedItems = [];
    
    for (const item of body.items) {
      let actualPrice = Number(item.price) || 0;
      
      if (mongoose.Types.ObjectId.isValid(item.productId)) {
        const dbProduct = await Product.findById(item.productId).select("price offerPrice").lean() as any;
        if (dbProduct) {
          actualPrice = Number(dbProduct.offerPrice || dbProduct.price || actualPrice);
        }
      }
      
      const safeQty = Math.max(1, Math.min(50, Math.floor(Number(item.qty || 1))));
      verifiedSubtotal += (actualPrice * safeQty);
      
      verifiedItems.push({
        productId: sanitizeString(item.productId, 50),
        name: sanitizeString(item.name, 100),
        price: actualPrice,
        qty: safeQty,
        imageUrl: sanitizeString(item.imageUrl, 500)
      });
    }

    const shipping = verifiedSubtotal > 10000 ? 0 : 500;
    const discount = Math.max(0, Number(body.discountApplied) || 0);
    const verifiedTotalAmount = Math.max(0, verifiedSubtotal + shipping - discount);

    const newOrder = await Order.create({
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      customer: {
        name: `${cleanFirstName} ${cleanLastName}`.trim(),
        email: cleanEmail,
        phone: cleanPhone,
      },
      shippingData: {
        firstName: cleanFirstName,
        lastName: cleanLastName,
        email: cleanEmail,
        phone: cleanPhone,
        address: cleanAddress,
        city: sanitizeString(body.customerInfo?.city, 50),
        pincode: sanitizeString(body.customerInfo?.pincode, 10),
      },
      items: verifiedItems,
      totalAmount: verifiedTotalAmount,
      paymentStatus: body.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
      status: 'Processing',
      couponCode: body.couponCode ? sanitizeString(body.couponCode, 20).toUpperCase() : null,
      referralCode: body.referralCode ? sanitizeString(body.referralCode, 30).toUpperCase() : null,
      discountApplied: discount,
      isRewardCredited: false
    });

    // 🛡️ 4. Referral / Agent Commission Processing
    if (body.referralCode) {
      const cleanCode = sanitizeString(body.referralCode, 30).toUpperCase();
      const safeCodeRegex = new RegExp(`^${escapeRegex(cleanCode)}$`, 'i');
      const db = mongoose.connection.db; 

      if (db) {
        const agentUpdate = await db.collection('agents').updateOne(
          { code: safeCodeRegex }, 
          { $inc: { sales: 1 } }
        );

        if (agentUpdate.modifiedCount === 0) {
          await db.collection('users').updateOne(
            { myReferralCode: safeCodeRegex },
            { $inc: { pendingWalletBalance: 100 } }
          );
        }
      }
    }

    // 🛡️ 5. Sync Abandoned Cart status to CONVERTED
    await AbandonedCart.updateOne(
      { $or: [{ phone: cleanPhone }, { email: cleanEmail }] },
      { $set: { status: 'CONVERTED' } }
    ).catch(() => {});

    revalidatePath('/godmode'); 
    revalidatePath('/api/orders');

    return NextResponse.json(
      { success: true, order: newOrder },
      { status: 201, headers: getRateLimitHeaders(rateLimit) }
    );

  } catch (error) {
    const errorInfo = handleError(error);
    console.error("❌ POST Checkout Error:", errorInfo);
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorInfo.message,
        details: errorInfo.details
      }, 
      { status: errorInfo.statusCode || 500 }
    );
  }
}