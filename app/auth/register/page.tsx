"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, RefreshCcw, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!firstName || !emailOrPhone || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const isEmail = emailOrPhone.includes("@");

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email: isEmail ? emailOrPhone.trim().toLowerCase() : undefined,
          phone: !isEmail ? emailOrPhone.trim() : undefined,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess("Account created successfully! Logging you in...");
        
        const loginRes = await signIn("credentials", {
          redirect: false,
          phone: emailOrPhone.trim(),
          password,
        });

        if (!loginRes?.error) {
          router.push("/account");
          router.refresh();
        } else {
          router.push("/auth/signin");
        }
      } else {
        setError(data.error || data.message || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Register Error:", err);
      setError("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* LEFT: VISUAL */}
      <div className="hidden md:block relative bg-black">
        <img 
          src="https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1500" 
          className="absolute inset-0 w-full h-full object-cover opacity-60" 
          alt="Register Visual"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Start Your Legacy.</h2>
          <p className="text-gray-400 tracking-wide font-light border-l-2 border-[#D32F2F] pl-4">
            Create an account to track orders, save wishlists, and receive exclusive offers.
          </p>
        </div>
      </div>

      {/* RIGHT: FORM */}
      <div className="flex items-center justify-center bg-white p-8 md:p-16 pt-32">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Create Account</h1>
            <p className="text-gray-500 text-sm">Join the Essential Rush elite club.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-3">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-center gap-3">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">First Name</label>
                <input 
                  type="text" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full border-b-2 border-gray-200 py-3 focus:outline-none focus:border-[#D32F2F] transition-colors font-medium text-sm disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Last Name</label>
                <input 
                  type="text" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  className="w-full border-b-2 border-gray-200 py-3 focus:outline-none focus:border-[#D32F2F] transition-colors font-medium text-sm disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Email or Phone Number</label>
              <input 
                type="text" 
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
                disabled={loading}
                placeholder="name@example.com / +91..."
                className="w-full border-b-2 border-gray-200 py-3 focus:outline-none focus:border-[#D32F2F] transition-colors font-medium text-sm disabled:opacity-50"
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
                placeholder="••••••••"
                className="w-full border-b-2 border-gray-200 py-3 focus:outline-none focus:border-[#D32F2F] transition-colors font-medium text-sm disabled:opacity-50"
              />
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
                  Register <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs font-bold uppercase text-gray-400">
            Already a member? <Link href="/auth/signin" className="text-black border-b border-black pb-0.5 hover:text-[#D32F2F] hover:border-[#D32F2F] transition-all">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}