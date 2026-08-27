export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🚀 THE ULTIMATE FIX: File ke top par hi model ko explicitly cast kar diya 
// taaki PUT aur DELETE dono se ts(2349) error hamesha ke liye hat jaye
const CelebrityModel = (mongoose.models.Celebrity || Celebrity) as mongoose.Model<any>;

// PUT: Edit existing Celebrity
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();
        const { name, title, imageUrl, cloudinaryPublicId, oldCloudinaryPublicId } = body;

        // 🚀 FIX: Used the strictly casted CelebrityModel
        const celeb = await CelebrityModel.findById(id);
        if (!celeb) return NextResponse.json({ success: false, error: "Celebrity not found." }, { status: 404 });

        // Force delete old image if new upload happened
        if (oldCloudinaryPublicId) {
            await cloudinary.uploader.destroy(oldCloudinaryPublicId);
        }

        celeb.name = name;
        celeb.title = title;
        celeb.imageUrl = imageUrl;
        celeb.cloudinaryPublicId = cloudinaryPublicId;
        await celeb.save();

        return NextResponse.json({ success: true, data: celeb });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
    }
}

// DELETE: Deletes Celebrity (Removes DB entry AND Cloudinary image)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        
        // 🚀 FIX: Used the strictly casted CelebrityModel
        const celeb = await CelebrityModel.findByIdAndDelete(id);
        revalidatePath('/', 'layout');
        
        if (!celeb) return NextResponse.json({ success: false, error: "Celebrity not found." }, { status: 404 });
        
        if (celeb.cloudinaryPublicId) {
            await cloudinary.uploader.destroy(celeb.cloudinaryPublicId);
        }

        return NextResponse.json({ success: true, message: "Removed." });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
    }
}