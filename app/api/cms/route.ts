import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache'; // 🚀 Import cache revalidator
import connectDB from "@/lib/mongodb";

const CmsSchema = new mongoose.Schema({
    heroSlides: Array,
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
});

// 🚀 THE ULTIMATE FIX: Poore expression ko bracket mein daal kar explicitly cast kiya 
// taaki chaaro ts(2349) errors ek saath gayab ho jayein!
const CMS = (mongoose.models.CMS || mongoose.model('CMS', CmsSchema)) as mongoose.Model<any>;

// 🚀 STRICT CACHE KILLER FOR REAL-TIME
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
    try {
        await connectDB();
        const cmsData = await CMS.findOne();
        if (!cmsData) return NextResponse.json({ success: true, data: {} });
        
        // 🚀 Remove all 5-min caching headers
        return NextResponse.json({ success: true, data: cmsData }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        });
    } catch (error) {
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
        
        const existingCms = await CMS.findOne();
        if (existingCms) {
            await CMS.updateOne({}, { $set: { ...body, updatedAt: Date.now() } });
        } else {
            await CMS.create(body);
        }
        
        // 🚀 TAAKI POORI SITE PAR REAL-TIME CMS UPDATE HO JAYE
        revalidatePath('/', 'layout'); 
        
        return NextResponse.json({ success: true, message: "CMS Updated Successfully" });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to update CMS" }, { status: 500 });
    }
}