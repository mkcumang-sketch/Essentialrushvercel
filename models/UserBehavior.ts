
import mongoose, {
    Document,
    Model,
    Schema,
} from "mongoose";

/* =========================================================
   CART ITEM TYPE
========================================================= */

export interface CartItem {
    _id: string;
    name: string;

    price: number;
    offerPrice?: number;

    quantity: number;

    imageUrl?: string;
    brand?: string;
    category?: string;
    badge?: string;
    slug?: string;
    stock?: number;
}

/* =========================================================
   USER BEHAVIOR DOCUMENT TYPE
========================================================= */

export interface IUserBehavior
    extends Document {
    userId?: mongoose.Types.ObjectId | null;

    sessionId: string;

    productScores: Map<
        string,
        number
    >;

    categoryScores: Map<
        string,
        number
    >;

    recentlyViewed: mongoose.Types.ObjectId[];

    cartAbandons: CartItem[];

    referralCode?: string;

    commissionPercentage: number;

    agentRef?: string | null;

    createdAt: Date;
    updatedAt: Date;
}

/* =========================================================
   CART ITEM SCHEMA
========================================================= */

const CartItemSchema =
    new Schema<CartItem>(
        {
            _id: {
                type: String,
                required: true,
            },

            name: {
                type: String,
                required: true,
            },

            price: {
                type: Number,
                required: true,
                default: 0,
            },

            offerPrice: {
                type: Number,
                default: undefined,
            },

            quantity: {
                type: Number,
                required: true,
                default: 1,
                min: 1,
            },

            imageUrl: {
                type: String,
                default: "",
            },

            brand: {
                type: String,
                default: "",
            },

            category: {
                type: String,
                default: "",
            },

            badge: {
                type: String,
                default: "",
            },

            slug: {
                type: String,
                default: "",
            },

            stock: {
                type: Number,
                default: 0,
            },
        },
        {
            _id: false,
        }
    );

/* =========================================================
   USER BEHAVIOR SCHEMA
========================================================= */

const UserBehaviorSchema =
    new Schema<IUserBehavior>(
        {
            /* -----------------------------------------
               Session ID
            ----------------------------------------- */

            sessionId: {
                type: String,
                required: true,
                unique: true,
            },

            /* -----------------------------------------
               Logged-in User
            ----------------------------------------- */

            userId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                default: null,
            },

            /* -----------------------------------------
               Product Recommendation Scores
            ----------------------------------------- */

            productScores: {
                type: Map,
                of: Number,
                default: {},
            },

            /* -----------------------------------------
               Category Affinity Scores
            ----------------------------------------- */

            categoryScores: {
                type: Map,
                of: Number,
                default: {},
            },

            /* -----------------------------------------
               Recently Viewed Products
            ----------------------------------------- */

            recentlyViewed: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "Product",
                },
            ],

            /* -----------------------------------------
               Abandoned / Saved Cart
            ----------------------------------------- */

            cartAbandons: {
                type: [CartItemSchema],
                default: [],
            },

            /* -----------------------------------------
               Affiliate Referral Code
            ----------------------------------------- */

            referralCode: {
                type: String,
                unique: true,
                sparse: true,
            },

            /* -----------------------------------------
               Affiliate Commission
            ----------------------------------------- */

            commissionPercentage: {
                type: Number,
                default: 5,
            },

            /* -----------------------------------------
               Agent Tracking
            ----------------------------------------- */

            agentRef: {
                type: String,
                default: null,
            },
        },
        {
            timestamps: true,
        }
    );

/* =========================================================
   MONGOOSE MODEL
   Prevent model overwrite error in Next.js
========================================================= */

export const UserBehavior =
    (mongoose.models
        .UserBehavior as Model<IUserBehavior>) ||
    mongoose.model<IUserBehavior>(
        "UserBehavior",
        UserBehaviorSchema
    );
