import connectDB from "@/lib/mongodb";
import { Product } from "@/models/Product";
import ProductsClient from "./ProductsClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProductsAdminPage() {
  await connectDB();
  const products = await Product.find({}).sort({ createdAt: -1 }).lean();
  const serializedProducts = JSON.parse(JSON.stringify(products));

  return <ProductsClient initialProducts={serializedProducts} />;
}