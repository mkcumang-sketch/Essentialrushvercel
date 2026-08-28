"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Star, X, CheckCircle, EyeOff, ShieldCheck, Sparkles, MessageSquare } from 'lucide-react';
import type { ManualReview } from '@/types/godmode';

export interface ReviewEntry {
  _id: string;
  userName: string;
  rating: number;
  comment: string;
  visibility: string;
  media?: string[];
  [key: string]: unknown;
}

interface ReviewsProps {
  manualReview: ManualReview;
  setManualReview: (review: ManualReview) => void;
  handleAddManualReview: () => void;
  allReviews: ReviewEntry[];
  handleUpdateReviewStatus: (id: string, status: string) => void;
  handleDeleteReview: (id: string) => void;
  PremiumUploadNode: React.ComponentType<{ placeholder?: string; onUploadSuccess: (url: string) => void }>;
}

export default function ReviewsTab({
  manualReview,
  setManualReview,
  handleAddManualReview,
  allReviews,
  handleUpdateReviewStatus,
  handleDeleteReview,
  PremiumUploadNode,
}: ReviewsProps) {
  const [activeMediaPreview, setActiveMediaPreview] = useState<string | null>(null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full pb-20 font-sans text-white">
      {/* LEFT COLUMN: MANUAL FEEDBACK INJECTION */}
      <div className="lg:col-span-4 space-y-6 w-full">
        <div className="bg-[#0a0a0a] p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Sparkles size={16} className="text-[#D4AF37]" />
            <h3 className="text-base font-bold text-white">Inject Verified Review</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[9px] uppercase tracking-widest text-gray-500 font-bold block mb-1">Client Alias</label>
              <input 
                value={manualReview.userName} 
                onChange={e => setManualReview({ ...manualReview, userName: e.target.value })} 
                className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs text-white outline-none focus:border-[#D4AF37]" 
                placeholder="e.g. Vikramaditya S." 
              />
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-widest text-gray-500 font-bold block mb-1">Rating Tier</label>
              <select 
                value={manualReview.rating} 
                onChange={e => setManualReview({ ...manualReview, rating: Number(e.target.value) })} 
                className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs text-[#D4AF37] font-bold outline-none focus:border-[#D4AF37]"
              >
                <option value={5}>5 Stars - Flawless Quality</option>
                <option value={4}>4 Stars - High Satisfaction</option>
                <option value={3}>3 Stars - Standard Fulfillment</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-widest text-gray-500 font-bold block mb-1">Review Statement</label>
              <textarea 
                value={manualReview.comment} 
                onChange={e => setManualReview({ ...manualReview, comment: e.target.value })} 
                rows={4} 
                className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs text-white outline-none focus:border-[#D4AF37] resize-none leading-relaxed" 
                placeholder="Compose customer feedback structure..." 
              />
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                Evidence Attachments ({manualReview.media?.length || 0}/3)
              </label>
              <div className="flex gap-2 items-center flex-wrap">
                {manualReview.media && manualReview.media.map((url: string, idx: number) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/20 shadow-lg group">
                    <img src={url} className="w-full h-full object-cover" alt="Media" />
                    <button 
                      type="button"
                      onClick={() => setManualReview({ ...manualReview, media: manualReview.media?.filter((x: string) => x !== url) })} 
                      className="absolute inset-0 bg-red-600/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                {(!manualReview.media || manualReview.media.length < 3) && (
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-black">
                    <PremiumUploadNode 
                      placeholder="Add" 
                      onUploadSuccess={(url: string) => setManualReview({ ...manualReview, media: [...(manualReview.media || []), url] })} 
                    />
                  </div>
                )}
              </div>
            </div>

            <button 
              type="button"
              onClick={handleAddManualReview} 
              className="w-full py-3.5 bg-[#D4AF37] hover:bg-white text-black font-black uppercase tracking-widest rounded-xl text-[10px] transition-all mt-2 cursor-pointer shadow-lg"
            >
              Publish Verified Feedback
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: REVIEWS STREAM */}
      <div className="lg:col-span-8 bg-[#0a0a0a] p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-[#D4AF37]" />
            <h3 className="text-lg font-serif font-bold text-white">Live Feedback Stream</h3>
          </div>
          <span className="font-mono text-xs text-gray-400">{allReviews.length} Submissions</span>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {allReviews.length === 0 ? (
            <p className="text-center text-gray-500 font-bold uppercase tracking-widest py-16 text-xs">
              No customer reviews recorded.
            </p> 
          ) : (
            allReviews.map((rev) => (
              <div 
                key={rev._id} 
                className={`bg-white/[0.02] border p-5 rounded-2xl flex flex-col md:flex-row justify-between gap-5 transition-all ${
                  rev.visibility === 'pending' ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5' : 'border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h4 className="font-bold text-white text-sm">{rev.userName}</h4>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                      rev.visibility === 'public' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                        : rev.visibility === 'pending' 
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40 animate-pulse' 
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}>
                      {rev.visibility || 'STANDBY'}
                    </span>
                  </div>

                  <div className="flex gap-1 text-[#D4AF37]">
                    {[...Array(rev.rating || 5)].map((_, idx) => (
                      <Star key={idx} size={12} fill="currentColor" />
                    ))}
                  </div>

                  <p className="text-gray-300 text-xs leading-relaxed">"{rev.comment}"</p>

                  {rev.media && rev.media.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {rev.media.map((m: string, idx: number) => (
                        <div 
                          key={idx} 
                          onClick={() => setActiveMediaPreview(m)}
                          className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-[#D4AF37]"
                        >
                          <img src={m} className="w-full h-full object-cover" alt="Review Media" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col gap-2 justify-center shrink-0 pt-2 md:pt-0">
                  <button 
                    type="button"
                    onClick={() => handleUpdateReviewStatus(rev._id, 'public')} 
                    className="px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-black rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <CheckCircle size={11} /> Validate
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleUpdateReviewStatus(rev._id, 'hidden')} 
                    className="px-3 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-black rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <EyeOff size={11} /> Suppress
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleDeleteReview(rev._id)} 
                    className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Trash2 size={11} /> Erase
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MEDIA PREVIEW MODAL */}
      {activeMediaPreview && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setActiveMediaPreview(null)}>
          <div className="max-w-md w-full bg-[#111] p-4 rounded-3xl border border-white/20 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActiveMediaPreview(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X size={18} />
            </button>
            <img src={activeMediaPreview} alt="Enlarged review attachment" className="w-full h-auto rounded-2xl" />
          </div>
        </div>
      )}
    </motion.div>
  );
}