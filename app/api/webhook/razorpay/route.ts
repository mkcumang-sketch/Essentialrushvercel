import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose, {
  Model,
  Schema,
} from "mongoose";

import connectDB from "@/lib/mongodb";
import { Product } from "@/models/Product";
import User from "@/models/usertemp";
import { sendOrderConfirmationEmail } from "@/lib/mail";

// ======================================================
// NEXT.JS CONFIG
// ======================================================

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// ======================================================
// TYPES
// ======================================================

interface OrderItem {
  productId?: string;
  qty?: number;
  name?: string;
  title?: string;
  [key: string]: unknown;
}

interface ShippingData {
  email?: string;
  name?: string;
  phone?: string;
  [key: string]: unknown;
}

interface OrderDocument {
  _id: mongoose.Types.ObjectId;

  orderId?: string;

  razorpayOrderId?: string;

  razorpayPaymentId?: string;

  status?: string;

  userId?: mongoose.Types.ObjectId | string;

  appliedReferralCode?: string;

  totalAmount?: number;

  items?: OrderItem[];

  shippingData?: ShippingData;

  [key: string]: unknown;
}

// ======================================================
// ORDER MODEL
// ======================================================
//
// strict: false allows existing Order collection
// to contain additional fields.
//
// Explicit Model<OrderDocument> typing fixes
// Mongoose TypeScript union / findOne errors.
//

