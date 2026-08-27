export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import mongoose, { Model } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/* -------------------------------------------------------------------------- */
/*                                DATABASE                                    */
/* -------------------------------------------------------------------------- */

async function connectDB() {
    if (mongoose.connection.readyState === 1) return;

    if (!process.env.MONGODB_URI) {
        throw new Error("Missing MONGODB_URI");
    }

    await mongoose.connect(process.env.MONGODB_URI);
}

/* -------------------------------------------------------------------------- */
/*                                 MODEL                                      */
/* -------------------------------------------------------------------------- */

const ProductSchema =
    mongoose.models.Product?.schema ??
    new mongoose.Schema({}, { strict: false });

const Product: Model<any> =
    mongoose.models.Product ||
    mongoose.model("Product", ProductSchema);

/* -------------------------------------------------------------------------- */
/*                                  PATCH                                     */
/* -------------------------------------------------------------------------- */

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {

        /* -------------------------- Authentication ------------------------- */

        const session = await getServerSession(authOptions);

        if ((session?.user as any)?.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Unauthorized"
                },
                {
                    status: 403
                }
            );
        }

        /* --------------------------- Connect DB ---------------------------- */

        await connectDB();

        /* -------------------------- Resolve Params ------------------------- */

        const { slug } = await params;

        if (!slug) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing product identifier."
                },
                {
                    status: 400
                }
            );
        }

        /* ---------------------------- Body -------------------------------- */

        const dataToUpdate = await req.json();

        let updatedProduct: any = null;

        /* ----------------------- Update by ObjectId ------------------------ */

        if (mongoose.Types.ObjectId.isValid(slug)) {
            updatedProduct = await Product.findByIdAndUpdate(
                slug,
                {
                    $set: dataToUpdate
                },
                {
                    new: true,
                    runValidators: true
                }
            );
        }

        /* --------------------- Update by id / slug ------------------------- */

        if (!updatedProduct) {
            updatedProduct = await Product.findOneAndUpdate(
                {
                    $or: [
                        { id: slug },
                        { slug: slug }
                    ]
                },
                {
                    $set: dataToUpdate
                },
                {
                    new: true,
                    runValidators: true
                }
            );
        }

        /* ---------------------------- Not Found ---------------------------- */

        if (!updatedProduct) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Product not found."
                },
                {
                    status: 404
                }
            );
        }

        /* ---------------------------- Success ------------------------------ */

        return NextResponse.json({
            success: true,
            message: "Product updated successfully.",
            product: updatedProduct
        });

    } catch (error: any) {

        console.error("PATCH Error:", error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || "Internal Server Error"
            },
            {
                status: 500
            }
        );
    }
}

/* -------------------------------------------------------------------------- */
/*                              BLOCK OTHER METHODS                           */
/* -------------------------------------------------------------------------- */

export async function GET() {
    return NextResponse.json(
        {
            error: "Method Not Allowed"
        },
        {
            status: 405
        }
    );
}