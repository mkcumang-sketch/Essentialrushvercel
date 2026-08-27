'use server';

import connectDB from '@/lib/mongodb';
import mongoose, { Model, Schema } from 'mongoose';
import { revalidatePath } from 'next/cache';

// ─── Inline Schema + Type ─────────────────────────────────────────────────────
interface IAbout {
  title?: string;
  description?: string;
  history?: string;
  imageUrl?: string;
}

const AboutSchema = new Schema<IAbout>({
  title:       String,
  description: String,
  history:     String,
  imageUrl:    String,
});

// ✅ FIX: Explicit Model<IAbout> — resolves ts(2349)
const AboutModel: Model<IAbout> =
  (mongoose.models.About as Model<IAbout>) ||
  mongoose.model<IAbout>('About', AboutSchema);

// ─── Actions ──────────────────────────────────────────────────────────────────
export async function updateAboutPage(data: IAbout) {
  await connectDB();
  await AboutModel.findOneAndUpdate({}, data, { upsert: true });
  revalidatePath('/about');
  return { success: true };
}

export async function getAboutData(): Promise<IAbout | null> {
  await connectDB();
  const data = await AboutModel.findOne().lean();
  return JSON.parse(JSON.stringify(data));
}