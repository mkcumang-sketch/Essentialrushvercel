export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import connectDB from "@/lib/mongodb"; // Aapka standard db connection import
import { HomepageSection, ActivityLog } from "@/models/Enterprise";
import { NextResponse } from "next/server";
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose'; // 🚀 FIX: mongoose import kiya

/**
 * DYNAMIC LAYOUT CONTROLLER v4.0
 * The Brain of the Page Builder - Controls UI Rendering via DB Nodes
 */

// 🚀 THE ULTIMATE FIX: Dono models ko explicitly cast kiya taaki TS(2349) ke saare 9 errors ek jhatke mein gayab ho jayein
const HomepageSectionModel = HomepageSection as mongoose.Model<any>;
const ActivityLogModel = ActivityLog as mongoose.Model<any>;

// 1. GET: Fetch All Active Sections for Frontend Shell
export async function GET() {
  try {
    await connectDB();

    // Fetching sections sorted by 'order' field
    // Optimized with .lean() for high-traffic read performance
    const sections = await HomepageSectionModel.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: sections.length,
      data: sections
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. POST: Create a New Layout Node (Section)
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // Validation: Type is mandatory for the Component Mapper
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

    // Enterprise Audit Trail
    await ActivityLogModel.create({
      action: "CMS_SECTION_CREATE",
      details: `New UI Node [${body.type}] added to registry: ${body.title}`,
      target: "CMS_ENGINE"
    });

    return NextResponse.json({ success: true, data: newSection }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 3. PATCH: Bulk Reordering or Single Section Modification
export async function PATCH(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // Logic 1: Bulk Reordering (If array is passed)
    if (body.reorder && Array.isArray(body.sections)) {
      const ops = body.sections.map((s: any) => ({
        updateOne: {
          filter: { _id: s._id },
          update: { $set: { order: s.order } }
        }
      }));

      await HomepageSectionModel.bulkWrite(ops);

      await ActivityLogModel.create({
        action: "CMS_LAYOUT_REORDER",
        details: "Homepage structure re-sequenced by admin.",
        target: "CMS_ENGINE"
      });

      return NextResponse.json({ success: true, message: "Mainframe Layout Re-ordered" });
    }

    // Logic 2: Single Section Update
    if (body.id && body.updateData) {
      const updated = await HomepageSectionModel.findByIdAndUpdate(
        body.id,
        { $set: body.updateData },
        { new: true }
      );

      await ActivityLogModel.create({
        action: "CMS_SECTION_UPDATE",
        details: `UI Node [${updated.title}] updated.`,
        target: "CMS_ENGINE"
      });

      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: "Invalid PATCH instruction" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 4. DELETE: Permanent UI Node Removal
export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Identification missing" }, { status: 400 });
    }

    const deleted = await HomepageSectionModel.findByIdAndDelete(id);

    revalidatePath('/', 'layout');

    if (deleted) {
      await ActivityLogModel.create({
        action: "CMS_SECTION_DELETE",
        details: `UI Node [${deleted.title}] purged from system.`,
        target: "CMS_ENGINE"
      });
    }

    return NextResponse.json({ success: true, message: "Node removed successfully" });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}