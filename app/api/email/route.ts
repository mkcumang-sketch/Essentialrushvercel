import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(req: Request) {
  try {
    const { to, subject, customerName, orderId, amount } = await req.json();

    if (!to) {
      return NextResponse.json({ success: false, error: "Missing `to`" }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ success: false, error: "Email is not set up on the server." }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);

    const data = await resend.emails.send({
      from: 'Essential Store <onboarding@resend.dev>', 
      to: [to],
      subject: subject || 'Order Confirmation - Essential',
      html: `
        <div style="font-family: Helvetica, sans-serif; background-color: #FAFAFA; padding: 40px 20px; color: #050505;">
            <div style="max-w: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #eaeaea;">
                <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 2px;">Essential</h1>
                <p style="color: #D4AF37; font-weight: bold; text-transform: uppercase; font-size: 10px; letter-spacing: 2px; margin-bottom: 30px;">Premium Timepieces</p>
                
                <h2 style="font-size: 20px; margin-bottom: 20px;">Hello ${customerName},</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #555;">Thank you for your acquisition. We have successfully received your order and our global logistics team is preparing it for dispatch.</p>
                
                <div style="background-color: #FAFAFA; padding: 20px; border-radius: 12px; margin: 30px 0; border: 1px solid #eee;">
                    <p style="margin: 0 0 10px 0; font-size: 12px; color: #888; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Order Summary</p>
                    <p style="margin: 0 0 5px 0; font-size: 16px;"><strong>Order ID:</strong> #${orderId?.slice(-6).toUpperCase() || '10045X'}</p>
                    <p style="margin: 0; font-size: 16px;"><strong>Total Amount:</strong> ₹${Number(amount).toLocaleString('en-IN')}</p>
                </div>
                
                <p style="font-size: 14px; color: #555;">You will receive another email once your asset is in transit.</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0 20px 0;" />
                <p style="font-size: 10px; color: #aaa; text-align: center; text-transform: uppercase; letter-spacing: 1px;">© 2026 Essential Store. All rights reserved.</p>
            </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error });
  }
}