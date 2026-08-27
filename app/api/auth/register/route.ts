import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/usertemp";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, password } = body;
    
    // Check if input is passed as 'phone', 'email', or generic identifier
    const rawInput = (body.phone || body.email || "").trim();

    if (!rawInput) {
      return NextResponse.json(
        { success: false, error: "Please enter your Email or Phone number." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const isEmail = rawInput.includes("@");
    let userEmail: string;
    let userPhone: string | null = null;

    if (isEmail) {
      userEmail = rawInput.toLowerCase();
    } else {
      userPhone = rawInput.replace(/[^\d+]/g, "");
      // Agar user ne phone se register kiya hai, toh schema requirement satisfy karne ke liye temporary unique email assign karein
      userEmail = `${userPhone}@vault.essentialrush.com`;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: userEmail },
        ...(userPhone ? [{ phone: userPhone }] : []),
      ],
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with these details already exists. Please log in." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name: name?.trim() || "Vault Member",
      email: userEmail,
      phone: userPhone,
      password: hashedPassword,
      role: "USER",
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully. Please log in.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
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