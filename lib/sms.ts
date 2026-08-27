// lib/sms.ts - Enterprise Messaging Wrapper
export async function sendRecoverySMS(phone: string, name: string, offerLink: string, discount: string) {
  const message = `Adab ${name}, ♞\n\nAppka pasandida asset vault mein intezar kar raha hai. Sirf aapke liye, humne ${discount} ka special allocation discount unlock kiya hai.\n\nIsey yahan se secure karein: ${offerLink}\n\n- Essential Rush Imperial`;

  // 🚨 Real World Integration (Example: Twilio / Msg91)
  try {
    const res = await fetch('https://api.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'authkey': process.env.MSG91_AUTH_KEY!,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        template_id: "RECOVERY_TEMPLATE_ID",
        short_url: "1",
        recipients: [{ mobiles: phone, name, discount, link: offerLink }]
      })
    });
    return res.ok;
  } catch (error) {
    console.error("SMS Gateway Timeout:", error);
    return false;
  }
}

// VIP SMS: Uses MSG91 Text SMS API (v2) to send a fully custom message.
// This is intentionally additive: it will not affect your existing recovery flow.
export async function sendVIPSMS(phone: string, name: string, link: string) {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) return false;

  const digits = (phone || "").replace(/[^0-9]/g, "");
  const mobiles = digits.length === 10 ? `91${digits}` : digits;

  if (!mobiles) return false;

  const message = `Dear ${name || "Client"}, your curated selection has been safely secured in our private vault. Tap here to complete your exclusive acquisition: ${link}`;

  // MSG91 Text SMS API expects these fields.
  const sender = process.env.MSG91_SENDER_ID || "ESSRUSH";
  const route = process.env.MSG91_ROUTE || "4";

  try {
    const res = await fetch("https://api.msg91.com/api/v2/sendsms", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        authkey: authKey,
        mobiles,
        message,
        sender,
        route,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}