const orderSchema = new Schema<OrderDocument>(
  {
    orderId: {
      type: String,
      index: true,
    },

    razorpayOrderId: {
      type: String,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
    },

    status: {
      type: String,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    appliedReferralCode: {
      type: String,
    },

    totalAmount: {
      type: Number,
    },

    shippingData: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    strict: false,
    timestamps: true,
  }
);

const OrderModel: Model<OrderDocument> =
  (mongoose.models.Order as Model<OrderDocument>) ||
  mongoose.model<OrderDocument>(
    "Order",
    orderSchema
  );

// ======================================================
// POST - RAZORPAY WEBHOOK
// ======================================================

export async function POST(
  req: Request
) {
  try {
    // ==================================================
    // 1. READ RAW WEBHOOK BODY
    // ==================================================

    const body =
      await req.text();

    // ==================================================
    // 2. GET RAZORPAY SIGNATURE
    // ==================================================

    const signature =
      req.headers.get(
        "x-razorpay-signature"
      );

    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing Razorpay webhook signature",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 3. GET WEBHOOK SECRET
    // ==================================================

    const secret =
      process.env
        .RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error(
        "RAZORPAY_WEBHOOK_SECRET is not defined"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Webhook secret missing",
        },
        {
          status: 500,
        }
      );
    }

    // ==================================================
    // 4. VERIFY WEBHOOK SIGNATURE
    // ==================================================

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          secret
        )
        .update(body)
        .digest("hex");

    const signaturesMatch =
      crypto.timingSafeEqual(
        Buffer.from(
          expectedSignature,
          "utf8"
        ),
        Buffer.from(
          signature,
          "utf8"
        )
      );

    if (!signaturesMatch) {
      console.error(
        "Invalid Razorpay Webhook Signature"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid signature",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 5. PARSE WEBHOOK
    // ==================================================

    let event: any;

    try {
      event =
        JSON.parse(body);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid webhook JSON",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 6. ONLY HANDLE PAYMENT CAPTURED
    // ==================================================

    if (
      event.event !==
      "payment.captured"
    ) {
      return NextResponse.json(
        {
          received: true,
        },
        {
          status: 200,
        }
      );
    }

    // ==================================================
    // 7. CONNECT DATABASE
    // ==================================================

    await connectDB();

    // ==================================================
    // 8. EXTRACT PAYMENT DATA
    // ==================================================

    const payment =
      event?.payload
        ?.payment
        ?.entity;

    if (!payment) {
      console.error(
        "Razorpay payment entity missing"
      );

      return NextResponse.json(
        {
          received: true,
        },
        {
          status: 200,
        }
      );
    }

    const rzpOrderId =
      payment.order_id;

    const rzpPaymentId =
      payment.id;

    if (
      !rzpOrderId ||
      !rzpPaymentId
    ) {
      console.error(
        "Razorpay Order ID or Payment ID missing"
      );

      return NextResponse.json(
        {
          received: true,
        },
        {
          status: 200,
        }
      );
    }

    // ==================================================
    // 9. FIND ORDER
    // ==================================================

    const order =
      await OrderModel
        .findOne({
          razorpayOrderId:
            String(rzpOrderId),
        })
        .exec();

    // ==================================================
    // 10. ORDER NOT FOUND
    // ==================================================

    if (!order) {
      console.error(
        "Order not found for Razorpay Order ID:",
        rzpOrderId
      );

      // Return 200 so Razorpay doesn't repeatedly retry
      // a webhook for an order that doesn't exist.
      return NextResponse.json(
        {
          received: true,
          message:
            "Order not found",
        },
        {
          status: 200,
        }
      );
    }

    // ==================================================
    // 11. IDEMPOTENCY CHECK
    // ==================================================
    //
    // Razorpay may send the same webhook more than once.
    // Don't deduct stock or give referral rewards twice.
    //

    if (
      order.status ===
        "PAID" ||
      order.razorpayPaymentId
    ) {
      return NextResponse.json(
        {
          received: true,
          message:
            "Webhook already processed",
        },
        {
          status: 200,
        }
      );
    }

    // ==================================================
    // 12. UPDATE ORDER
    // ==================================================

    order.status =
      "PAID";

    order.razorpayPaymentId =
      String(rzpPaymentId);

    await order.save();

    // ==================================================
    // 13. DEDUCT STOCK
    // ==================================================

    const items =
      Array.isArray(
        order.items
      )
        ? order.items
        : [];

    for (
      const item of items
    ) {
      if (
        !item.productId
      ) {
        continue;
      }

      const quantity =
        Number(
          item.qty
        ) || 0;

      if (
        quantity <= 0
      ) {
        continue;
      }

      try {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              stock:
                -quantity,

              totalSold:
                quantity,
            },
          }
        ).exec();
      } catch (
        stockError
      ) {
        console.error(
          "Stock update failed:",
          stockError
        );
      }
    }

    // ==================================================
    // 14. REFERRAL REWARD
    // ==================================================

    const referralCode =
      typeof order.appliedReferralCode ===
      "string"
        ? order.appliedReferralCode
            .trim()
            .toUpperCase()
        : "";

    if (
      referralCode &&
      referralCode.startsWith(
        "REF-"
      )
    ) {
      try {
        const referrer =
          await User.findOne({
            myReferralCode:
              referralCode,
          }).exec();

        if (
          referrer &&
          String(
            referrer._id
          ) !==
            String(
              order.userId
            )
        ) {
          await User.findByIdAndUpdate(
            referrer._id,
            {
              $inc: {
                walletPoints: 100,

                totalReferrals: 1,

                totalEarned: 100,
              },

              $push: {
                notifications: {
                  title:
                    "Referral Reward!",

                  desc:
                    "You earned ₹100 from a successful order by a referral.",

                  unread: true,

                  time:
                    new Date(),
                },
              },
            }
          ).exec();
        }
      } catch (
        referralError
      ) {
        console.error(
          "Referral reward failed:",
          referralError
        );
      }
    }

    // ==================================================
    // 15. SEND ORDER CONFIRMATION EMAIL
    // ==================================================

    try {
      const shippingData =
        order.shippingData ||
        {};

      const email =
        typeof shippingData.email ===
        "string"
          ? shippingData.email
          : "";

      if (email) {
        await sendOrderConfirmationEmail(
          email,
          {
            orderId:
              order.orderId ||
              String(
                order._id
              ),

            customerName:
              shippingData.name ||
              "Valued Customer",

            totalAmount:
              Number(
                order.totalAmount
              ) || 0,

            items:
              items,
          }
        );
      } else {
        console.warn(
          "Order confirmation email skipped: email not found"
        );
      }
    } catch (
      mailError
    ) {
      // Email failure should not make
      // Razorpay webhook fail.
      console.error(
        "Confirmation email failed:",
        mailError
      );
    }

    // ==================================================
    // 16. SUCCESS
    // ==================================================

    return NextResponse.json(
      {
        received: true,

        message:
          "Razorpay payment processed successfully",
      },
      {
        status: 200,
      }
    );

  } catch (
    error: unknown
  ) {
    // ==================================================
    // ERROR HANDLING
    // ==================================================

    console.error(
      "Razorpay Webhook Error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Webhook processing failed";

    return NextResponse.json(
      {
        success: false,
        error:
          errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}