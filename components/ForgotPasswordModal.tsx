"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Key, Lock, ArrowRight, RefreshCw, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [step, setStep] = useState<1 | 2>(1); // Step 1: Email, Step 2: OTP & New Password
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    if (!isOpen) return null;

    // Email bhejne wala function
    const handleSendOtp = async () => {
        if (!email) return alert("Please enter your email");
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase() }) // Trimming and lowercasing
            });
            const data = await res.json();
            if (data.success) {
                alert("OTP sent to your email!");
                setStep(2); // Next screen par le jao
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert("Network error.");
        } finally {
            setIsLoading(false);
        }
    };

    // Naya password set karne wala function
    const handleResetPassword = async () => {
        if (!otp || !newPassword) return alert("Please fill all fields");
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Sending clean, trimmed data
                body: JSON.stringify({ 
                    email: email.trim().toLowerCase(), 
                    otp: otp.trim(), 
                    newPassword 
                })
            });
            const data = await res.json();
            if (data.success) {
                alert("Password changed successfully! You can now login.");
                // Reset state before closing
                setEmail('');
                setOtp('');
                setNewPassword('');
                setStep(1);
                onClose(); // Modal band kardo
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert("Network error.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="bg-[#0A0A0A] border border-[#D4AF37]/30 rounded-[2rem] p-8 w-full max-w-md text-white relative shadow-2xl"
            >
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                    <X size={20}/>
                </button>
                
                <h3 className="text-2xl font-serif italic font-black text-[#D4AF37] mb-2">Vault Recovery</h3>
                <p className="text-sm text-gray-400 mb-8">
                    {step === 1 ? "Enter your registered email to receive an access code." : "Enter the OTP sent to your email and create a new password."}
                </p>

                {step === 1 ? (
                    <div className="space-y-6">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input 
                                type="email" 
                                placeholder="Email Address" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                className="w-full p-4 pl-12 bg-[#141414] border border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-white transition-colors" 
                            />
                        </div>
                        <button onClick={handleSendOtp} disabled={isLoading} className="w-full py-4 bg-[#D4AF37] text-black hover:bg-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2">
                            {isLoading ? <RefreshCw size={16} className="animate-spin"/> : <>Send OTP <ArrowRight size={16}/></>}
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
                                // Auto-remove any accidental spaces or non-alphanumeric chars
                                onChange={(e) => setOtp(e.target.value.replace(/\s/g, ''))} 
                                className="w-full p-4 pl-12 bg-[#141414] border border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-white font-mono transition-colors tracking-[0.5em]" 
                                maxLength={6} 
                            />
                        </div>
                        <div className="relative mb-6">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input 
                                type="password" 
                                placeholder="New Password" 
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)} 
                                className="w-full p-4 pl-12 bg-[#141414] border border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-white transition-colors" 
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setStep(1)} 
                                disabled={isLoading}
                                className="px-4 bg-[#141414] border border-gray-800 text-gray-400 hover:text-white rounded-xl transition-all flex items-center justify-center"
                                title="Back to Email"
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <button onClick={handleResetPassword} disabled={isLoading} className="flex-1 py-4 bg-[#D4AF37] text-black hover:bg-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2">
                                {isLoading ? <RefreshCw size={16} className="animate-spin"/> : "Secure New Password"}
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}