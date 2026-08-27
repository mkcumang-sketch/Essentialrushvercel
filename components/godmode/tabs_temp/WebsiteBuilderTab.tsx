"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Type, 
  Palette, 
  Share2, 
  Video, 
  Link as LinkIcon,
  RefreshCw,
  CheckCircle2
} from "lucide-react";

import type { HeroSlide, AboutConfig, UiConfig, SocialLinks } from "@/types/godmode";

// 🚀 STRICT TYPES: Removed 'any' from PremiumUploadNode
interface WebsiteBuilderTabProps {
  heroSlides: HeroSlide[];
  setHeroSlides: React.Dispatch<React.SetStateAction<HeroSlide[]>>;
  promoVideos: string[];
  setPromoVideos: React.Dispatch<React.SetStateAction<string[]>>;
  aboutConfig: AboutConfig;
  setAboutConfig: React.Dispatch<React.SetStateAction<AboutConfig>>;
  uiConfig: UiConfig;
  setUiConfig: React.Dispatch<React.SetStateAction<UiConfig>>;
  socialLinks: SocialLinks;
  setSocialLinks: React.Dispatch<React.SetStateAction<SocialLinks>>;
  handleSaveCMS: () => Promise<void>;
  PremiumUploadNode: React.ComponentType<{
    placeholder?: string;
    onUploadSuccess: (url: string) => void;
  }>;
}

