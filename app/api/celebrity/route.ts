export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';
import mongoose from 'mongoose';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';

const isSuperAdmin = async () => {
    const session = await getServerSession(authOptions);
    return (session?.user as any)?.role === 'SUPER_ADMIN';
};

// 🚀 THE ULTIMATE FIX: File ke top par hi model ko explicitly cast kar diya 
// taaki GET, POST, aur DELETE teeno se ts(2349) error hamesha ke liye hat jaye
const CelebrityModel = (mongoose.models.Celebrity || Celebrity) as mongoose.Model<any>;

// POST: Add new Celebrity
export async function POST(req: Request) {
    try {
        if (!(await isSuperAdmin())) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }
        await connectDB();
        const body = await req.json();
        const { name, title, imageUrl, cloudinaryPublicId } = body;

        if (!name || !imageUrl) {
            return NextResponse.json({ success: false, error: "Name and Image are required." }, { status: 400 });
        }

        // 🚀 FIX: Used the strictly casted CelebrityModel
        const newCelebrity = await CelebrityModel.create({
            name,
            title: title || "Global Ambassador",
            imageUrl,
            cloudinaryPublicId
        });

        revalidatePath('/', 'layout');
        return NextResponse.json({ success: true, data: newCelebrity });
    } catch (error) {
        console.error("Celebrity API Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// GET: Fetch all Celebrities
export async function GET() {
    try {
        await connectDB();
        // 🚀 FIX: Used the strictly casted CelebrityModel
        const celebs = await CelebrityModel.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: celebs });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Remove Celebrity
export async function DELETE(req: Request) {
    try {
        if (!(await isSuperAdmin())) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }
        await connectDB();
        const body = await req.json();
        const { id } = body;
        if (!id) return NextResponse.json({ success: false, error: "ID missing" });

        // 🚀 FIX: Used the strictly casted CelebrityModel
        await CelebrityModel.findByIdAndDelete(id);
        revalidatePath('/', 'layout');

        return NextResponse.json({ success: true, message: "Ambassador Deleted from Database" });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
    }
}