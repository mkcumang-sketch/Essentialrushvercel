"use client";

import React, { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

// =========================================================
// STRICT GLOBAL TYPES FOR EXTERNAL TRACKERS
// =========================================================
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// =========================================================
// DYNAMIC ROUTE TRACKER
// =========================================================
function RouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Reconstruct the full URL
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    
    // 1. Trigger GA4 Page View on Next.js soft navigation
    if (typeof window.gtag === 'function' && process.env.NEXT_PUBLIC_GA_ID) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: url,
      });
    }

    // 2. Trigger Meta Pixel Page View on Next.js soft navigation
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [pathname, searchParams]);

  return null;
}

// =========================================================
// MAIN ANALYTICS COMPONENT
// =========================================================
export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  // Don't render anything if no IDs are provided
  if (!gaId && !metaPixelId) return null;

  return (
    <>
      {/* 
        Suspense is critical here. Without it, useSearchParams() 
        would force the entire layout into Client-Side Rendering (CSR). 
      */}
      <Suspense fallback={null}>
        <RouteTracker />
      </Suspense>

      {/* ==================== GA4 SCRIPT ==================== */}
      {gaId && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <Script id="ga4-inline" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {/* ==================== META PIXEL ==================== */}
      {metaPixelId && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(n,arguments)};
              if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
              s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              
              fbq('init', '${metaPixelId}');
              // Initial page load is handled here, subsequent loads are handled by RouteTracker
              fbq('track', 'PageView'); 
            `}
          </Script>
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              alt="Meta Pixel Tracker"
            />
          </noscript>
        </>
      )}
    </>
  );
}