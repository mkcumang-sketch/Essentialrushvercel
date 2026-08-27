
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import mongoose, { Document, Model } from 'mongoose';

// ===============================
// MongoDB Connection
// ===============================

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
};

// ===============================
// Redirect Interface
// ===============================

interface IRedirect extends Document {
  oldUrl: string;
  newUrl: string;
  isPermanent: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===============================
// Redirect Schema
// ===============================

const redirectSchema = new mongoose.Schema<IRedirect>(
  {
    oldUrl: {
      type: String,
      required: true,
      trim: true,
    },

    newUrl: {
      type: String,
      required: true,
      trim: true,
    },

    isPermanent: {
      type: Boolean,
      default: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ===============================
// Redirect Model
// ===============================

const Redirect: Model<IRedirect> =
  (mongoose.models.Redirect as Model<IRedirect>) ||
  mongoose.model<IRedirect>('Redirect', redirectSchema);

// ===============================
// GET - Fetch All Redirects
// ===============================

export async function GET() {
  try {
    await connectDB();

    const redirects = await Redirect.find({})
      .sort({ createdAt: -1 })
      .exec();

    return NextResponse.json({
      success: true,
      data: redirects,
    });
  } catch (error) {
    console.error('GET Redirect Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch redirects',
      },
      {
        status: 500,
      }
    );
  }
}

// ===============================
// POST - Create Redirect
// ===============================

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    let oldUrl = body.oldUrl;
    let newUrl = body.newUrl;

    // Validate required fields
    if (!oldUrl || !newUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'oldUrl and newUrl are required',
        },
        {
          status: 400,
        }
      );
    }

    // Ensure oldUrl starts with /
    if (!oldUrl.startsWith('/')) {
      oldUrl = '/' + oldUrl;
    }

    // Ensure newUrl starts with /
    // unless it is an external URL
    if (
      !newUrl.startsWith('http://') &&
      !newUrl.startsWith('https://') &&
      !newUrl.startsWith('/')
    ) {
      newUrl = '/' + newUrl;
    }

    const newRedirect = new Redirect({
      oldUrl,
      newUrl,
      isPermanent:
        typeof body.isPermanent === 'boolean'
          ? body.isPermanent
          : true,
      active:
        typeof body.active === 'boolean'
          ? body.active
          : true,
    });

    await newRedirect.save();

    revalidatePath('/', 'layout');

    return NextResponse.json(
      {
        success: true,
        data: newRedirect,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error('POST Redirect Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create redirect',
      },
      {
        status: 500,
      }
    );
  }
}

// ===============================
// DELETE - Delete Redirect
// ===============================

export async function DELETE(req: Request) {
  try {
    await connectDB();

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Redirect ID is required',
        },
        {
          status: 400,
        }
      );
    }

    const deletedRedirect = await Redirect.findByIdAndDelete(id).exec();

    if (!deletedRedirect) {
      return NextResponse.json(
        {
          success: false,
          error: 'Redirect not found',
        },
        {
          status: 404,
        }
      );
    }

    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      message: 'Redirect deleted successfully',
    });
  } catch (error) {
    console.error('DELETE Redirect Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete redirect',
      },
      {
        status: 500,
      }
    );
  }
}
