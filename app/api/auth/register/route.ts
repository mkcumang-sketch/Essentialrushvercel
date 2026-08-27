import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/usertemp";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name, phone, email, password } = await req.json();

    const cleanPhone = phone ? phone.trim().replace(/[^\d+]/g, "") : "";
    const cleanEmail = email ? email.trim().toLowerCase() : "";

    if (!cleanPhone && !cleanEmail) {
      return NextResponse.json(
        { success: false, error: "Phone number is required." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Check existing phone
    if (cleanPhone) {
      const existingPhone = await User.findOne({ phone: cleanPhone });
      if (existingPhone) {
        return NextResponse.json(
          { success: false, error: "This phone number is already registered. Please log in." },
          { status: 409 }
        );
      }
    }

    // Check existing email
    if (cleanEmail) {
      const existingEmail = await User.findOne({ email: cleanEmail });
      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: "This email is already registered." },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name: name?.trim() || "Vault Member",
      phone: cleanPhone || null,
      email: cleanEmail || null,
      password: hashedPassword,
      role: "USER",
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully. Please log in.",
      user: {
        id: newUser._id,
        name: newUser.name,
        phone: newUser.phone,
      },
    });
  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}