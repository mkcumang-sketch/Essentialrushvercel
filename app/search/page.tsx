"use client";

import React, { useState } from 'react';
import { Search, Mic, Camera, Grip, Settings, MoreVertical } from 'lucide-react';
import Link from 'next/link';

export default function GoogleSearchDark() {
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'Images', 'Shopping', 'News', 'Videos', 'More'];

  return (
    <div className="min-h-screen bg-[#202124] text-[#bdc1c6] font-sans selection:bg-[#8ab4f8] selection:text-black">
      
      {/* 1. TOP HEADER & SEARCH BAR */}
      <header className="pt-6 px-4 md:px-8 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Google Logo (Text Based) */}
          <div className="text-2xl font-medium tracking-tighter mr-8 bg-white px-2 py-1 rounded-md hidden md:block">
            <span className="text-[#4285f4]">G</span>
            <span className="text-[#ea4335]">o</span>
            <span className="text-[#fbbc05]">o</span>
            <span className="text-[#4285f4]">g</span>
            <span className="text-[#34a853]">l</span>
            <span className="text-[#ea4335]">e</span>
          </div>
          {/* Mobile Avatar */}
          <div className="md:hidden w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold text-white">U</div>
        </div>

        {/* Search Input Box */}
        <div className="flex-1 w-full max-w-[690px] relative">
          <div className="flex items-center bg-[#303134] rounded-full px-4 py-2.5 border border-transparent hover:bg-[#303134] hover:shadow-[0_1px_6px_rgba(23,23,23,0.8)] focus-within:bg-[#303134] focus-within:shadow-[0_1px_6px_rgba(23,23,23,0.8)] focus-within:border-[#5f6368] transition-all">
            <Search className="w-4 h-4 text-[#9aa0a6] mr-3" />
            <input 
              type="text" 
              defaultValue="Aurelius Watches" 
              className="flex-1 bg-transparent border-none outline-none text-[#e8eaed] text-base" 
            />
            <div className="flex items-center gap-4 ml-3">
              <Mic className="w-5 h-5 text-[#8ab4f8] cursor-pointer" />
              <Camera className="w-5 h-5 text-[#8ab4f8] cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Desktop Right Icons */}
        <div className="hidden md:flex ml-auto items-center gap-4">
          <Settings className="w-5 h-5 text-[#e8eaed] cursor-pointer hover:text-white" />
          <Grip className="w-5 h-5 text-[#e8eaed] cursor-pointer hover:text-white" />
          <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-lg font-bold text-white cursor-pointer ring-2 ring-transparent hover:ring-[#5f6368] transition-all">
            U
          </div>
        </div>
      </header>

      {/* 2. SEARCH TABS */}
      <div className="border-b border-[#3c4043] mt-4">
        <div className="flex items-center gap-6 px-4 md:pl-[140px] overflow-x-auto scrollbar-hide text-sm text-[#9aa0a6]">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1 pb-3 transition-colors ${
                activeTab === tab 
                  ? 'text-[#8ab4f8] border-b-[3px] border-[#8ab4f8] font-medium' 
                  : 'border-b-[3px] border-transparent hover:text-[#e8eaed]'
              }`}
            >
              {tab === 'All' && <Search className="w-4 h-4" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN SEARCH RESULTS */}
      <main className="px-4 py-6 md:pl-[140px] max-w-[720px]">
        
        {/* Sponsored Result Card */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-[#e8eaed]">Sponsored</span>
            <MoreVertical className="w-4 h-4 text-[#9aa0a6] cursor-pointer ml-auto" />
          </div>
          
          <div className="flex items-center gap-3 mb-2">
             <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-black text-sm font-bold">♛</div>
             <div>
               <p className="text-sm text-[#dadce0] leading-none">Aurelius Watches</p>
               <p className="text-[12px] text-[#bdc1c6] leading-none mt-1">https://www.aurelius.com</p>
             </div>
          </div>

          <Link href="/" className="block group mt-3">
            <h2 className="text-[22px] text-[#8ab4f8] group-hover:underline mb-1">Aurelius® Watches - Official Luxury Timepieces</h2>
            <p className="text-sm text-[#bdc1c6] leading-[1.58]">
              Reliability and Performance. Only through exacting standards, exemplary timepieces from Watches that can be more. Experience the art of Swiss watchmaking and discover our new 2026 collection.
            </p>
          </Link>
        </div>

        <div className="h-[1px] w-full bg-[#3c4043] my-6"></div>

        {/* Sitelinks (Links below the main result) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 ml-0 md:ml-6">
          
          <Link href="/" className="group block cursor-pointer">
            <h3 className="text-lg text-[#8ab4f8] group-hover:underline mb-1">The Collection</h3>
            <p className="text-sm text-[#bdc1c6] line-clamp-2">Discover the broad selection of prestigious, high-precision timepieces.</p>
          </Link>

          <Link href="/" className="group block cursor-pointer">
            <h3 className="text-lg text-[#8ab4f8] group-hover:underline mb-1">Store Locator</h3>
            <p className="text-sm text-[#bdc1c6] line-clamp-2">Only official retailers are allowed to sell and maintain your watch.</p>
          </Link>

          <Link href="/" className="group block cursor-pointer">
            <h3 className="text-lg text-[#8ab4f8] group-hover:underline mb-1">Oyster Architecture</h3>
            <p className="text-sm text-[#bdc1c6] line-clamp-2">A perfect alchemy of form and function, aesthetics and technology.</p>
          </Link>

          <Link href="/" className="group block cursor-pointer">
            <h3 className="text-lg text-[#8ab4f8] group-hover:underline mb-1">New 2026 Models</h3>
            <p className="text-sm text-[#bdc1c6] line-clamp-2">Explore the latest creations pushing the boundaries of watchmaking.</p>
          </Link>

        </div>

      </main>
    </div>
  );
}