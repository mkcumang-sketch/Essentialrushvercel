import connectDB from "@/lib/mongodb";
import { Product } from "@/models/Product";
import ShopClient from "@/components/ShopClient";
import mongoose from "mongoose"; // 🚀 FIX: Mongoose import kiya casting ke liye

// 🚀 YE LINE VERCEL ERROR KO FIX KAREGI (Next.js ko prerender karne se rokegi)
export const dynamic = "force-dynamic";

export default async function CollectionPage() {
    try {
        await connectDB();

        // 🚀 FIX: Product ko strictly mongoose.Model<any> mein cast kiya taaki TS2349 error na aaye
        const ProductModel = Product as mongoose.Model<any>;

        // Direct DB Fetching (Server-Side)
        const products = await ProductModel.find({})
            .sort({ createdAt: -1 })
            .lean() as any[];

        // Convert MongoDB _id to string for serialization to prevent Vercel errors
        const serializedProducts = products.map(p => ({
            ...p,
            _id: p._id.toString()
        }));

        // Passing the data to the interactive Client Component
        return <ShopClient initialProducts={serializedProducts} />;
        
    } catch (error) {
        console.error("Database connection failed during render:", error);
        
        // 🛡️ FAILSAFE: Agar database down ho, toh website crash nahi hogi, khali products dikhayegi
        return <ShopClient initialProducts={[]} />;
    }
}