"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Key, Lock, ArrowRight, RefreshCw, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const clearAlerts = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleModalClose = () => {
    clearAlerts();
    setEmail("");
    setOtp("");
    setNewPassword("");
    setStep(1);
    onClose();
  };

  // 🛡️ Clipboard Hijacking Defense: Sanitize pasted OTP
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    const cleanNumbers = pastedData.replace(/[^0-9]/g, "").slice(0, 6);
    setOtp(cleanNumbers);
  };

  // 1. Send OTP Request
  const handleSendOtp = async () => {
    clearAlerts();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage("Security passcode dispatched to your email.");
        setTimeout(() => {
          clearAlerts();
          setStep(2);
        }, 800);
      } else {
        setErrorMessage(data.message || data.error || "Failed to dispatch recovery code.");
      }
    } catch {
      setErrorMessage("Network error. Please verify your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify OTP & Reset Password
  const handleResetPassword = async () => {
    clearAlerts();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim().replace(/[^0-9]/g, "");

    if (cleanOtp.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit OTP.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanOtp,
          newPassword: newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage("Password updated successfully! Redirecting...");
        setTimeout(() => {
          handleModalClose();
        }, 1200);
      } else {
        setErrorMessage(data.message || data.error || "Invalid or expired passcode.");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0A0A0A] border border-[#D4AF37]/30 rounded-[2rem] p-8 w-full max-w-md text-white relative shadow-2xl"
      >
        <button
          onClick={handleModalClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full"
        >
          <X size={18} />
        </button>

        <h3 className="text-2xl font-serif italic font-black text-[#D4AF37] mb-2">Vault Recovery</h3>
        <p className="text-sm text-gray-400 mb-6">
          {step === 1
            ? "Enter your registered email to receive an access code."
            : "Enter the OTP sent to your email and create a new password."}
        </p>

        {/* Dynamic UI Status Alerts */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-3.5 bg-red-950/40 border border-red-800/50 text-red-300 text-xs rounded-xl flex items-center gap-2.5"
            >
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-3.5 bg-green-950/40 border border-green-800/50 text-green-300 text-xs rounded-xl flex items-center gap-2.5"
            >
              <CheckCircle2 size={16} className="shrink-0 text-green-400" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {step === 1 ? (
          <div className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                disabled={isLoading}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 pl-12 bg-[#141414] border border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-white transition-colors disabled:opacity-50 text-sm"
              />
            </div>
            <button
              onClick={handleSendOtp}
              disabled={isLoading}
              className="w-full py-4 bg-[#D4AF37] text-black hover:bg-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 disabled:opacity-60"
            >
              {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <>Send OTP <ArrowRight size={16} /></>}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="6-Digit OTP"
                value={otp}
                maxLength={6}
                disabled={isLoading}
                onPaste={handleOtpPaste}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full p-4 pl-12 bg-[#141414] border border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-white font-mono transition-colors tracking-[0.4em] text-center disabled:opacity-50"
              />
            </div>

            <div className="relative mb-6">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="password"
                placeholder="New Password (min 6 chars)"
                value={newPassword}
                disabled={isLoading}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-4 pl-12 bg-[#141414] border border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-white transition-colors disabled:opacity-50 text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  clearAlerts();
                  setStep(1);
                }}
                disabled={isLoading}
                className="px-4 bg-[#141414] border border-gray-800 text-gray-400 hover:text-white rounded-xl transition-all flex items-center justify-center disabled:opacity-50"
                title="Back to Email"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={handleResetPassword}
                disabled={isLoading}
                className="flex-1 py-4 bg-[#D4AF37] text-black hover:bg-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 disabled:opacity-60"
              >
                {isLoading ? <RefreshCw size={16} className="animate-spin" /> : "Secure New Password"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}