export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { AbandonedCart } from '@/models/AbandonedCart';

export async function POST(req: Request) {
  try {
    await connectDB();
    const payload = await req.json();
    const name = String(payload?.name || 'Vault Client').trim();
    const email = String(payload?.email || '').trim().toLowerCase();
    const phone = String(payload?.phone || '').trim();
    const items = Array.isArray(payload?.cartItems) ? payload.cartItems : [];

    if (!email && !phone) {
      return NextResponse.json({ success: false, error: "Email or phone required" }, { status: 400 });
    }

    const orConditions: any[] = [];
    if (email) orConditions.push({ email });
    if (phone) orConditions.push({ phone });

    // 🔥 GHOST CART KILLER (VERIF-LEAD EDITION)
    // Agar items 0 hain (jaise checkout ke baad frontend empty ho gaya ho),
    // Toh database se Abandoned Cart hamesha ke liye uda do, naya mat banao!
    if (items.length === 0) {
      await AbandonedCart.deleteMany({ $or: orConditions });
      return NextResponse.json({ success: true, action: 'cart_deleted', message: 'Empty cart received, purged from DB' });
    }

    const computedTotal = items.reduce((acc: number, item: any) => {
      const price = Number(item?.offerPrice ?? item?.price ?? 0);
      const qty = Number(item?.qty ?? 1);
      return acc + (Number.isFinite(price) ? price : 0) * (Number.isFinite(qty) ? qty : 1);
    }, 0);

    const cartTotal = Number.isFinite(Number(payload?.cartTotal))
      ? Number(payload?.cartTotal)
      : computedTotal;

    const lead = await AbandonedCart.findOneAndUpdate(
      { $or: orConditions },
      {
        name,
        email,
        phone,
        items,
        cartTotal: Number.isFinite(cartTotal) ? cartTotal : 0,
        status: 'ABANDONED',
        lastInteraction: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, leadId: lead._id });
  } catch (error) {
    console.error("Verif-lead API Error:", error);
    return NextResponse.json({ success: false, error: "We could not save your details." }, { status: 500 });
  }
}