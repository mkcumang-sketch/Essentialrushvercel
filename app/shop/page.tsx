import connectDB from "@/lib/mongodb";
import { Product } from "@/models/Product";
import ShopClient from "@/components/ShopClient";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic'; // 🚀 Taki hamesha fresh products aayein, purane cache na hon

export default async function ShopPage() {
    await connectDB();
    
    const ProductModel = Product as mongoose.Model<any>;
    const products = await ProductModel.find({})
        .sort({ createdAt: -1 })
        .lean() as any[];
        
    // 🛡️ Bulletproof Serialization (ID aur Dates dono ko string bana diya)
    const serializedProducts = products.map(p => ({
        ...p,
        _id: p._id?.toString(),
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
    }));
    
    return <ShopClient initialProducts={serializedProducts} />;
}