import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Order } from '@/models/Order';
import User from '@/models/usertemp';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import mongoose from 'mongoose'; // 🚀 FIX: mongoose import kiya model casting ke liye

const invoiceSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  forceRegenerate: z.boolean().optional(),
});

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
}

// 🚀 THE ULTIMATE FIX: Models ko explicitly cast kiya taaki TS(2349) ke 3 errors hat jayein
const OrderModel = Order as mongoose.Model<any>;
const UserModel = User as mongoose.Model<any>;

async function generateInvoiceHTML(order: any, userData: UserData) {
  const itemsHTML = order.items?.map((item: any, idx: number) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #eee;">
        <p style="margin: 0; font-weight: 600; color: #111; font-size: 14px;">${idx + 1}. ${item.name || 'Luxury Timepiece'}</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #777;">Qty: ${item.qty || 1}</p>
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; color: #111;">
        ₹${Number(item.price || 0).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('') || '';

  const shipping = order.shippingData || {};
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  }) : new Date().toLocaleDateString('en-IN');

  // 💎 ENHANCEMENT: Upgraded the HTML for a more premium, luxury brand feel
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${order.orderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F9FA; padding: 40px 0;">
      <tr>
        <td>
          <table width="650" cellpadding="0" cellspacing="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.06);">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #050505 0%, #1a1a1a 100%); padding: 48px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #D4AF37; letter-spacing: 4px; text-transform: uppercase;">Essential Rush</h1>
                      <p style="margin: 8px 0 0 0; font-size: 12px; color: #A0A0A0; letter-spacing: 2px; text-transform: uppercase;">Fine Horology & Luxury Timepieces</p>
                    </td>
                    <td style="text-align: right;">
                      <p style="margin: 0; font-size: 26px; font-weight: 400; color: #ffffff; font-family: Georgia, serif; letter-spacing: 2px;">INVOICE</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Invoice Details -->
            <tr>
              <td style="padding: 40px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%" valign="top">
                      <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 700; color: #A0A0A0; letter-spacing: 1.5px; text-transform: uppercase;">Billed To</p>
                      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111;">${userData?.name || shipping.name || 'Valued Customer'}</p>
                      <p style="margin: 6px 0 0 0; font-size: 14px; color: #555;">${userData?.email || shipping.email || ''}</p>
                      ${userData?.phone || shipping.phone ? `<p style="margin: 6px 0 0 0; font-size: 14px; color: #555;">${userData.phone || shipping.phone}</p>` : ''}
                    </td>
                    <td width="50%" valign="top" style="text-align: right;">
                      <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 700; color: #A0A0A0; letter-spacing: 1.5px; text-transform: uppercase;">Order Details</p>
                      <p style="margin: 0; font-size: 14px; color: #444;"><strong>Invoice #:</strong> ${order.orderId}</p>
                      <p style="margin: 6px 0 0 0; font-size: 14px; color: #444;"><strong>Date:</strong> ${orderDate}</p>
                      <p style="margin: 6px 0 0 0; font-size: 14px; color: #444;"><strong>Status:</strong> <span style="color: #D4AF37; font-weight: 700;">${order.status || 'PAID'}</span></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Line Items -->
            <tr>
              <td style="padding: 0 40px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <thead>
                    <tr style="border-bottom: 2px solid #222;">
                      <th style="text-align: left; padding: 16px 0; font-size: 11px; font-weight: 700; color: #A0A0A0; letter-spacing: 1.5px; text-transform: uppercase;">Description</th>
                      <th style="text-align: right; padding: 16px 0; font-size: 11px; font-weight: 700; color: #A0A0A0; letter-spacing: 1.5px; text-transform: uppercase;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHTML}
                  </tbody>
                </table>
              </td>
            </tr>
            
            <!-- Total -->
            <tr>
              <td style="padding: 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background: #F8F9FA; border-radius: 8px; padding: 24px;">
                  <tr>
                    <td style="font-size: 14px; color: #555; text-transform: uppercase; letter-spacing: 1px;">Subtotal</td>
                    <td style="text-align: right; font-size: 16px; font-weight: 600; color: #222;">₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 14px; color: #555; text-transform: uppercase; letter-spacing: 1px; padding-top: 14px;">Shipping</td>
                    <td style="text-align: right; font-size: 16px; font-weight: 600; color: #222; padding-top: 14px;">Complimentary</td>
                  </tr>
                  <tr>
                    <td colspan="2"><hr style="border: none; border-top: 1px solid #E0E0E0; margin: 20px 0;" /></td>
                  </tr>
                  <tr>
                    <td style="font-size: 16px; font-weight: 800; color: #111; text-transform: uppercase; letter-spacing: 1px;">Total Paid</td>
                    <td style="text-align: right; font-size: 26px; font-weight: 800; color: #D4AF37;">₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Shipping Address -->
            ${shipping.address ? `
            <tr>
              <td style="padding: 0 40px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E0E0E0; border-radius: 8px; padding: 24px;">
                  <tr>
                    <td>
                      <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 700; color: #A0A0A0; letter-spacing: 1.5px; text-transform: uppercase;">Shipping Destination</p>
                      <p style="margin: 0; font-size: 14px; color: #222; font-weight: 500;">${shipping.name || ''}</p>
                      <p style="margin: 6px 0 0 0; font-size: 14px; color: #555; line-height: 1.5;">${shipping.address || ''}<br>${[shipping.city, shipping.state, shipping.pincode].filter(Boolean).join(', ')}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ` : ''}
            
            <!-- Footer -->
            <tr>
              <td style="background: #050505; padding: 32px 40px; text-align: center;">
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #D4AF37; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">Thank you for choosing Essential Rush</p>
                <p style="margin: 0; font-size: 11px; color: #777;">This is a computer-generated invoice and requires no signature.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

async function sendInvoiceEmail(order: any, userEmail: string, userName: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email not configured - skipping invoice email');
    return { success: false, error: 'Email not configured' };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const userData = { name: userName, email: userEmail };
  const invoiceHTML = await generateInvoiceHTML(order, userData);

  const mailOptions = {
    from: `"Essential Rush" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: `Invoice: ${order.orderId} | Essential Rush`,
    html: invoiceHTML,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error('Invoice email failed:', error);
    return { success: false, error: error.message };
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const validation = invoiceSchema.safeParse(json);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { orderId, forceRegenerate } = validation.data;

    await connectDB();
    
    // 🚀 FIX: Used strongly casted OrderModel
    const order: any = await OrderModel.findOne({ orderId });
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    let dbUser: any = null;
    let userEmail = order.shippingData?.email;
    let userName = order.shippingData?.name || 'Valued Customer';

    if (order.userId) {
      // 🚀 FIX: Used strongly casted UserModel
      dbUser = await UserModel.findById(order.userId);
      if (dbUser) {
        userEmail = dbUser.email || userEmail;
        userName = dbUser.name || userName;
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'No email address found for order' },
        { status: 400 }
      );
    }

    const result = await sendInvoiceEmail(order, userEmail, userName);

    if (result.success || forceRegenerate) {
      // 🚀 FIX: Used strongly casted OrderModel
      await OrderModel.findByIdAndUpdate(order._id, {
        $set: { invoiceSentAt: new Date() }
      });
    }

    return NextResponse.json({
      success: true,
      message: result.success ? 'Invoice sent successfully' : result.error,
      email: userEmail,
    });
  } catch (error: any) {
    console.error('Invoice API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process invoice' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    // 🚀 FIX: Used strongly casted OrderModel
    const order: any = await OrderModel.findOne({ orderId });
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const invoiceHTML = await generateInvoiceHTML(order, {
      name: order.shippingData?.name,
      email: order.shippingData?.email,
    });

    return new Response(invoiceHTML, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    console.error('Invoice GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}