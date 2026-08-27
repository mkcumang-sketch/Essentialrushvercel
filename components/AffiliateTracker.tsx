"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// =========================================================
// CORE TRACKING LOGIC
// =========================================================
function TrackerLogic() {
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      // Safely check for both 'ref' and 'agent' parameters (merging both tracker logics)
      const refCode = searchParams.get("ref") || searchParams.get("agent");

      if (refCode) {
        const cleanCode = refCode.trim().toUpperCase();
        
        // Unified storage key for the entire platform
        localStorage.setItem("essential_affiliate_ref", cleanCode);
      }
    } catch (error) {
      // Silently ignore storage errors (e.g., strict Safari ITP or Incognito mode limits)
      // to ensure the app never crashes for the end user.
    }
  }, [searchParams]);

  // This is a headless component, it renders nothing to the UI
  return null;
}

// =========================================================
// SUSPENSE WRAPPER (CRITICAL FOR SEO)
// =========================================================
export default function AffiliateTracker() {
  return (
    /* 
       Wrapping useSearchParams in Suspense prevents Next.js from 
       de-optimizing the entire layout/page to Client-Side Rendering (CSR). 
       This ensures your pages remain lightning fast for Googlebot.
    */
    <Suspense fallback={null}>
      <TrackerLogic />
    </Suspense>
  );
}