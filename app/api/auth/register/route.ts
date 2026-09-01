import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/usertemp";
import bcrypt from "bcryptjs";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { validatePasswordStrength, sanitizeString, sanitizeEmail } from "@/lib/sanitize";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";

  try {
    // 🛡️ 1. Rate Limiting Protection (Auth Tier: 5 attempts/min)
    const rateLimit = await checkRateLimit(ip, "auth");
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 🛡️ 2. LPDoS Protection: Payload size check (Max 10KB)
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 10 * 1024) {
      return NextResponse.json(
        { success: false, error: "Payload too large." },
        { status: 413, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await req.json();

    // 🛡️ 3. Input Sanitization & Type Safety
    const name = sanitizeString(body?.name, 60);
    const rawInput = sanitizeString(body?.phone || body?.email, 100);
    const rawPassword = typeof body?.password === "string" ? body.password : "";

    if (!rawInput) {
      return NextResponse.json(
        { success: false, error: "Please enter your Email or Phone number." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 🛡️ 4. Exact 8-Character Password Complexity Validation
    const passwordCheck = validatePasswordStrength(rawPassword);
    if (!passwordCheck.isValid) {
      return NextResponse.json(
        { success: false, error: passwordCheck.error },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const isEmail = rawInput.includes("@");
    let userEmail: string;
    let userPhone: string | null = null;

    if (isEmail) {
      userEmail = sanitizeEmail(rawInput);
      if (!userEmail) {
        return NextResponse.json(
          { success: false, error: "Invalid email format." },
          { status: 400, headers: getRateLimitHeaders(rateLimit) }
        );
      }
    } else {
      userPhone = rawInput.replace(/[^\d+]/g, "").slice(0, 15);
      if (!userPhone || userPhone.length < 10) {
        return NextResponse.json(
          { success: false, error: "Invalid phone number format." },
          { status: 400, headers: getRateLimitHeaders(rateLimit) }
        );
      }
      userEmail = `${userPhone}@vault.essentialrush.com`;
    }

    await connectDB();

    // 🛡️ 5. Safe Query with $eq operators to prevent query object injection
    const existingUser = await User.findOne({
      $or: [
        { email: { $eq: userEmail } },
        ...(userPhone ? [{ phone: { $eq: userPhone } }] : []),
      ],
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with these details already exists. Please log in." },
        { status: 409, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    const newUser = await User.create({
      name: name || "Vault Member",
      email: userEmail,
      phone: userPhone,
      password: hashedPassword,
      role: "USER",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully. Please log in.",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
        },
      },
      { status: 201, headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error: any) {
    console.error("Registration Error:", error.message);
    return NextResponse.json(
      { success: false, error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}