export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose, { Model } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/usertemp";

// ======================================================
// USER TYPE
// ======================================================

interface IUserData {
  _id?: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  phone?: string;
  walletPoints?: number;
  totalEarned?: number;
  loyaltyTier?: string;

  [key: string]: unknown;
}

// ======================================================
// ORDER TYPE
// ======================================================

interface IOrder {
  _id?: mongoose.Types.ObjectId;

  userId?:
    | string
    | mongoose.Types.ObjectId;

  orderId?: string;

  trackingId?: string;

  status?: string;

  totalAmount?: number;

  createdAt?: Date;

  items?: unknown[];

  shippingData?: {
    email?: string;
    phone?: string;
    [key: string]: unknown;
  };

  customer?: {
    email?: string;
    phone?: string;
    [key: string]: unknown;
  };

  [key: string]: unknown;
}

// ======================================================
// ORDER SCHEMA
// ======================================================
//
// strict:false rakha hai kyunki aapke existing Order
// documents mein dynamic fields ho sakte hain.
// ======================================================

const orderSchema =
  new mongoose.Schema<IOrder>(
    {},
    {
      strict: false,
    }
  );

// ======================================================
// TYPED ORDER MODEL
// ======================================================
//
// IMPORTANT:
// Ye TS2349 error ko fix karta hai:
//
// "This expression is not callable"
// "Each member of the union type..."
// ======================================================

const Order =
  (mongoose.models.Order as Model<IOrder>) ||
  mongoose.model<IOrder>(
    "Order",
    orderSchema
  );

// ======================================================
// GET
// ======================================================

export async function GET(
  req: Request
) {
  return POST(req);
}

// ======================================================
// POST
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
    // 2. GET SERVER SESSION
    // ==================================================

    const session =
      await getServerSession(
        authOptions
      );

    // ==================================================
    // 3. GET SESSION USER ID
    // ==================================================

    const sessionUserId =
      session?.user?.id;

    // ==================================================
    // 4. SECURITY CHECK
    // ==================================================

    if (!sessionUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // ==================================================
    // 5. GET FRESH USER FROM DATABASE
    // ==================================================
    //
    // We don't completely trust old JWT/session data.
    // Database data is treated as the latest user data.
    // ==================================================

    const dbUserRaw =
      await User.findById(
        sessionUserId
      )
        .lean()
        .exec();

    if (!dbUserRaw) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    // ==================================================
    // 6. TYPE USER DATA
    // ==================================================
    //
    // This fixes errors like:
    //
    // Property 'phone' does not exist
    // Property 'email' does not exist
    //
    // because your existing User model's TypeScript
    // definition doesn't expose these dynamic fields.
    // ==================================================

    const dbUser =
      dbUserRaw as unknown as IUserData;

    // ==================================================
    // 7. GET USER EMAIL
    // ==================================================

    const userEmail =
      typeof dbUser.email ===
      "string"
        ? dbUser.email
            .trim()
            .toLowerCase()
        : session.user?.email
          ? session.user.email
              .trim()
              .toLowerCase()
          : "";

    // ==================================================
    // 8. GET USER PHONE
    // ==================================================

    const userPhone =
      typeof dbUser.phone ===
      "string"
        ? dbUser.phone.trim()
        : "";

    // ==================================================
    // 9. BUILD ORDER SEARCH QUERY
    // ==================================================
    //
    // We search using:
    //
    // 1. Logged-in user's userId
    // 2. Shipping email
    // 3. Customer email
    // 4. Shipping phone
    // 5. Customer phone
    //
    // This helps find both registered and older
    // guest orders connected to the same identity.
    // ==================================================

    const orConditions: Record<
      string,
      unknown
    >[] = [
      {
        userId: sessionUserId,
      },
    ];

    // ==================================================
    // 10. EMAIL MATCHING
    // ==================================================

    if (userEmail) {
      orConditions.push(
        {
          "shippingData.email":
            userEmail,
        },
        {
          "customer.email":
            userEmail,
        }
      );
    }

    // ==================================================
    // 11. PHONE MATCHING
    // ==================================================

    if (userPhone) {
      orConditions.push(
        {
          "shippingData.phone":
            userPhone,
        },
        {
          "customer.phone":
            userPhone,
        }
      );
    }

    // ==================================================
    // 12. FIND USER ORDERS
    // ==================================================

    const userOrders =
      await Order.find({
        $or: orConditions,
      })
        .sort({
          createdAt: -1,
        })
        .lean()
        .exec();

    // ==================================================
    // 13. GENERATE REFERRAL CODE
    // ==================================================

    const firstName =
      typeof dbUser.name ===
      "string"
        ? dbUser.name
            .trim()
            .split(" ")[0]
        : session.user?.name
          ? session.user.name
              .trim()
              .split(" ")[0]
          : "VIP";

    const safeFirstName =
      firstName
        .replace(
          /[^a-zA-Z0-9]/g,
          ""
        )
        .toUpperCase() ||
      "VIP";

    const generatedRefCode =
      `REF-${safeFirstName}10`;

    // ==================================================
    // 14. CALCULATE TOTAL SPENT
    // ==================================================

    const totalSpent =
      userOrders.reduce(
        (
          sum: number,
          order: IOrder
        ) => {
          return (
            sum +
            (Number(
              order.totalAmount
            ) || 0)
          );
        },
        0
      );

    // ==================================================
    // 15. GET WALLET POINTS
    // ==================================================

    const walletPoints =
      Number(
        dbUser.walletPoints
      ) || 0;

    // ==================================================
    // 16. GET TOTAL EARNED
    // ==================================================

    const totalEarned =
      Number(
        dbUser.totalEarned
      ) || 0;

    // ==================================================
    // 17. GET LOYALTY TIER
    // ==================================================

    const loyaltyTier =
      typeof dbUser.loyaltyTier ===
      "string"
        ? dbUser.loyaltyTier
        : "Silver Vault";

    // ==================================================
    // 18. RETURN RESPONSE
    // ==================================================

    return NextResponse.json(
      {
        success: true,

        data: {
          orders: userOrders,

          walletPoints,

          totalEarned,

          loyaltyTier,

          myReferralCode:
            generatedRefCode,

          totalSpent,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    // ==================================================
    // ERROR HANDLING
    // ==================================================

    console.error(
      "Dashboard API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Server Error",
      },
      {
        status: 500,
      }
    );
  }
}