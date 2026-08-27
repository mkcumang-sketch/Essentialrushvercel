
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { UserBehavior } from "@/models/UserBehavior";

/* =========================================================
   TYPES
========================================================= */

interface CartRequestBody {
    items?: unknown;
    cart?: unknown;
}

/* =========================================================
   NO CACHE HEADERS
========================================================= */

const noCacheHeaders = {
    "Cache-Control":
        "no-store, max-age=0, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
};

/* =========================================================
   GET
   Fetch saved cart for logged-in user
========================================================= */

export async function GET() {
    try {
        /* ---------------------------------------------
           Get logged-in user session
        --------------------------------------------- */

        const session =
            await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    success: false,
                    items: [],
                },
                {
                    status: 401,
                    headers: noCacheHeaders,
                }
            );
        }

        /* ---------------------------------------------
           Connect MongoDB
        --------------------------------------------- */

        await connectDB();

        /* ---------------------------------------------
           Find UserBehavior document
        --------------------------------------------- */

        const behavior =
            await UserBehavior.findOne({
                userId: session.user.id,
            })
                .lean()
                .exec();

        /* ---------------------------------------------
           UserBehavior not found
        --------------------------------------------- */

        if (!behavior) {
            return NextResponse.json(
                {
                    success: true,
                    items: [],
                },
                {
                    status: 200,
                    headers: noCacheHeaders,
                }
            );
        }

        /* ---------------------------------------------
           Return saved cart
        --------------------------------------------- */

        return NextResponse.json(
            {
                success: true,
                items: behavior.cartAbandons || [],
            },
            {
                status: 200,
                headers: noCacheHeaders,
            }
        );
    } catch (error) {
        console.error(
            "GET Cart Error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                items: [],
                message:
                    "Failed to fetch cart",
            },
            {
                status: 500,
                headers: noCacheHeaders,
            }
        );
    }
}

/* =========================================================
   POST
   Save / Sync cart for logged-in user
========================================================= */

export async function POST(
    req: Request
) {
    try {
        /* ---------------------------------------------
           Get logged-in user session
        --------------------------------------------- */

        const session =
            await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Login required",
                },
                {
                    status: 401,
                    headers: noCacheHeaders,
                }
            );
        }

        /* ---------------------------------------------
           Connect MongoDB
        --------------------------------------------- */

        await connectDB();

        /* ---------------------------------------------
           Parse request body
        --------------------------------------------- */

        const body =
            (await req.json()) as CartRequestBody;

        /* ---------------------------------------------
           Support both:

           {
             items: [...]
           }

           OR

           {
             cart: [...]
           }
        --------------------------------------------- */

        const itemsToSave =
            body.items ??
            body.cart ??
            [];

        /* ---------------------------------------------
           User ID
        --------------------------------------------- */

        const userId =
            session.user.id;

        /* ---------------------------------------------
           Fallback session ID
        --------------------------------------------- */

        const fallbackSessionId =
            `user_${userId}`;

        /* ---------------------------------------------
           Create or update UserBehavior
        --------------------------------------------- */

        await UserBehavior.findOneAndUpdate(
            {
                userId: userId,
            },
            {
                $set: {
                    cartAbandons:
                        itemsToSave,
                },
                $setOnInsert: {
                    sessionId:
                        fallbackSessionId,
                },
            },
            {
                new: true,
                upsert: true,
            }
        ).exec();

        /* ---------------------------------------------
           Success response
        --------------------------------------------- */

        return NextResponse.json(
            {
                success: true,
                message:
                    "Cart synced to UserBehavior!",
            },
            {
                status: 200,
                headers: noCacheHeaders,
            }
        );
    } catch (error) {
        console.error(
            "POST Cart Error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Server Database Error",
            },
            {
                status: 500,
                headers: noCacheHeaders,
            }
        );
    }
}
