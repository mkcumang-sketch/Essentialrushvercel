"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Loader2 } from 'lucide-react';

// =========================================================
// STRICT INTERFACES (NO 'any')
// =========================================================
interface AdminSessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string; // Explicitly defining the role property
}

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Safely cast user to our strict interface instead of 'any'
  const user = session?.user as AdminSessionUser | undefined;
  
  // Accept both SUPER_ADMIN and ADMIN if you have tiering, or restrict to just SUPER_ADMIN
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  useEffect(() => {
    if (status === "loading") return;
    
    // If not authenticated or not an admin, trigger smooth redirect
    if (!session || !isAdmin) {
      setIsRedirecting(true);
      
      // Luxury UX: Allow the "Access Denied" animation to play before harsh routing
      const timer = setTimeout(() => {
         router.replace("/login");
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [session, status, isAdmin, router]);

  // =========================================================
  // LUXURY LOADING & REDIRECTING STATE
  // =========================================================
  if (status === "loading" || isRedirecting) {
    return (
      <div className="min-h-[100dvh] bg-[#0B0E11] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05),transparent_50%)] pointer-events-none" />
        
        <AnimatePresence mode="wait">
          {isRedirecting ? (
             <motion.div 
                key="unauthorized"
                initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center z-10 text-center"
             >
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center text-red-500 mb-6 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                  <ShieldAlert size={36} />
                </div>
                <h2 className="text-3xl font-serif italic font-bold text-white mb-3 tracking-tight">Access Denied</h2>
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-black">
                  Redirecting to Secure Gateway...
                </p>
             </motion.div>
          ) : (
             <motion.div 
                key="verifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center z-10"
             >
                <div className="relative mb-8">
                  <div className="w-16 h-16 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                    <span className="text-[#D4AF37] text-3xl font-black">♞</span>
                  </div>
                  {/* Rotating Bezel Effect */}
                  <Loader2 size={84} className="absolute -inset-2.5 text-[#D4AF37]/40 animate-spin" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 animate-pulse">
                  Verifying Security Clearance...
                </p>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 🚨 FINAL RENDER BLOCKER (Safety Catch before showing protected UI)
  if (!session || !isAdmin) return null;

  return <>{children}</>;
}