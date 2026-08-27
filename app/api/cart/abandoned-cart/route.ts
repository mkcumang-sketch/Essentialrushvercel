import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AbandonedCart from "@/models/AbandonedCart"; // Path check kar lein

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name, email, phone, items, cartTotal, checkoutStep, status } = await req.json();

    const cleanPhone = phone ? phone.trim().replace(/[^\d+]/g, "") : "";
    const cleanEmail = email ? email.trim().toLowerCase() : "";

    if (!cleanPhone && !cleanEmail) {
      return NextResponse.json(
        { success: false, error: "Phone number or email is required." },
        { status: 400 }
      );
    }

    // Existing open cart check (by phone or email)
    const query = cleanPhone ? { phone: cleanPhone } : { email: cleanEmail };

    const cartRecord = await AbandonedCart.findOneAndUpdate(
      query,
      {
        $set: {
          name: name?.trim() || "Vault Client",
          email: cleanEmail,
          phone: cleanPhone,
          items: items || [],
          cartTotal: Number(cartTotal) || 0,
          checkoutStep: checkoutStep || "CONTACT",
          status: status || "ABANDONED",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      cartId: cartRecord._id,
      message: "Abandoned cart state synchronized.",
    });
  } catch (error: any) {
    console.error("Abandoned Cart Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}