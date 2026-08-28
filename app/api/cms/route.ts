export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import mongoose, { Model } from 'mongoose';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import connectDB from "@/lib/mongodb";

const CmsSchema = new mongoose.Schema({
  heroSlides: Array,
  heroConfig: Object,
  aboutConfig: Object,
  galleryImages: Array,
  promotionalVideos: Array,
  uiConfig: Object,
  categories: Array,
  faqs: Array,
  socialLinks: Object,
  corporateInfo: Object,
  legalPages: [{ id: String, title: String, slug: String, content: String }], 
  updatedAt: { type: Date, default: Date.now }
}, { strict: false });

const CMS = (mongoose.models.CMS || mongoose.model('CMS', CmsSchema)) as Model<any>;

export async function GET() {
  try {
    await connectDB();
    const cmsData = await CMS.findOne().lean();
    return NextResponse.json({ success: true, data: cmsData || {} }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch CMS" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    
    let config = await CMS.findOne();
    if (config) {
      await CMS.updateOne({}, { $set: { ...body, updatedAt: Date.now() } });
    } else {
      config = await CMS.create(body);
    }
    
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, message: "CMS Updated Successfully", data: config });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update CMS" }, { status: 500 });
  }
}