"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReferralTracker() {
    const searchParams = useSearchParams();

    useEffect(() => {
        // URL se ?ref=CODE ya ?agent=CODE dhoondho
        const refCode = searchParams.get('ref') || searchParams.get('agent');
        if (refCode) {
            // Code mila? Usko browser (localStorage) mein chup-chaap save kar do!
            localStorage.setItem('er_ref', refCode.toUpperCase());
            console.log("🔥 System Secured: Referral Code Locked ->", refCode);
        }
    }, [searchParams]);

    return null; // Ye screen par kuch nahi dikhayega
}