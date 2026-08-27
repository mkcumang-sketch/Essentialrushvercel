"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, RefreshCcw, AlertCircle } from "lucide-react";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

export default function SignIn() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier || !password) {
      setError("Please enter your email/phone and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        phone: identifier.trim(),
        email: identifier.trim(),
        password: password,
      });

      if (res?.error) {
        setError(res.error || "Invalid login credentials.");
        setLoading(false);
      } else {
        router.push("/account");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError("Failed to sign in. Check network connection.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* LEFT: VISUAL */}
      <div className="hidden md:block relative bg-black">
        <img 
          src="https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?q=80&w=1500" 
          className="absolute inset-0 w-full h-full object-cover opacity-60" 
          alt="Login Visual"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Join Essential Rush</h2>
          <p className="text-gray-400 tracking-wide font-light border-l-2 border-[#D32F2F] pl-4">
            Member prices, faster shipping, and help when you need it.
          </p>
        </div>
      </div>

      {/* RIGHT: FORM */}
      <div className="flex items-center justify-center bg-white p-8 md:p-16 pt-32">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Welcome Back</h1>
            <p className="text-gray-500 text-sm">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-3">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Email or Phone Number</label>
              <input 
                type="text" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={loading}
                className="w-full border-b-2 border-gray-200 py-3 focus:outline-none focus:border-[#D32F2F] transition-colors text-base font-medium disabled:opacity-50"
                placeholder="name@example.com / +91..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full border-b-2 border-gray-200 py-3 focus:outline-none focus:border-[#D32F2F] transition-colors text-base font-medium disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>

            <div className="flex justify-between items-center text-xs font-bold uppercase text-gray-400">
              <label className="flex items-center gap-2 cursor-pointer hover:text-black">
                <input type="checkbox" className="accent-[#D32F2F]" /> Remember me
              </label>
              <button 
                type="button" 
                onClick={() => setShowForgotModal(true)} 
                className="hover:text-[#D32F2F] transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#111] text-white py-5 font-bold uppercase tracking-[0.2em] text-xs hover:bg-[#D32F2F] transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <RefreshCcw size={16} className="animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs font-bold uppercase text-gray-400">
            Not a member? <Link href="/auth/register" className="text-black border-b border-black pb-0.5 hover:text-[#D32F2F] hover:border-[#D32F2F] transition-all">Create Account</Link>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </div>
  );
}