'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, AlertTriangle } from 'lucide-react';

export default function GodmodeLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'SUPER_ADMIN') {
        setAccessDenied(true);
        setTimeout(() => router.replace('/'), 3000);
      }
    }
  }, [status, session, router]);

  // ── Loading ──────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37]/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-[#D4AF37] animate-spin"></div>
          <ShieldCheck className="absolute inset-0 m-auto text-[#D4AF37]" size={24} />
        </div>
        <div className="text-center">
          <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[6px] mb-2">
            Essential Rush
          </p>
          <p className="text-white/50 text-sm">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  // ── Access Denied ────────────────────────────────────────
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <AlertTriangle className="text-red-400" size={36} />
        </div>
        <div className="text-center">
          <p className="text-red-400 text-[10px] font-bold uppercase tracking-[6px] mb-3">
            Access Denied
          </p>
          <h2 className="text-white text-2xl font-serif font-bold mb-2">
            Unauthorized
          </h2>
          <p className="text-white/40 text-sm max-w-xs">
            You do not have permission to access this area. Redirecting you home...
          </p>
        </div>
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 rounded-full animate-[shrink_3s_linear_forwards]"></div>
        </div>
      </div>
    );
  }

  // ── Not authorized (no session) ──────────────────────────
  if (!session || (session?.user as any)?.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <Lock className="text-white/30" size={28} />
        </div>
        <p className="text-white/30 text-sm">Restricted area</p>
      </div>
    );
  }

  // ── Authorized ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050505] w-full">
      {/* Admin top bar */}
      <div className="w-full bg-[#D4AF37]/10 border-b border-[#D4AF37]/20 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#D4AF37]" />
          <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[4px]">
            God Mode — Super Admin
          </span>
        </div>
        <span className="text-white/30 text-[10px] font-mono">
          {(session.user as any)?.email || (session.user as any)?.name || 'Admin'}
        </span>
      </div>

      {children}
    </div>
  );
}