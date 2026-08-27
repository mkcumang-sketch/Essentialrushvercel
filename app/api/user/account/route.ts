export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import mongoose, { Model } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/usertemp";

// ======================================================
// TYPES
// ======================================================

interface IOrder {
  _id?: mongoose.Types.ObjectId;
  userId?: string | mongoose.Types.ObjectId;
  orderId?: string;
  createdAt?: Date;
  totalAmount?: number;
  status?: string;
  items?: unknown[];
  [key: string]: unknown;
}

interface IReview {
  _id?: mongoose.Types.ObjectId;
  userId?: string | mongoose.Types.ObjectId;
  createdAt?: Date;
  [key: string]: unknown;
}

interface ITicket {
  _id?: mongoose.Types.ObjectId;
  userId?: string | mongoose.Types.ObjectId;
  createdAt?: Date;
  [key: string]: unknown;
}

interface IProfile {
  _id?: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  phone?: string;
  createdAt?: Date;
  language?: string;
  currency?: string;

  walletPoints?: number;
  totalEarned?: number;
  totalSpent?: number;
  loyaltyTier?: string;

  myReferralCode?: string;

  coupons?: unknown[];
  wishlist?: unknown[];
  recentlyViewed?: unknown[];
  notifications?: unknown[];
  loginHistory?: unknown[];

  [key: string]: unknown;
}

// ======================================================
// SCHEMAS
// ======================================================

// Empty schemas are intentional because these collections
// may contain dynamic fields and existing database structures.

const orderSchema = new mongoose.Schema<IOrder>(
  {},
  {
    strict: false,
  }
);

const reviewSchema = new mongoose.Schema<IReview>(
  {},
  {
    strict: false,
  }
);

const ticketSchema = new mongoose.Schema<ITicket>(
  {},
  {
    strict: false,
  }
);

// ======================================================
// MODELS
// ======================================================

// Explicitly typing each model prevents TS2349
// "This expression is not callable" union errors.

const OrderModel =
  (mongoose.models.Order as Model<IOrder>) ||
  mongoose.model<IOrder>("Order", orderSchema);

const ReviewModel =
  (mongoose.models.Review as Model<IReview>) ||
  mongoose.model<IReview>("Review", reviewSchema);

const TicketModel =
  (mongoose.models.Ticket as Model<ITicket>) ||
  mongoose.model<ITicket>("Ticket", ticketSchema);

// ======================================================
// GET - USER ACCOUNT DASHBOARD
// ======================================================

export async function GET() {
  try {
    // ==================================================
    // 1. CONNECT DATABASE
    // ==================================================

    await connectDB();

    // ==================================================
    // 2. GET CURRENT SESSION
    // ==================================================

    const session = await getServerSession(authOptions);

    // ==================================================
    // 3. GET USER ID
    // ==================================================

    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Please sign in to view your account.",
        },
        {
          status: 401,
        }
      );
    }

    // ==================================================
    // 4. FIND USER PROFILE
    // ==================================================

    const profileRaw = await User.findById(userId)
      .select("-password -__v")
      .lean();

    if (!profileRaw || Array.isArray(profileRaw)) {
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

    // Convert dynamic User document into flexible object
    const profile = profileRaw as unknown as IProfile;

    // ==================================================
    // 5. GET USER ORDERS
    // ==================================================

    // IMPORTANT:
    // Only fetch orders belonging to the logged-in user.
    // This prevents other users' orders from appearing.

    const orders = await OrderModel.find({
      userId: userId,
    })
      .sort({
        createdAt: -1,
      })
      .lean()
      .exec();

    // ==================================================
    // 6. CALCULATE SUCCESSFUL ORDERS
    // ==================================================

    const successfulStatuses = [
      "PROCESSING",
      "DISPATCHED",
      "DELIVERED",
    ];

    const successfulOrders = orders.filter((order) => {
      const status = String(order.status || "").toUpperCase();

      return successfulStatuses.includes(status);
    });

    // ==================================================
    // 7. CALCULATE TOTAL SPENT
    // ==================================================

    const totalSpent = successfulOrders.reduce(
      (sum, order) => {
        return sum + (Number(order.totalAmount) || 0);
      },
      0
    );

    // ==================================================
    // 8. CALCULATE LOYALTY TIER
    // ==================================================

    const tier =
      totalSpent >= 100000
        ? "Gold Vault"
        : "Silver Vault";

    // ==================================================
    // 9. UPDATE USER LOYALTY INFORMATION
    // ==================================================

    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          totalSpent,
          loyaltyTier: tier,
        },
      },
      {
        new: false,
      }
    );

    // ==================================================
    // 10. GET USER REVIEWS
    // ==================================================

    const reviews = await ReviewModel.find({
      userId: userId,
    })
      .sort({
        createdAt: -1,
      })
      .lean()
      .exec();

    // ==================================================
    // 11. GET USER SUPPORT TICKETS
    // ==================================================

    const tickets = await TicketModel.find({
      userId: userId,
    })
      .sort({
        createdAt: -1,
      })
      .lean()
      .exec();

    // ==================================================
    // 12. BUILD DASHBOARD DATA
    // ==================================================

    const dashboardData = {
      profile: {
        name:
          profile.name ||
          session.user?.name ||
          "",

        email:
          session.user?.email ||
          profile.email ||
          "",

        phone:
          profile.phone ||
          "",

        tier,

        totalSpent,

        memberSince:
          profile.createdAt ||
          new Date(),

        language:
          profile.language ||
          "English",

        currency:
          profile.currency ||
          "INR",
      },

      // ==================================================
      // ASSETS
      // ==================================================

      assets: {
        walletBalance:
          Number(profile.walletPoints) || 0,

        rewardPoints:
          Number(profile.walletPoints) || 0,

        referralCode:
          profile.myReferralCode ||
          `VIP-${String(userId)
            .slice(-6)
            .toUpperCase()}`,

        referralEarnings:
          Number(profile.totalEarned) || 0,

        activeCoupons:
          Array.isArray(profile.coupons)
            ? profile.coupons
            : [],
      },

      // ==================================================
      // COLLECTIONS
      // ==================================================

      collections: {
        wishlist:
          Array.isArray(profile.wishlist)
            ? profile.wishlist
            : [],

        recentlyViewed:
          Array.isArray(profile.recentlyViewed)
            ? profile.recentlyViewed
            : [],

        recommendations: [],
      },

      // ==================================================
      // ORDERS
      // ==================================================

      orders: orders.map((order) => ({
        id:
          order.orderId ||
          order._id?.toString() ||
          "",

        date:
          order.createdAt ||
          null,

        total:
          Number(order.totalAmount) || 0,

        status:
          order.status ||
          "PENDING",

        items:
          Array.isArray(order.items)
            ? order.items
            : [],
      })),

      // ==================================================
      // ACTIVITY
      // ==================================================

      activity: {
        reviews,

        tickets,

        notifications:
          Array.isArray(profile.notifications)
            ? profile.notifications
            : [],
      },

      // ==================================================
      // SECURITY
      // ==================================================

      security: {
        loginHistory:
          Array.isArray(profile.loginHistory) &&
          profile.loginHistory.length > 0
            ? profile.loginHistory
            : [
                {
                  device: "Current Device",
                  date: new Date(),
                  ip: "Secured",
                },
              ],
      },
    };

    // ==================================================
    // 13. RETURN SUCCESS RESPONSE
    // ==================================================

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    // ==================================================
    // ERROR HANDLING
    // ==================================================

    console.error(
      "Vault Aggregation Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "We could not load your account. Try again.",
      },
      {
        status: 500,
      }
    );
  }
}