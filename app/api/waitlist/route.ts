export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import mongoose, { Model } from "mongoose";
import connectDB from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ======================================================
// TYPES
// ======================================================

interface ICartItem {
  productId: string;
  productName?: string;
}

interface ILead {
  _id?: mongoose.Types.ObjectId;

  phone?: string;

  userId?:
    | string
    | mongoose.Types.ObjectId;

  cartItems?: ICartItem[];

  status?: string;

  lastActive?: Date;

  createdAt?: Date;

  updatedAt?: Date;

  [key: string]: unknown;
}

// ======================================================
// TYPED LEAD MODEL
// ======================================================
//
// This fixes Mongoose TypeScript errors around:
//
// Lead.create()
// Lead.find()
// Lead.findOne()
// Lead.findOneAndUpdate()
//
// ======================================================

const LeadModel =
  Lead as unknown as Model<ILead>;

// ======================================================
// POST - JOIN WAITLIST
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
    // 2. GET SESSION
    // ==================================================

    const session =
      await getServerSession(
        authOptions
      );

    // ==================================================
    // 3. READ REQUEST BODY
    // ==================================================

    const body = await req.json();

    const productId =
      typeof body.productId === "string"
        ? body.productId.trim()
        : "";

    const productName =
      typeof body.productName === "string"
        ? body.productName.trim()
        : "";

    // ==================================================
    // 4. VALIDATE PRODUCT ID
    // ==================================================

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product ID is required",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 5. GET USER INFORMATION
    // ==================================================

    const sessionUser =
      session?.user;

    const userId =
      sessionUser?.id || undefined;

    // ==================================================
    // PHONE
    // ==================================================
    //
    // Your NextAuth session may not have "phone"
    // in its TypeScript type.
    //
    // Therefore we safely read it here.
    // ==================================================

    const phone =
      typeof (
        sessionUser as
          | (typeof sessionUser & {
              phone?: unknown;
            })
          | null
          | undefined
      )?.phone === "string"
        ? (
            sessionUser as {
              phone?: string;
            }
          ).phone?.trim() || "N/A"
        : "N/A";

    // ==================================================
    // 6. CREATE WAITLIST ENTRY
    // ==================================================

    const newWaitlistEntry =
      await LeadModel.create({
        phone,

        ...(userId
          ? {
              userId,
            }
          : {}),

        cartItems: [
          {
            productId,
            productName:
              productName ||
              undefined,
          },
        ],

        status: "PENDING",

        lastActive: new Date(),
      });

    // ==================================================
    // 7. SUCCESS RESPONSE
    // ==================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "You have been added to the exclusive waitlist. We will contact you soon.",

        data: newWaitlistEntry,
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    // ==================================================
    // 8. ERROR HANDLING
    // ==================================================

    console.error(
      "Waitlist API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to join waitlist. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}