import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";

import { CombinedProviders } from "@/components/Providers"; 
import AffiliateTracker from "@/components/AffiliateTracker";
import AiErrorBoundary from "@/components/AiErrorBoundary";
import AskMyrioWidget from "@/components/customer/AskMyrioWidget";

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
        
        {/* Combined Providers for Session, Cart & Notifications */}
        <CombinedProviders>
          
          {/* AI-Powered Global Error Boundary */}
          <AiErrorBoundary>
            
            {/* Invisible Affiliate Referral Tracker */}
            <Suspense fallback={null}>
              <AffiliateTracker />
            </Suspense>

            {/* Main App Storefront & Admin Content */}
            {children}

            {/* Customer MYRIO AI Chatbot Floating Widget */}
            <AskMyrioWidget />
            
          </AiErrorBoundary>

        </CombinedProviders>
        
      </body>
    </html>
  );
}