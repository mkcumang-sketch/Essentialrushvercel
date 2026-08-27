import nodemailer from 'nodemailer';

interface VipRecoveryEmailOptions {
  to: string;
  customerName: string;
  link: string;
}

export async function sendVipRecoveryEmail(
  options: VipRecoveryEmailOptions
): Promise<void> {
  const { to, customerName, link } = options;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>You left something behind</title>
    </head>
    <body style="font-family: Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background: #111; padding: 30px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">EssentialRush</h1>
          <p style="color: #aaa; margin: 8px 0 0;">VIP Recovery</p>
        </div>

        <!-- Body -->
        <div style="padding: 36px 30px;">
          <p style="font-size: 16px; margin: 0 0 12px;">Hi <strong>${customerName}</strong>,</p>

          <p style="color: #444; line-height: 1.6; margin: 0 0 20px;">
            We noticed you left some items in your cart. As a valued client, we wanted to personally
            reach out and make sure you don't miss out.
          </p>

          <p style="color: #444; line-height: 1.6; margin: 0 0 30px;">
            Your cart is saved and ready whenever you are. Click below to pick up right where you left off:
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a
              href="${link}"
              style="
                display: inline-block;
                background: #111;
                color: #fff;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 6px;
                font-size: 16px;
                font-weight: bold;
                letter-spacing: 0.5px;
              "
            >
              Return to My Cart
            </a>
          </div>

          <p style="color: #888; font-size: 13px; text-align: center; margin: 0;">
            If the button doesn't work, copy and paste this link into your browser:<br />
            <a href="${link}" style="color: #555;">${link}</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 30px; background: #f4f4f4; text-align: center; color: #888; font-size: 13px;">
          <p style="margin: 0 0 4px;">Questions? Reply to this email — we're here to help.</p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} EssentialRush. All rights reserved.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"EssentialRush" <${process.env.SMTP_USER}>`,
    to,
    subject: `${customerName}, you left something behind 👀`,
    html,
  });
}