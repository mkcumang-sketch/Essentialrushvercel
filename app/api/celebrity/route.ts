export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';
import mongoose from 'mongoose';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { sanitizeString } from '@/lib/sanitize';

const isSuperAdmin = async () => {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    return role === 'SUPER_ADMIN' || role === 'ADMIN';
};

const CelebrityModel = (mongoose.models.Celebrity || Celebrity) as mongoose.Model<any>;

// 1. GET: Fetch all Celebrities
export async function GET() {
    try {
        await connectDB();
        const celebs = await CelebrityModel.find({}).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, data: celebs });
    } catch (error: any) {
        console.error("Celebrity GET Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// 2. POST: Add new Celebrity
export async function POST(req: Request) {
    try {
        if (!(await isSuperAdmin())) {
            return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();
        const name = sanitizeString(body?.name, 80);
        const title = sanitizeString(body?.title, 100);
        const imageUrl = sanitizeString(body?.imageUrl, 500);
        const cloudinaryPublicId = sanitizeString(body?.cloudinaryPublicId, 255);

        if (!name || !imageUrl) {
            return NextResponse.json({ success: false, error: "Name and Image are required." }, { status: 400 });
        }

        const newCelebrity = await CelebrityModel.create({
            name,
            title: title || "Global Ambassador",
            imageUrl,
            cloudinaryPublicId
        });

        revalidatePath('/', 'layout');
        return NextResponse.json({ success: true, data: newCelebrity });
    } catch (error: any) {
        console.error("Celebrity POST Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// 3. DELETE: Remove Celebrity (Supports Query String ?id=... & JSON Body)
export async function DELETE(req: Request) {
    try {
        if (!(await isSuperAdmin())) {
            return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
        }

        await connectDB();

        // Step 1: Try reading ID from URL search params (?id=... or ?_id=...)
        const { searchParams } = new URL(req.url);
        let targetId = searchParams.get('id') || searchParams.get('_id');

        // Step 2: Fallback to reading JSON body if not present in query params
        if (!targetId) {
            try {
                const body = await req.json();
                targetId = body?.id || body?._id;
            } catch {
                // Request body might be empty, ignore parsing error
            }
        }

        if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
            return NextResponse.json({ success: false, error: "Valid Ambassador ID is required." }, { status: 400 });
        }

        const deleted = await CelebrityModel.findByIdAndDelete(targetId);

        if (!deleted) {
            return NextResponse.json({ success: false, error: "Ambassador record not found in database." }, { status: 404 });
        }

        revalidatePath('/', 'layout');
        return NextResponse.json({ success: true, message: "Ambassador deleted successfully." });
    } catch (error: any) {
        console.error("Celebrity DELETE Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Database error" }, { status: 500 });
    }
}