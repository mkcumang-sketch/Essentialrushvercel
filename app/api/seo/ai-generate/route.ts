export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        // 1. AUTHENTICATION & AUTHORIZATION
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;

        if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: "Unauthorized access. Elevated privileges required." }, 
                { status: 403 }
            );
        }

        // 2. PARSE REQUEST DATA
        const body = await req.json();
        const { 
            name, 
            description, 
            brand = 'Essential', 
            category = 'Fine Horology' 
        } = body;

        // Normalize core attributes
        const productName = name ? name.trim() : 'Exclusive Timepiece';
        const cleanBrand = brand.trim();
        const cleanCategory = category.trim();

        // 3. SMART SEO SYNTHESIZER (Premium Luxury Tone)
        
        // Dynamic Title Variations
        const titleVariations = [
            `${productName} | Luxury ${cleanCategory} | ${cleanBrand}`,
            `Discover ${productName} - Exclusive Horology | ${cleanBrand}`,
            `${cleanBrand} ${productName} | Masterpiece Collection`,
            `Buy ${productName} | Premium ${cleanCategory} by ${cleanBrand}`
        ];
        const metaTitle = titleVariations[Math.floor(Math.random() * titleVariations.length)];

        // Dynamic Description (Mixes user's description if available)
        let rawDescription = "";
        if (description && description.trim().length > 20) {
            // Take first ~100 chars of actual description and append luxury CTA
            const shortDesc = description.substring(0, 100).trim() + "...";
            rawDescription = `${shortDesc} Secure this exquisite ${productName} by ${cleanBrand} today. Elevate your collection.`;
        } else {
            rawDescription = `Discover the exclusive ${productName} by ${cleanBrand}. A true masterpiece of ${cleanCategory.toLowerCase()}, featuring exquisite craftsmanship and unparalleled elegance. Secure your luxury acquisition today.`;
        }

        // Enforce SEO best practice (Max 160 characters for Meta Description)
        const metaDescription = rawDescription.length > 160 
            ? rawDescription.substring(0, 157) + "..." 
            : rawDescription;

        // Dynamic Keywords
        const baseKeywords = [
            `${cleanBrand} ${productName}`,
            `buy ${productName}`,
            `luxury ${cleanCategory.toLowerCase()}`,
            `${cleanBrand} watches`,
            `premium timepieces`
        ];
        const focusKeyword = baseKeywords.join(", ");

        // 4. COMPILE PAYLOAD
        const seoData = {
            metaTitle,
            metaDescription,
            focusKeyword
        };

        // 5. ARTIFICIAL UX DELAY (Mimics complex AI processing for the frontend Godmode UI)
        await new Promise((resolve) => setTimeout(resolve, 1200));

        // 6. SUCCESS RESPONSE
        return NextResponse.json({ 
            success: true, 
            data: seoData 
        });

    } catch (error: any) {
        console.error("Local SEO Generation Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to synthesize SEO intelligence locally." }, 
            { status: 500 }
        );
    }
}