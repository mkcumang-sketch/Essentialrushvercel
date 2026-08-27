export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

import connectDB from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { Product } from "@/models/Product";
import { handleError } from "@/lib/error-handler";

import type { UserRole } from "@/types/next-auth";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    await connectDB();

    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: products,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    const err = handleError(error);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      {
        status: err.statusCode,
      }
    );
  }
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
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

    const role = session.user.role as UserRole;

    if (role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    const body = await req.json();

    if (!body.name || !body.price) {
      return NextResponse.json(
        {
          success: false,
          error: "name and price are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!body.images || body.images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one image is required.",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    const product = await Product.create(body);

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/godmode");
    revalidatePath("/godmode/products");

    return NextResponse.json(
      {
        success: true,
        data: product,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    const err = handleError(error);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
        details: err.details,
      },
      {
        status: err.statusCode,
      }
    );
  }
}