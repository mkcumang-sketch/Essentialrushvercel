import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/usertemp";
import bcrypt from "bcryptjs";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";

  try {
    // 🛡️ 1. Rate Limiting Protection (Auth Tier)
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

    // 🛡️ 3. NoSQL Injection & Type Safety: Force primitive strings
    const name = String(body?.name || "").trim().slice(0, 60);
    const rawInput = String(body?.phone || body?.email || "").trim();
    const password = String(body?.password || "");

    if (!rawInput) {
      return NextResponse.json(
        { success: false, error: "Please enter your Email or Phone number." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    if (!password || password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { success: false, error: "Password must be between 6 and 128 characters." },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const isEmail = rawInput.includes("@");
    let userEmail: string;
    let userPhone: string | null = null;

    if (isEmail) {
      userEmail = rawInput.toLowerCase().slice(0, 100);
    } else {
      userPhone = rawInput.replace(/[^\d+]/g, "").slice(0, 15);
      if (!userPhone) {
        return NextResponse.json(
          { success: false, error: "Invalid phone number format." },
          { status: 400, headers: getRateLimitHeaders(rateLimit) }
        );
      }
      userEmail = `${userPhone}@vault.essentialrush.com`;
    }

    await connectDB();

    // 🛡️ 4. Safe Query with $eq operators to prevent query object injection
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

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name: name || "Vault Member",
      email: userEmail,
      phone: userPhone,
      password: hashedPassword,
      role: "USER",
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully. Please log in.",
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
      },
    }, { status: 201, headers: getRateLimitHeaders(rateLimit) });
  } catch (error: any) {
    console.error("Registration Error:", error.message);
    return NextResponse.json(
      { success: false, error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}