import nodemailer from 'nodemailer';

interface SendOrderConfirmationEmailOptions {
  to: string;
  subject?: string;
  customerName?: string;
  orderId?: string;
  amount?: number;
}

interface SendOrderConfirmationEmailResult {
  messageId: string;
}

export async function sendOrderConfirmationEmail(
  options: SendOrderConfirmationEmailOptions
): Promise<SendOrderConfirmationEmailResult> {
  const {
    to,
    subject = 'Order Confirmation – EssentialRush',
    customerName = 'Valued Customer',
    orderId,
    amount,
  } = options;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const formattedAmount =
    amount != null
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
      : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background: #111; padding: 30px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">EssentialRush</h1>
          <p style="color: #aaa; margin: 8px 0 0;">Order Confirmation</p>
        </div>

        <!-- Body -->
        <div style="padding: 36px 30px;">
          <p style="font-size: 16px; margin: 0 0 12px;">Hi <strong>${customerName}</strong>,</p>

          <p style="color: #444; line-height: 1.6; margin: 0 0 20px;">
            Thank you for your order! We've received it and are getting it ready for you.
          </p>

          ${
            orderId
              ? `<p style="color: #555; margin: 0 0 10px;">
                  Order ID: <strong style="font-family: monospace;">#${orderId}</strong>
                </p>`
              : ''
          }

          ${
            formattedAmount
              ? `<p style="color: #555; margin: 0 0 24px;">
                  Order Total: <strong>${formattedAmount}</strong>
                </p>`
              : ''
          }

          <p style="color: #444; line-height: 1.6; margin: 0 0 30px;">
            We'll send you another email once your order has shipped. In the meantime,
            feel free to reach out if you have any questions.
          </p>

          <!-- CTA -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a
              href="${process.env.NEXTAUTH_URL || 'https://essential-ivory.vercel.app'}/orders"
              style="
                display: inline-block;
                background: #111;
                color: #fff;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 6px;
                font-size: 16px;
                font-weight: bold;
              "
            >
              View My Orders
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 30px; background: #f4f4f4; text-align: center; color: #888; font-size: 13px;">
          <p style="margin: 0 0 4px;">Questions? Reply to this email — we're happy to help.</p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} EssentialRush. All rights reserved.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: `"EssentialRush" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });

  return { messageId: info.messageId };
}