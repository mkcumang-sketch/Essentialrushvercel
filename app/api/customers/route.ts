import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/usertemp';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

let isConnected = false;
const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState >= 1) return;
    try {
        await mongoose.connect(process.env.MONGODB_URI as string, {
            bufferCommands: true,
            maxPoolSize: 10,
        }); 
        isConnected = true;
    } catch (error) {
        console.error("DB Connection Error:", error);
        throw new Error("Database connection failed!");
    }
};

export async function GET(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ success: false, error: "Please sign in as admin." }, { status: 401 });
        }

        const users = await User.find({})
            .select('-password -__v')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            data: {
                users: users || [],
                totalUsers: users?.length || 0
            }
        });

    } catch (error) {
        console.error("Admin Get Users Error:", error);
        return NextResponse.json({ success: false, error: "We could not load users." }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ success: false, error: "Please sign in as admin." }, { status: 401 });
        }

        const { userId, totalSpent, loyaltyTier } = await req.json();

        if (!userId || typeof userId !== 'string') {
            return NextResponse.json({ success: false, error: "User ID missing." }, { status: 400 });
        }

        if (totalSpent !== undefined && (typeof totalSpent !== 'number' || totalSpent < 0)) {
            return NextResponse.json({ success: false, error: "Total spent must be a positive number." }, { status: 400 });
        }

        if (loyaltyTier && !['Silver Vault', 'Gold Vault'].includes(loyaltyTier)) {
            return NextResponse.json({ success: false, error: "That member level is not valid." }, { status: 400 });
        }

        const updateData: any = {};
        if (totalSpent !== undefined) updateData.totalSpent = totalSpent;
        if (loyaltyTier) updateData.loyaltyTier = loyaltyTier;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        ).select('-password -__v');

        if (!updatedUser) {
            return NextResponse.json({ success: false, error: "We could not update this user." }, { status: 500 });
        }

        await User.findByIdAndUpdate(userId, {
            $push: {
                notifications: {
                    title: "Account Updated",
                    desc: `Your member level was updated by our team.`,
                    unread: true,
                    time: new Date()
                }
            }
        });

        revalidatePath('/godmode');

        return NextResponse.json({
            success: true,
            message: "User updated.",
            data: {
                user: updatedUser
            }
        });

    } catch (error) {
        console.error("Admin Update User Error:", error);
        return NextResponse.json({ success: false, error: "We could not update this user." }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await req.json();
        await User.findByIdAndDelete(id);
        
        revalidatePath('/godmode');
        
        return NextResponse.json({ success: true, message: "Client Deleted" });
    } catch (error) {
        console.error("Delete Client Error:", error);
        return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });
    }
}