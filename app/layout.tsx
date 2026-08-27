import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";

// 🚀 FIX: Tumhara apna CombinedProviders import karo (Path apne hisaab se adjust kar lena agar alag folder mein hai)
import { CombinedProviders } from "@/components/Providers"; 
import AffiliateTracker from "@/components/AffiliateTracker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Essential Rush | Fine Horology",
  description: "Luxury Watches & Timepieces",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        
        {/* 🚀 Tumhara Existing Provider jo Session, Cart aur Toaster handle karega */}
        <CombinedProviders>
          
          {/* 🚀 Invisible Affiliate Tracker */}
          <Suspense fallback={null}>
            <AffiliateTracker />
          </Suspense>

          {/* Main App Content */}
          {children}

        </CombinedProviders>
        
      </body>
    </html>
  );
}