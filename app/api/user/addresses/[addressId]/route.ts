export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import User from "@/models/usertemp";
import connectDB from "@/lib/mongodb";
import { sanitizeString } from "@/lib/sanitize";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Please sign in." }, { status: 401 });
    }

    const { addressId } = await params;
    const cleanAddressId = sanitizeString(addressId, 50);

    if (!cleanAddressId || !mongoose.Types.ObjectId.isValid(cleanAddressId)) {
      return NextResponse.json({ success: false, error: "Invalid address ID" }, { status: 400 });
    }

    const updatedUser: any = await (User as any).findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(userId),
        "addresses._id": new mongoose.Types.ObjectId(cleanAddressId),
      },
      {
        $pull: { addresses: { _id: new mongoose.Types.ObjectId(cleanAddressId) } },
      },
      { new: true }
    ).select("-password -__v").lean();

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: "Address not found or unauthorized." }, { status: 404 });
    }

    revalidatePath("/", "layout");
    return NextResponse.json({
      success: true,
      message: "Address removed.",
      data: { addresses: updatedUser.addresses || [] },
    });
  } catch (error) {
    console.error("Delete Address Error:", error);
    return NextResponse.json({ success: false, error: "Could not delete address." }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Please sign in." }, { status: 401 });
    }

    const { addressId } = await params;
    const cleanAddressId = sanitizeString(addressId, 50);
    if (!cleanAddressId || !mongoose.Types.ObjectId.isValid(cleanAddressId)) {
      return NextResponse.json({ success: false, error: "Invalid address ID" }, { status: 400 });
    }

    const body = await req.json();
    const type = sanitizeString(body?.type, 20) || "Home";
    const address = sanitizeString(body?.address, 200);
    const isDefault = Boolean(body?.isDefault);

    if (!address || address.length < 5) {
      return NextResponse.json({ success: false, error: "Please enter a valid address." }, { status: 400 });
    }

    const updatedUser: any = await (User as any).findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(userId),
        "addresses._id": new mongoose.Types.ObjectId(cleanAddressId),
      },
      {
        $set: {
          "addresses.$.type": type,
          "addresses.$.address": address,
          "addresses.$.isDefault": isDefault,
        },
      },
      { new: true }
    ).select("-password -__v").lean();

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: "Address not found." }, { status: 404 });
    }

    if (isDefault) {
      await (User as any).updateOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        { $set: { "addresses.$[other].isDefault": false } },
        { arrayFilters: [{ "other._id": { $ne: new mongoose.Types.ObjectId(cleanAddressId) } }] }
      );
    }

    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, message: "Address updated." });
  } catch (error) {
    console.error("Update Address Error:", error);
    return NextResponse.json({ success: false, error: "Could not update address." }, { status: 500 });
  }
}