"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cartStoretemp";

export interface WatchProduct {
  _id: string;
  name: string;
  brand?: string;
  price: number;
  offerPrice?: number;
  slug?: string;
  imageUrl?: string;
  images?: string[];
  stock?: number;
}

interface NewArrivalsProps {
  initialLiveWatches?: WatchProduct[];
}

export default function NewArrivals({
  initialLiveWatches = [],
}: NewArrivalsProps) {
  const { addItem } = useCartStore();

  if (initialLiveWatches.length === 0) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-3xl font-bold">
          No Products Found
        </h2>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-10">
        New Arrivals
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {initialLiveWatches.map((product) => (
          <div
            key={product._id}
            className="border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition"
          >
            <div className="relative h-64 bg-gray-100">
              <Image
                src={
                  product.images?.[0] ||
                  product.imageUrl ||
                  "/placeholder.png"
                }
                alt={product.name}
                fill
                className="object-contain p-6"
              />
            </div>

            <div className="p-5">
              <p className="text-xs text-gray-500 uppercase">
                {product.brand ?? "Essential Rush"}
              </p>

              <h2 className="font-semibold mt-2 line-clamp-2">
                {product.name}
              </h2>

              <div className="mt-4 flex items-center gap-3">
                <span className="font-bold text-lg">
                  ₹{(product.offerPrice ?? product.price).toLocaleString()}
                </span>

                {product.offerPrice && (
                  <span className="line-through text-gray-400 text-sm">
                    ₹{product.price.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() =>
                    addItem({
                      _id: product._id,
                      name: product.name,
                      brand: product.brand,
                      price: product.price,
                      offerPrice: product.offerPrice,
                      imageUrl:
                        product.images?.[0] ||
                        product.imageUrl ||
                        "/placeholder.png",
                      stock: product.stock,
                      slug: product.slug,
                    })
                  }
                  className="flex-1 bg-black text-white rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-gray-800"
                >
                  <ShoppingCart size={18} />
                  Add
                </button>

                <Link
                  href={`/product/${product.slug || product._id}`}
                  className="flex-1 border rounded-xl py-3 text-center hover:bg-gray-100"
                >
                  View
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}