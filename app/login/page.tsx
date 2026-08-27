"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Lock, User, Phone, ShieldCheck, ArrowRight, RefreshCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

export default function LoginPortal() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Status message state (UI Feedback)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const clearAlerts = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleGoogleLogin = async () => {
    clearAlerts();
    setIsLoading(true);

    const timeout = setTimeout(() => {
      setIsLoading(false);
      setErrorMessage("Google Sign-In timed out. Please check configuration.");
    }, 8000);

    try {
      await signIn("google", { callbackUrl: "/account" });
      clearTimeout(timeout);
    } catch {
      clearTimeout(timeout);
      setErrorMessage("Google Login service unavailable.");
      setIsLoading(false);
    }
  };

  // Sign Up Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!name || !phone || !password) {
      setErrorMessage("Please fill all details.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage("Account created successfully! Logging you in...");
        
        // Auto-login after registration
        const loginRes = await signIn("credentials", {
          redirect: false,
          phone: phone.trim(),
          password,
        });

        if (!loginRes?.error) {
          router.push("/account");
          router.refresh();
        } else {
          setIsLogin(true);
        }
      } else {
        setErrorMessage(data.error || "Registration failed. Try again.");
      }
    } catch (error) {
      console.error("Register Error:", error);
      setErrorMessage("Server error during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Manual Login Handler
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!phone || !password) {
      setErrorMessage("Please enter your phone number and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        phone: phone.trim(),
        password,
      });

      if (res?.error) {
        setErrorMessage(res.error || "Invalid login credentials.");
        setIsLoading(false);
      } else {
        setSuccessMessage("Vault verified. Redirecting...");
        router.push("/account");
        router.refresh();
      }
    } catch (err) {
      console.error("Login Error:", err);
      setErrorMessage("Login system offline. Check network connection.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-gray-900 selection:bg-gray-200 relative overflow-hidden">
      <header className="p-6 md:p-12 w-full absolute top-0 left-0 z-10">
        <Link href="/" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors w-max">
          <ArrowLeft size={16} /> Back to Store
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 mt-16 relative z-10">
        <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100">
          <div className="text-center mb-8">
            <ShieldCheck size={40} className="mx-auto text-black mb-4" strokeWidth={1} />
            <h1 className="text-3xl font-serif mb-2">
              {isLogin ? "Welcome Back" : "Join Essential"}
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              {isLogin ? "Access your private vault." : "Create your luxury account."}
            </p>
          </div>

          {/* Feedback UI Messages */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-3">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded-2xl flex items-center gap-3">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-8 border border-gray-100">
            <button
              type="button"
              onClick={() => { clearAlerts(); setIsLogin(true); }}
              disabled={isLoading}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 ${isLogin ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-black"}`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { clearAlerts(); setIsLogin(false); }}
              disabled={isLoading}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 ${!isLogin ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-black"}`}
            >
              Sign Up
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full mb-6 py-4 px-6 border border-gray-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Continue with Google</span>
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-gray-100 flex-1" />
            <span className="text-[10px] uppercase tracking-widest text-gray-300 font-bold">OR</span>
            <div className="h-px bg-gray-100 flex-1" />
          </div>

          <form onSubmit={isLogin ? handleManualLogin : handleRegister} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><User size={18} /></div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-black transition-all disabled:opacity-50"
                  placeholder="Full Name"
                />
              </div>
            )}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Phone size={18} /></div>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isLoading}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-black transition-all disabled:opacity-50"
                placeholder="Phone Number / Email"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Lock size={18} /></div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-black transition-all disabled:opacity-50"
                placeholder="Password"
              />
            </div>

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[10px] text-gray-400 hover:text-black font-bold uppercase tracking-widest"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 mt-4 bg-black text-white font-bold uppercase tracking-[4px] text-[10px] rounded-2xl hover:bg-[#D4AF37] hover:text-black transition-all flex justify-center items-center gap-3 disabled:opacity-70 group shadow-xl active:scale-[0.98]"
            >
              {isLoading ? (
                <RefreshCcw size={16} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign in" : "Create account"}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-50">
            <p className="text-[9px] text-gray-400 text-center uppercase tracking-[2px] leading-relaxed">
              Your sign-in is <span className="text-black font-black">256-bit encrypted</span>
            </p>
          </div>
        </div>
      </main>

      <footer className="p-10 text-center">
        <p className="text-[10px] font-black uppercase tracking-[5px] text-gray-300">© 2026 Essential Rush</p>
      </footer>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </div>
  );
}