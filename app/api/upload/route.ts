export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Allowed MIME types for file uploads
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'];

// Magic bytes (file signatures) for verification
const MAGIC_BYTES: { [key: string]: number[] } = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
};

function verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const expectedBytes = MAGIC_BYTES[mimeType];
  if (!expectedBytes) return true;
  
  for (let i = 0; i < expectedBytes.length; i++) {
    if (buffer[i] !== expectedBytes[i]) {
      return false;
    }
  }
  return true;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";

  try {
    // 🛡️ 1. Authentication Check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in to upload files.' },
        { status: 401 }
      );
    }

    // 🛡️ 2. Rate Limiting
    const rateLimit = await checkRateLimit(`upload:${ip}`, "user");
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many upload requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 🛡️ 3. Cloudinary Configuration Check
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Upload service not configured' },
        { status: 500, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file detected' },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 🛡️ 4. File Size Validation (Max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 🛡️ 5. MIME Type Validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 🛡️ 6. File Extension Validation
    const fileName = file.name.toLowerCase();
    const ext = fileName.split('.').pop() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { success: false, error: `File extension .${ext} is not allowed` },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 🛡️ 7. Magic Bytes Verification
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    if (!verifyMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { success: false, error: 'File content does not match the file type' },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 🛡️ 8. Upload to Cloudinary with restricted resource type
    const fileBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;
    const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
      folder: 'essential_rush_vault',
      resource_type: file.type === 'application/pdf' ? 'raw' : 'image',
      public_id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
      overwrite: false,
    });

    return NextResponse.json({
      success: true,
      url: uploadResponse.secure_url,
    }, { headers: getRateLimitHeaders(rateLimit) });
  } catch (error: any) {
    console.error('Cloudinary Upload Engine Error:', error.message);
    return NextResponse.json({
      success: false,
      error: 'Upload failed',
    }, { status: 500 });
  }
}