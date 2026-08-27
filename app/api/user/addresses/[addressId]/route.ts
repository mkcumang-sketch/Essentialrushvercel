export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import mongoose, { Model } from "mongoose";

import { authOptions } from "@/lib/auth";
import User from "@/models/usertemp";
import connectDB from "@/lib/mongodb";

// ======================================================
// TYPES
// ======================================================

interface IUserAddress {
  _id?: mongoose.Types.ObjectId;
  type?: string;
  address?: string;
  isDefault?: boolean;
  [key: string]: unknown;
}

interface IUserWithAddresses {
  _id?: mongoose.Types.ObjectId;
  addresses?: IUserAddress[];
  [key: string]: unknown;
}

// ======================================================
// TYPED USER MODEL
// ======================================================
//
// Your existing User model does not expose "addresses"
// in its TypeScript type. We cast it here so TypeScript
// knows that the database user contains an addresses array.
//
// This fixes:
// TS2339 - Property 'addresses' does not exist
// ======================================================

const UserModel =
  User as unknown as Model<IUserWithAddresses>;

// ======================================================
// DELETE - REMOVE SPECIFIC ADDRESS
// ======================================================

export async function DELETE(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      addressId: string;
    }>;
  }
) {
  try {
    // ==================================================
    // 1. CONNECT DATABASE
    // ==================================================

    await connectDB();

    // ==================================================
    // 2. VERIFY USER SESSION
    // ==================================================

    const session = await getServerSession(authOptions);

    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Please sign in.",
        },
        {
          status: 401,
        }
      );
    }

    // ==================================================
    // 3. GET ADDRESS ID
    // ==================================================

    const { addressId } = await params;

    // ==================================================
    // 4. VALIDATE ADDRESS ID
    // ==================================================

    if (
      !addressId ||
      typeof addressId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid address ID",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 5. VALIDATE MONGODB OBJECT ID
    // ==================================================

    if (
      !mongoose.Types.ObjectId.isValid(addressId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid address ID",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 6. FIND CURRENT USER
    // ==================================================

    const dbUser = await UserModel.findById(userId)
      .select("-password -__v")
      .lean()
      .exec();

    if (!dbUser) {
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
    // 7. CHECK ADDRESS OWNERSHIP
    // ==================================================
    //
    // Security:
    // The address must belong to the logged-in user.
    //
    // This prevents IDOR attacks where somebody tries
    // to delete another user's address using its ID.
    // ==================================================

    const addressExists =
      Array.isArray(dbUser.addresses) &&
      dbUser.addresses.some(
        (addr) =>
          addr._id?.toString() === addressId
      );

    if (!addressExists) {
      return NextResponse.json(
        {
          success: false,
          error: "Address not found",
        },
        {
          status: 404,
        }
      );
    }

    // ==================================================
    // 8. DELETE ADDRESS
    // ==================================================

    const updatedUser =
      await UserModel.findByIdAndUpdate(
        userId,
        {
          $pull: {
            addresses: {
              _id: new mongoose.Types.ObjectId(
                addressId
              ),
            },
          },
        },
        {
          new: true,
        }
      )
        .select("-password -__v")
        .lean()
        .exec();

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "We could not delete this address.",
        },
        {
          status: 500,
        }
      );
    }

    // ==================================================
    // 9. GET REMAINING ADDRESSES
    // ==================================================

    let remainingAddresses =
      Array.isArray(updatedUser.addresses)
        ? updatedUser.addresses
        : [];

    // ==================================================
    // 10. ENSURE DEFAULT ADDRESS
    // ==================================================
    //
    // If the deleted address was the default address,
    // make the first remaining address default.
    // ==================================================

    const hasDefaultAddress =
      remainingAddresses.some(
        (addr) => addr.isDefault === true
      );

    if (
      !hasDefaultAddress &&
      remainingAddresses.length > 0
    ) {
      const firstAddressId =
        remainingAddresses[0]?._id;

      if (firstAddressId) {
        await UserModel.updateOne(
          {
            _id: userId,
          },
          {
            $set: {
              "addresses.$[address].isDefault":
                true,
            },
          },
          {
            arrayFilters: [
              {
                "address._id":
                  firstAddressId,
              },
            ],
          }
        ).exec();

        // Update response data as well
        remainingAddresses =
          remainingAddresses.map(
            (addr, index) => ({
              ...addr,
              isDefault:
                index === 0,
            })
          );
      }
    }

    // ==================================================
    // 11. REVALIDATE CACHE
    // ==================================================

    revalidatePath("/", "layout");

    // ==================================================
    // 12. SUCCESS RESPONSE
    // ==================================================

    return NextResponse.json({
      success: true,
      message: "Address removed.",
      data: {
        addresses: remainingAddresses,
      },
    });
  } catch (error) {
    console.error(
      "Delete Address Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "We could not delete this address.",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================================
// PUT - UPDATE SPECIFIC ADDRESS
// ======================================================

export async function PUT(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      addressId: string;
    }>;
  }
) {
  try {
    // ==================================================
    // 1. CONNECT DATABASE
    // ==================================================

    await connectDB();

    // ==================================================
    // 2. VERIFY USER SESSION
    // ==================================================

    const session = await getServerSession(authOptions);

    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Please sign in.",
        },
        {
          status: 401,
        }
      );
    }

    // ==================================================
    // 3. GET ADDRESS ID
    // ==================================================

    const { addressId } = await params;

    // ==================================================
    // 4. VALIDATE ADDRESS ID
    // ==================================================

    if (
      !addressId ||
      typeof addressId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid address ID",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 5. VALIDATE MONGODB OBJECT ID
    // ==================================================

    if (
      !mongoose.Types.ObjectId.isValid(addressId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid address ID",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 6. READ REQUEST BODY
    // ==================================================

    const body = await req.json();

    const type =
      typeof body.type === "string"
        ? body.type.trim()
        : "Home";

    const address =
      typeof body.address === "string"
        ? body.address.trim()
        : "";

    const isDefault =
      Boolean(body.isDefault);

    // ==================================================
    // 7. VALIDATE ADDRESS
    // ==================================================

    if (
      !address ||
      address.length < 10
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a full address.",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 8. FIND CURRENT USER
    // ==================================================

    const dbUser = await UserModel.findById(userId)
      .select("-password -__v")
      .lean()
      .exec();

    if (!dbUser) {
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
    // 9. CHECK ADDRESS OWNERSHIP
    // ==================================================

    const addressExists =
      Array.isArray(dbUser.addresses) &&
      dbUser.addresses.some(
        (addr) =>
          addr._id?.toString() === addressId
      );

    if (!addressExists) {
      return NextResponse.json(
        {
          success: false,
          error: "Address not found",
        },
        {
          status: 404,
        }
      );
    }

    // ==================================================
    // 10. UPDATE ADDRESS
    // ==================================================

    // First update the selected address.
    const updatedUser =
      await UserModel.findOneAndUpdate(
        {
          _id: userId,
          "addresses._id":
            new mongoose.Types.ObjectId(
              addressId
            ),
        },
        {
          $set: {
            "addresses.$.type": type || "Home",
            "addresses.$.address": address,
            "addresses.$.isDefault":
              isDefault,
          },
        },
        {
          new: true,
        }
      )
        .select("-password -__v")
        .lean()
        .exec();

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "We could not update this address.",
        },
        {
          status: 500,
        }
      );
    }

    // ==================================================
    // 11. IF NEW ADDRESS IS DEFAULT
    // ==================================================

    if (isDefault) {
      // Remove default status from every other address.
      await UserModel.updateOne(
        {
          _id: userId,
        },
        {
          $set: {
            "addresses.$[other].isDefault":
              false,
          },
        },
        {
          arrayFilters: [
            {
              "other._id": {
                $ne:
                  new mongoose.Types.ObjectId(
                    addressId
                  ),
              },
            },
          ],
        }
      ).exec();
    }

    // ==================================================
    // 12. GET FINAL USER DATA
    // ==================================================

    const finalUser =
      await UserModel.findById(userId)
        .select("-password -__v")
        .lean()
        .exec();

    if (!finalUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Could not load updated address data.",
        },
        {
          status: 500,
        }
      );
    }

    const finalAddresses =
      Array.isArray(finalUser.addresses)
        ? finalUser.addresses
        : [];

    // ==================================================
    // 13. REVALIDATE CACHE
    // ==================================================

    revalidatePath("/", "layout");

    // ==================================================
    // 14. SUCCESS RESPONSE
    // ==================================================

    return NextResponse.json({
      success: true,
      message: "Address updated.",
      data: {
        addresses: finalAddresses,
      },
    });
  } catch (error) {
    console.error(
      "Update Address Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "We could not update this address.",
      },
      {
        status: 500,
      }
    );
  }
}