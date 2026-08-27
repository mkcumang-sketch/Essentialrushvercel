export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import mongoose, { Model } from "mongoose";

// ======================================================
// DATABASE CONNECTION
// ======================================================

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  await mongoose.connect(
    process.env.MONGODB_URI as string
  );
};

// ======================================================
// USER TYPE
// ======================================================

interface IUser {
  _id?: mongoose.Types.ObjectId;

  email?: string;

  phone?: string;

  password?: string;

  createdAt?: Date;

  updatedAt?: Date;

  [key: string]: unknown;
}

// ======================================================
// USER SCHEMA
// ======================================================
//
// strict: false isliye rakha hai kyunki existing
// User collection mein additional fields ho sakte hain.
// ======================================================

const userSchema =
  new mongoose.Schema<IUser>(
    {
      email: {
        type: String,
        index: true,
      },

      phone: {
        type: String,
        index: true,
      },
    },
    {
      strict: false,
      timestamps: true,
    }
  );

// ======================================================
// TYPED USER MODEL
// ======================================================
//
// IMPORTANT:
// Ye TS2349 error fix karta hai jo
// User.findOne()
// User.findOneAndUpdate()
// par aa raha tha.
// ======================================================

const User =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>(
    "User",
    userSchema
  );

// ======================================================
// POST - SAVE / VERIFY PHONE
// ======================================================

export async function POST(
  req: Request
) {
  try {
    // ==================================================
    // 1. CONNECT DATABASE
    // ==================================================

    await connectDB();

    // ==================================================
    // 2. READ REQUEST BODY
    // ==================================================

    const body = await req.json();

    const email =
      typeof body.email === "string"
        ? body.email
            .trim()
            .toLowerCase()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    // ==================================================
    // 3. VALIDATE INPUT
    // ==================================================

    if (!email || !phone) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email and phone are required.",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 4. CHECK EXISTING PHONE
    // ==================================================
    //
    // Rule:
    // One phone number can only belong to one email.
    //
    // We search for a user having this phone number.
    // ==================================================

    const existingUserWithPhone =
      await User.findOne({
        phone: phone,
      })
        .select("-password -__v")
        .lean()
        .exec();

    // ==================================================
    // 5. CHECK PHONE OWNERSHIP
    // ==================================================

    if (
      existingUserWithPhone &&
      existingUserWithPhone.email &&
      existingUserWithPhone.email !== email
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This phone number is already linked to another Gmail account.",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 6. SAVE PHONE NUMBER
    // ==================================================
    //
    // If email already exists:
    // -> Update phone
    //
    // If email doesn't exist:
    // -> Create new user
    // ==================================================

    await User.findOneAndUpdate(
      {
        email: email,
      },
      {
        $set: {
          phone: phone,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    )
      .select("-password -__v")
      .lean()
      .exec();

    // ==================================================
    // 7. SUCCESS RESPONSE
    // ==================================================

    return NextResponse.json(
      {
        success: true,
        message:
          "Phone number saved.",
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    // ==================================================
    // 8. DUPLICATE KEY ERROR
    // ==================================================

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number })
        .code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This number is already registered.",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 9. SERVER ERROR
    // ==================================================

    console.error(
      "Phone Verification Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "We could not verify your phone.",
      },
      {
        status: 500,
      }
    );
  }
}