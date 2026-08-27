import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/usertemp";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, phone } = await req.json();

    if (!phone || phone.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit phone number." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Email missing from session." },
        { status: 401 }
      );
    }

    // Clean phone number (remove spaces and non-digits except '+')
    const sanitizedPhone = phone.trim().replace(/[^\d+]/g, "");

    // Check if another account is already using this phone number
    const existingUserWithPhone = await User.findOne({ 
      phone: sanitizedPhone, 
      email: { $ne: email.toLowerCase() } 
    });

    if (existingUserWithPhone) {
      return NextResponse.json(
        { success: false, error: "This phone number is already registered with another account." },
        { status: 409 }
      );
    }

    // Update the authenticated user's phone number
    const updatedUser = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { phone: sanitizedPhone } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User account not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Phone number updated successfully.",
      phone: updatedUser.phone
    });

  } catch (error: any) {
    console.error("Phone verification error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}