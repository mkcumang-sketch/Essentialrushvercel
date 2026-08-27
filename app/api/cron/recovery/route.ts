export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import nodemailer from 'nodemailer';
import { AbandonedCart } from '@/models/AbandonedCart';
import { sendRecoverySMS } from '@/lib/sms';
import mongoose from 'mongoose'; // 🚀 FIX: Import mongoose for model casting

function generateRecoveryCode(cartTotal: number): { code: string; discount: string; discountPercent: number } {
    const baseCode = `ER${Date.now().toString().slice(-6)}`;
    return {
        code: `RUSH${baseCode}`,
        discount: '5% OFF',
        discountPercent: 5
    };
}

async function sendRecoveryEmail(email: string, name: string, cartTotal: number, items: any[], recoveryCode: string) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('Email not configured - skipping recovery email');
        return false;
    }

    const itemsList = items.slice(0, 3).map((item: any, idx: number) => `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                <p style="margin: 0; font-weight: 600; color: #000;">${idx + 1}. ${item.name || item.title || 'Luxury Timepiece'}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Qty: ${item.qty || 1}</p>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">
                ₹${Number(item.price || 0).toLocaleString('en-IN')}
            </td>
        </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F5F5; padding: 40px 0;">
        <tr><td>
            <table width="600" cellpadding="0" cellspacing="0" style="margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                    <td style="background: linear-gradient(135deg, #0A0A0A, #1a1a1a); padding: 32px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #D4AF37; letter-spacing: 4px;">ESSENTIAL RUSH</h1>
                    </td>
                </tr>
                <!-- Content -->
                <tr>
                    <td style="padding: 40px;">
                        <p style="font-size: 16px; color: #333; margin: 0 0 8px 0;">Dear ${name || 'Valued Customer'},</p>
                        <p style="font-size: 14px; color: #666; line-height: 1.6;">
                            Your curated selection from Essential Rush is still waiting. The pieces you selected have been reserved for you.
                        </p>
                        <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 16px;">
                            Use your exclusive recovery code to complete your acquisition:
                        </p>
                        <div style="background: linear-gradient(135deg, #0A0A0A, #1a1a1a); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                            <p style="margin: 0 0 8px 0; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 2px;">Your Exclusive Code</p>
                            <p style="margin: 0; font-size: 28px; font-weight: 700; color: #D4AF37; letter-spacing: 3px;">${recoveryCode}</p>
                            <p style="margin: 12px 0 0 0; font-size: 14px; color: #fff;">5% OFF + Free insured shipping</p>
                        </div>
                        <p style="font-size: 12px; color: #999; margin: 24px 0 0 0;">
                            <em>Valid for 24 hours only. This offer expires soon.</em>
                        </p>
                        <!-- Items Summary -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                            ${itemsList}
                        </table>
                        <tr>
                            <td style="padding-top: 16px; border-top: 2px solid #D4AF37;">
                                <span style="font-weight: 700; color: #000;">Total</span>
                                <span style="float: right; font-size: 20px; font-weight: 700; color: #D4AF37;">₹${Number(cartTotal).toLocaleString('en-IN')}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center; padding-top: 32px;">
                                <a href="https://essentialrush.com/shop" style="display: inline-block; background: #D4AF37; color: #000; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
                                    COMPLETE ACQUISITION
                                </a>
                            </td>
                        </tr>
                    </td>
                </tr>
                <!-- Footer -->
                <tr>
                    <td style="background: #0A0A0A; padding: 24px; text-align: center;">
                        <p style="margin: 0; font-size: 11px; color: #666;">This is an automated recovery email. &copy; Essential Rush 2024.</p>
                    </td>
                </tr>
            </table>
        </td></tr>
    </table>
</body>
</html>
    `;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    try {
        await transporter.sendMail({
            from: `"Essential Rush" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Your selection awaits... ${recoveryCode} | 5% OFF`,
            html: html,
        });
        return true;
    } catch (error) {
        console.error('Recovery email error:', error);
        return false;
    }
}

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectDB();
        
        // 🚀 FIX: Cast to avoid any potential TS(2349)
        const AbandonedCartModel = AbandonedCart as mongoose.Model<any>;

        // Find carts abandoned for 24+ hours that haven't been sent recovery email
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const deadCarts = await AbandonedCartModel.find({
            $or: [
                { status: 'ABANDONED' },
                { status: { $exists: false } }
            ],
            updatedAt: { $lt: oneDayAgo },
            recoveryEmailSent: { $ne: true }
        }).limit(50);

        const results = { email: 0, sms: 0, failed: 0 };

        // 🚀 THE ULTIMATE FIX: Iterate as any[] to resolve all 7 TS(2339) & TS(2322) property and assignment errors
        for (const cart of deadCarts as any[]) {
            const cartTotal = cart.items?.reduce((acc: number, item: any) => acc + (item.price || 0) * (item.qty || 1), 0) || 0;
            const { code } = generateRecoveryCode(cartTotal);
            
            // Send Email
            if (cart.email) {
                const emailSent = await sendRecoveryEmail(
                    cart.email,
                    cart.name || 'Valued Customer',
                    cartTotal,
                    cart.items || [],
                    code
                );
                if (emailSent) {
                    cart.recoveryEmailSent = true;
                    cart.recoveryCode = code;
                    cart.recoveryEmailSentAt = new Date();
                    results.email++;
                }
            }

            // Send SMS as backup
            if (cart.phone) {
                const smsSent = await sendRecoverySMS(cart.phone, cart.name || 'Guest', `https://essentialrush.com/checkout?code=${code}`, '5% OFF');
                if (smsSent) {
                    cart.status = 'OFFER_SENT';
                    results.sms++;
                }
            }

            cart.status = cart.status || 'OFFER_SENT';
            await cart.save();
        }

        // Also update legacy Lead model for backward compatibility
        const Lead = (await import('@/models/Lead')).default;
        
        // 🚀 FIX: Cast Lead to mongoose.Model<any> to fix the final ts(2349) error
        const LeadModel = Lead as mongoose.Model<any>;
        
        const oldCarts = await LeadModel.find({
            status: 'ABANDONED',
            updatedAt: { $lt: oneDayAgo },
            offerSent: false
        }).limit(20);

        // 🚀 FIX: Also iterate as any[] for safe assignments
        for (const lead of oldCarts as any[]) {
            const { code } = generateRecoveryCode(lead.cartTotal);
            if (lead.phone) {
                await sendRecoverySMS(lead.phone, lead.name || 'Guest', `https://essentialrush.com/checkout?code=${code}`, '5% OFF');
                lead.offerSent = true;
                lead.status = 'OFFER_SENT';
                await lead.save();
                results.sms++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            processed: deadCarts.length + oldCarts.length,
            emailSent: results.email,
            smsSent: results.sms,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Recovery cron error:', error);
        return NextResponse.json({ error: 'Recovery failed' }, { status: 500 });
    }
}