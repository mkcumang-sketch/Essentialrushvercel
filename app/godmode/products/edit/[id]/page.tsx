export const dynamic = "force-dynamic";

import connectDB from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import EditProductClient from "./EditProductClient";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    notFound();
  }

  const product = await Product.findById(id).lean();
  if (!product) {
    notFound();
  }

  return <EditProductClient initialProduct={JSON.parse(JSON.stringify(product))} />;
}