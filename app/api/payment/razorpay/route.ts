export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: "Payment Gateway is currently in mock mode.",
      orderId: `mock_order_${Date.now()}`
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Payment routing error" }, { status: 500 });
  }
}