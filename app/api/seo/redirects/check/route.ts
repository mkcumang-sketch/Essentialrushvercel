export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import mongoose, { Model } from "mongoose";

// ======================================================
// REDIRECT INTERFACE
// ======================================================

interface IRedirect {
  oldUrl: string;
  newUrl: string;
  active: boolean;
  isPermanent: boolean;
}

// ======================================================
// REDIRECT SCHEMA
// ======================================================

const redirectSchema = new mongoose.Schema<IRedirect>(
  {
    oldUrl: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    newUrl: {
      type: String,
      required: true,
      trim: true,
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    isPermanent: {
      type: Boolean,
      default: false,
    },
  },
  {
    strict: false,
  }
);

// ======================================================
// MONGOOSE MODEL
// ======================================================

// Explicit Model typing fixes TS2349
// caused by mongoose.models.Redirect union inference.

const Redirect: Model<IRedirect> =
  (mongoose.models.Redirect as Model<IRedirect>) ||
  mongoose.model<IRedirect>(
    "Redirect",
    redirectSchema
  );

// ======================================================
// DATABASE CONNECTION
// ======================================================

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is not defined in environment variables."
    );
  }

  await mongoose.connect(mongoUri);
}

// ======================================================
// GET REDIRECT
// ======================================================

export async function GET(
  req: NextRequest
) {
  try {
    // ----------------------------------------------
    // GET PATH
    // ----------------------------------------------

    const { searchParams } =
      new URL(req.url);

    const path =
      searchParams.get("path");

    // ----------------------------------------------
    // NO PATH
    // ----------------------------------------------

    if (!path) {
      return NextResponse.json({
        redirectUrl: null,
      });
    }

    // ----------------------------------------------
    // CONNECT DATABASE
    // ----------------------------------------------

    await connectDB();

    // ----------------------------------------------
    // FIND ACTIVE REDIRECT
    // ----------------------------------------------

    const redirectRule =
      await Redirect.findOne({
        oldUrl: path,
        active: true,
      })
        .lean()
        .exec();

    // ----------------------------------------------
    // REDIRECT FOUND
    // ----------------------------------------------

    if (redirectRule) {
      return NextResponse.json({
        redirectUrl:
          redirectRule.newUrl,

        isPermanent:
          redirectRule.isPermanent,
      });
    }

    // ----------------------------------------------
    // NO REDIRECT FOUND
    // ----------------------------------------------

    return NextResponse.json({
      redirectUrl: null,
    });
  } catch (error) {
    console.error(
      "SEO Redirect GET Error:",
      error
    );

    return NextResponse.json(
      {
        redirectUrl: null,
      },
      {
        status: 500,
      }
    );
  }
}