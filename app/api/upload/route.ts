export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ success: false, error: 'Cloudinary server keys missing' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file detected' }, { status: 400 });
    }

    // Size limit check (Max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
      folder: 'essential_rush_vault',
      resource_type: 'auto',
    });

    return NextResponse.json({
      success: true,
      url: uploadResponse.secure_url
    });
  } catch (error: any) {
    console.error('Cloudinary Upload Engine Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Upload failed'
    }, { status: 500 });
  }
}