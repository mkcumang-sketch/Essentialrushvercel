export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// 🕵️‍♂️ THE DETECTOR: Ye terminal mein batayega ki keys load hui ya nahi
console.log("Cloudinary Keys Status:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "✅ FOUND" : "❌ MISSING",
  api_key: process.env.CLOUDINARY_API_KEY ? "✅ FOUND" : "❌ MISSING",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "✅ FOUND" : "❌ MISSING",
});

// 1. 🔐 Authenticate with your exact .env keys
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    // 🛑 Hard stop if API key is truly missing
    if (!process.env.CLOUDINARY_API_KEY) {
      return NextResponse.json({ success: false, error: 'Server Config Error: Cloudinary API Key is missing in .env file' }, { status: 500 });
    }

    // 2. 📦 Get the file from the frontend request
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file detected' }, { status: 400 });
    }

    // 3. 🔄 Convert the file into a Base64 string (Required for Next.js Serverless Uploads)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // 4. 🚀 Upload directly to your Cloudinary Vault
    const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
      folder: 'essential_rush_vault', 
      resource_type: 'auto',          
    });

    // 5. ✅ Return the secure Cloudinary URL back to Admin Panel / Frontend
    return NextResponse.json({ 
        success: true, 
        url: uploadResponse.secure_url 
    });

  } catch (error: any) {
    console.error('Cloudinary Upload Engine Error:', error);
    return NextResponse.json({ 
        success: false, 
        error: error.message || 'Upload failed. Please check Cloudinary keys in Vercel/Local.' 
    }, { status: 500 });
  }
}