export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import connectDB from "@/lib/mongodb";
import { HomepageSection, ActivityLog } from "@/models/Enterprise";
import { NextResponse } from "next/server";
import { revalidatePath } from 'next/cache';
import mongoose, { Model } from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const HomepageSectionModel = (HomepageSection || mongoose.models.HomepageSection) as Model<any>;
const ActivityLogModel = (ActivityLog || mongoose.models.ActivityLog) as Model<any>;

export async function GET() {
  try {
    await connectDB();
    const sections = await HomepageSectionModel.find({ isActive: true }).sort({ order: 1 }).lean();
    return NextResponse.json({ success: true, count: sections.length, data: sections });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    if (!body.type || !body.title) {
      return NextResponse.json({ success: false, error: "Section Type and Title are required" }, { status: 400 });
    }

    const newSection = await HomepageSectionModel.create({
      title: body.title,
      type: body.type,
      content: body.content || {},
      styleConfig: body.styleConfig || {},
      order: body.order || 0,
      isActive: body.isActive ?? true
    });

    await ActivityLogModel.create({
      action: "CMS_SECTION_CREATE",
      details: `New UI Node [${body.type}] added: ${body.title}`,
      target: "CMS_ENGINE"
    });

    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, data: newSection }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    if (body.reorder && Array.isArray(body.sections)) {
      const ops = body.sections.map((s: any) => ({
        updateOne: { filter: { _id: s._id }, update: { $set: { order: s.order } } }
      }));
      await HomepageSectionModel.bulkWrite(ops);

      await ActivityLogModel.create({
        action: "CMS_LAYOUT_REORDER",
        details: "Homepage structure re-sequenced by admin.",
        target: "CMS_ENGINE"
      });

      revalidatePath('/', 'layout');
      return NextResponse.json({ success: true, message: "Layout Re-ordered" });
    }

    if (body.id && body.updateData) {
      const updated = await HomepageSectionModel.findByIdAndUpdate(body.id, { $set: body.updateData }, { new: true });
      await ActivityLogModel.create({
        action: "CMS_SECTION_UPDATE",
        details: `UI Node [${updated?.title}] updated.`,
        target: "CMS_ENGINE"
      });

      revalidatePath('/', 'layout');
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: "Invalid instruction" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Valid ID required" }, { status: 400 });
    }

    const deleted = await HomepageSectionModel.findByIdAndDelete(id);
    revalidatePath('/', 'layout');

    if (deleted) {
      await ActivityLogModel.create({
        action: "CMS_SECTION_DELETE",
        details: `UI Node [${deleted.title}] deleted.`,
        target: "CMS_ENGINE"
      });
    }

    return NextResponse.json({ success: true, message: "Node removed successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}