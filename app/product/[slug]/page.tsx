import { notFound } from "next/navigation";
import connectDB from "@/lib/mongodb";
import { Product } from "@/models/Product";
import ProductClientPage from "./ProductClientPage";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  await connectDB();

  const decodedSlug = decodeURIComponent(slug);
  const isObjectId = mongoose.Types.ObjectId.isValid(decodedSlug);

  const product = await Product.findOne({
    $or: [
      { slug: decodedSlug },
      { id: decodedSlug },
      ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(decodedSlug) }] : []),
    ],
  }).lean();

  if (!product) {
    notFound();
  }

  // Convert MongoDB _id and dates to plain JSON-serializable types
  const serializedProduct = JSON.parse(JSON.stringify(product));

  return <ProductClientPage initialProduct={serializedProduct} />;
}