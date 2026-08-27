"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Register() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      
      {/* 🖼️ LEFT: VISUAL */}
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

      {/* 📝 RIGHT: FORM */}
      <div className="flex items-center justify-center bg-white p-8 md:p-16 pt-32">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Create Account</h1>
            <p className="text-gray-500 text-sm">Join the Essential Rush elite club.</p>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">First Name</label>
                    <input type="text" className="w-full border-b-2 border-gray-200 py-3 focus:outline-none focus:border-[#D32F2F] transition-colors font-medium"/>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Last Name</label>
                    <input type="text" className="w-full border-b-2 border-gray-200 py-3 focus:outline-none focus:border-[#D32F2F] transition-colors font-medium"/>
                </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Email Address</label>
              <input type="email" className="w-full border-b-2 border-gray-200 py-3 focus:outline-none focus:border-[#D32F2F] transition-colors font-medium"/>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Password</label>
              <input type="password" className="w-full border-b-2 border-gray-200 py-3 focus:outline-none focus:border-[#D32F2F] transition-colors font-medium"/>
            </div>

            <button className="w-full bg-[#111] text-white py-5 font-bold uppercase tracking-[0.2em] hover:bg-[#D32F2F] transition-colors flex justify-center items-center gap-2">
              Register <ArrowRight size={18} />
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