export default function WebsiteBuilderTab({
  heroSlides,
  setHeroSlides,
  promoVideos,
  setPromoVideos,
  aboutConfig,
  setAboutConfig,
  uiConfig,
  setUiConfig,
  socialLinks,
  setSocialLinks,
  handleSaveCMS,
  PremiumUploadNode,
}: WebsiteBuilderTabProps) {
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddSlide = () => {
    setHeroSlides([
      ...heroSlides, 
      { id: Date.now(), type: "image", url: "", heading: "New Masterpiece" }
    ]);
  };

  const handleRemoveSlide = (id: number) => {
    setHeroSlides(heroSlides.filter((slide) => slide.id !== id));
  };

  // 🚀 APP-LIKE UX: Smooth saving simulation with feedback
  const onSaveClick = async () => {
    setIsSaving(true);
    try {
      await handleSaveCMS();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (error) {
      console.error("CMS Save Error", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8 pb-24 text-white"
    >
      {/* ========================================== */}
      {/* HEADER ACTION (APP-LIKE)                     */}
      {/* ========================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0a0a0a] p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.05),transparent_40%)] pointer-events-none" />
        <div className="relative z-10 mb-6 sm:mb-0">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#D4AF37] tracking-tight">Storefront Builder</h2>
          <p className="text-xs text-gray-400 mt-1.5 max-w-md leading-relaxed">
            Architect your luxury layout. Configure visual identity, promotional media slots, and cinematic hero banners.
          </p>
        </div>
        <button
          onClick={onSaveClick}
          disabled={isSaving}
          className="relative z-10 w-full sm:w-auto bg-[#D4AF37] text-black px-8 py-4 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.15)] disabled:opacity-50"
        >
          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RefreshCw size={16} className="animate-spin" />
              </motion.div>
            ) : showSuccess ? (
              <motion.div key="success" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <CheckCircle2 size={16} className="text-green-600" />
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Save size={16} />
              </motion.div>
            )}
          </AnimatePresence>
          {isSaving ? "Synchronizing..." : showSuccess ? "Published Live" : "Deploy Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: MEDIA ENGINE                  */}
        {/* ========================================== */}
        <div className="space-y-8">
          
          {/* PROMO MEDIA SLOTS */}
          <section className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-lg group">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-3 mb-2 text-white">
              <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]"><Video size={16} /></div>
              Cinematic Promo Slots
            </h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-8 font-bold">5 Priority Media Placements</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {promoVideos.map((videoUrl, index) => (
                <motion.div 
                  whileHover={{ y: -2 }}
                  key={index} 
                  className="p-5 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl flex flex-col items-center gap-5 transition-colors"
                >
                  <div className="w-full">
                    <PremiumUploadNode
                      placeholder={`Promo ${index + 1}`}
                      onUploadSuccess={(url: string) => {
                        const updated = [...promoVideos];
                        updated[index] = url;
                        setPromoVideos(updated);
                      }}
                    />
                  </div>
                  <div className="w-full">
                    <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl p-3 focus-within:border-[#D4AF37]/50 transition-colors">
                      <LinkIcon size={14} className="text-gray-500 shrink-0" />
                      <input
                        type="text"
                        value={videoUrl}
                        onChange={(e) => {
                          const updated = [...promoVideos];
                          updated[index] = e.target.value;
                          setPromoVideos(updated);
                        }}
                        className="w-full bg-transparent border-none focus:outline-none text-[10px] font-mono text-gray-300 placeholder:text-gray-600"
                        placeholder={`Direct URL for Slot ${index + 1}...`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* HERO SLIDES */}
          <section className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-lg">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
              <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-3 text-white">
                <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]"><ImageIcon size={16} /></div>
                Hero Banners
              </h3>
              <button 
                onClick={handleAddSlide} 
                className="text-[#D4AF37] bg-[#D4AF37]/10 px-4 py-2 rounded-lg hover:bg-[#D4AF37] hover:text-black transition-colors flex items-center gap-2 text-[9px] uppercase tracking-widest font-black"
              >
                <Plus size={14} /> Add Slide
              </button>
            </div>
            
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {heroSlides.map((slide, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={slide.id} 
                    className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col sm:flex-row gap-6 items-start hover:border-white/10 transition-colors relative"
                  >
                    <div className="w-full sm:w-32 shrink-0">
                      <PremiumUploadNode
                        placeholder="Hero Asset"
                        onUploadSuccess={(url: string) => {
                          const updated = [...heroSlides];
                          updated[index].url = url;
                          setHeroSlides(updated);
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 space-y-5 w-full">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Typography Heading</label>
                        <input
                          type="text"
                          value={slide.heading}
                          onChange={(e) => {
                            const updated = [...heroSlides];
                            updated[index].heading = e.target.value;
                            setHeroSlides(updated);
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#D4AF37]/50 text-sm font-serif text-white transition-colors"
                          placeholder="e.g., The Heritage Collection"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Asset URL</label>
                        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-3 focus-within:border-[#D4AF37]/50 transition-colors">
                          <LinkIcon size={14} className="text-gray-500 shrink-0" />
                          <input 
                            type="text"
                            value={slide.url}
                            onChange={(e) => {
                              const updated = [...heroSlides];
                              updated[index].url = e.target.value;
                              setHeroSlides(updated);
                            }}
                            className="w-full bg-transparent border-none focus:outline-none text-[10px] font-mono text-gray-300"
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-3">
                          <label className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Format</label>
                          <select
                            value={slide.type}
                            onChange={(e) => {
                              const updated = [...heroSlides];
                              updated[index].type = e.target.value as "image" | "video";
                              setHeroSlides(updated);
                            }}
                            className="bg-black border border-white/20 rounded-lg px-3 py-1.5 text-[10px] font-bold text-gray-300 uppercase tracking-widest outline-none focus:border-[#D4AF37]/50"
                          >
                            <option value="image">Image</option>
                            <option value="video">Cinematic Video</option>
                          </select>
                        </div>
                        <button 
                          onClick={() => handleRemoveSlide(slide.id)} 
                          className="text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[9px] uppercase font-bold tracking-widest transition-colors"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {heroSlides.length === 0 && (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <p className="text-gray-500 text-[10px] uppercase tracking-[3px] font-bold">No master slides configured.</p>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: BRANDING & IDENTITY          */}
        {/* ========================================== */}
        <div className="space-y-8">
          
          {/* UI CONFIGURATION */}
          <section className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-3 mb-8 text-white">
              <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]"><Palette size={16} /></div>
              Brand Identity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-3">Primary Accent (Hex)</label>
                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10 focus-within:border-[#D4AF37]/50 transition-colors">
                  <input
                    type="color"
                    value={uiConfig.primaryColor}
                    onChange={(e) => setUiConfig({ ...uiConfig, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={uiConfig.primaryColor}
                    onChange={(e) => setUiConfig({ ...uiConfig, primaryColor: e.target.value })}
                    className="bg-transparent border-none focus:outline-none w-full text-xs font-mono font-bold text-white uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-3">Core Typography</label>
                <select
                  value={uiConfig.fontFamily}
                  onChange={(e) => setUiConfig({ ...uiConfig, fontFamily: e.target.value as "serif" | "sans-serif" | "monospace" })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-[#D4AF37]/50 text-white transition-colors"
                >
                  <option value="serif">Serif (Classic Luxury)</option>
                  <option value="sans-serif">Sans Serif (Modern)</option>
                  <option value="monospace">Monospace (Technical)</option>
                </select>
              </div>
            </div>
          </section>

          {/* ABOUT SECTION */}
          <section className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-3 mb-8 text-white">
              <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]"><Type size={16} /></div>
              Heritage & Story
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-3">Manifesto Content</label>
                <textarea
                  value={aboutConfig.content}
                  onChange={(e) => setAboutConfig({ ...aboutConfig, content: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 min-h-[140px] focus:outline-none focus:border-[#D4AF37]/50 text-sm leading-relaxed text-gray-300 transition-colors resize-none"
                  placeholder="Draft your brand's heritage narrative here..."
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-3">Highlighted Emphasis (Comma separated)</label>
                <input
                  type="text"
                  value={aboutConfig.boldWords}
                  onChange={(e) => setAboutConfig({ ...aboutConfig, boldWords: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-[#D4AF37]/50 text-xs font-mono text-white transition-colors"
                  placeholder="e.g., Luxury, Excellence, Guaranteed"
                />
              </div>
            </div>
          </section>

          {/* SOCIAL LINKS */}
          <section className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-3 mb-8 text-white">
              <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]"><Share2 size={16} /></div>
              Digital Footprint
            </h3>
            <div className="space-y-4">
              {Object.keys(socialLinks).map((platform) => (
                <div key={platform} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="w-24 text-[9px] uppercase tracking-[3px] text-gray-500 font-black shrink-0">
                    {platform}
                  </label>
                  <div className="flex-1 flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 focus-within:border-[#D4AF37]/50 transition-colors">
                    <LinkIcon size={14} className="text-gray-500 shrink-0" />
                    <input
                      type="text"
                      value={socialLinks[platform as keyof SocialLinks]}
                      onChange={(e) => setSocialLinks({ ...socialLinks, [platform]: e.target.value })}
                      className="w-full bg-transparent border-none focus:outline-none text-[10px] font-mono text-white placeholder:text-gray-600"
                      placeholder={`https://${platform}.com/essential`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </motion.div>
  );
}