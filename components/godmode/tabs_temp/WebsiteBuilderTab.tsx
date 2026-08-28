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
  CheckCircle2,
  Sparkles
} from "lucide-react";

import type { HeroSlide, AboutConfig, UiConfig, SocialLinks } from "@/types/godmode";

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
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-24 text-white font-sans"
    >
      {/* HEADER ACTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0a0a0a] p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.05),transparent_40%)] pointer-events-none" />
        <div className="relative z-10 mb-6 sm:mb-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-[#D4AF37]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">Visual CMS Architect</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight text-white">Storefront Builder</h2>
          <p className="text-xs text-gray-400 mt-1 max-w-md leading-relaxed">
            Configure visual assets, hero slides, promotional video slots, typography, and brand identity.
          </p>
        </div>

        <button
          type="button"
          onClick={onSaveClick}
          disabled={isSaving}
          className="relative z-10 w-full sm:w-auto bg-[#D4AF37] text-black px-8 py-4 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-white transition-all shadow-lg cursor-pointer disabled:opacity-50"
        >
          <AnimatePresence mode="wait">
            {isSaving ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : showSuccess ? (
              <CheckCircle2 size={15} className="text-black" />
            ) : (
              <Save size={15} />
            )}
          </AnimatePresence>
          {isSaving ? "Publishing Changes..." : showSuccess ? "Published Live" : "Deploy Storefront"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* LEFT COLUMN: MEDIA ENGINE */}
        <div className="space-y-8">
          {/* PROMO MEDIA SLOTS */}
          <section className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-3 mb-1 text-white">
              <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]"><Video size={16} /></div>
              Cinematic Promo Slots
            </h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-6 font-bold">5 Priority Media Placements</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {promoVideos.map((videoUrl, index) => (
                <div 
                  key={index} 
                  className="p-4 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl flex flex-col items-center gap-4 transition-colors"
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
                    <div className="flex items-center gap-2 bg-black border border-white/10 rounded-xl p-2.5 focus-within:border-[#D4AF37]/50 transition-colors">
                      <LinkIcon size={12} className="text-gray-500 shrink-0" />
                      <input
                        type="text"
                        value={videoUrl}
                        onChange={(e) => {
                          const updated = [...promoVideos];
                          updated[index] = e.target.value;
                          setPromoVideos(updated);
                        }}
                        className="w-full bg-transparent border-none focus:outline-none text-[10px] font-mono text-gray-300 placeholder:text-gray-600"
                        placeholder={`Direct URL Slot ${index + 1}...`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* HERO SLIDES */}
          <section className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-3 text-white">
                <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]"><ImageIcon size={16} /></div>
                Hero Banners
              </h3>
              <button 
                type="button"
                onClick={handleAddSlide} 
                className="text-[#D4AF37] bg-[#D4AF37]/10 px-4 py-2 rounded-lg hover:bg-[#D4AF37] hover:text-black transition-colors flex items-center gap-2 text-[9px] uppercase tracking-widest font-black cursor-pointer"
              >
                <Plus size={14} /> Add Slide
              </button>
            </div>
            
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {heroSlides.map((slide, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={slide.id} 
                    className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col sm:flex-row gap-5 items-start hover:border-white/10 transition-colors relative"
                  >
                    <div className="w-full sm:w-28 shrink-0">
                      <PremiumUploadNode
                        placeholder="Hero Asset"
                        onUploadSuccess={(url: string) => {
                          const updated = [...heroSlides];
                          updated[index].url = url;
                          setHeroSlides(updated);
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 space-y-3 w-full">
                      <div>
                        <label className="text-[9px] uppercase tracking-widest text-gray-500 font-bold block mb-1">Slide Heading</label>
                        <input
                          type="text"
                          value={slide.heading}
                          onChange={(e) => {
                            const updated = [...heroSlides];
                            updated[index].heading = e.target.value;
                            setHeroSlides(updated);
                          }}
                          className="w-full bg-black border border-white/10 rounded-xl p-2.5 focus:outline-none focus:border-[#D4AF37]/50 text-xs font-serif text-white"
                          placeholder="e.g., The Heritage Vault"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[9px] uppercase tracking-widest text-gray-500 font-bold block mb-1">Asset URL</label>
                        <div className="flex items-center gap-2 bg-black border border-white/10 rounded-xl p-2.5 focus-within:border-[#D4AF37]/50">
                          <LinkIcon size={12} className="text-gray-500 shrink-0" />
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

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <label className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Type:</label>
                          <select
                            value={slide.type}
                            onChange={(e) => {
                              const updated = [...heroSlides];
                              updated[index].type = e.target.value as "image" | "video";
                              setHeroSlides(updated);
                            }}
                            className="bg-black border border-white/20 rounded-lg px-2.5 py-1 text-[9px] font-bold text-gray-300 uppercase outline-none"
                          >
                            <option value="image">Image</option>
                            <option value="video">Cinematic Video</option>
                          </select>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveSlide(slide.id)} 
                          className="text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[8px] uppercase font-bold tracking-widest transition-colors cursor-pointer"
                        >
                          <Trash2 size={11} /> Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: BRANDING & IDENTITY */}
        <div className="space-y-8">
          {/* UI CONFIGURATION */}
          <section className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-3 mb-6 text-white">
              <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]"><Palette size={16} /></div>
              Brand Styling & Palette
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-2">Accent Gold (Hex)</label>
                <div className="flex items-center gap-3 bg-black p-2 rounded-xl border border-white/10 focus-within:border-[#D4AF37]/50">
                  <input
                    type="color"
                    value={uiConfig.primaryColor}
                    onChange={(e) => setUiConfig({ ...uiConfig, primaryColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
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
                <label className="block text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-2">Core Typography</label>
                <select
                  value={uiConfig.fontFamily}
                  onChange={(e) => setUiConfig({ ...uiConfig, fontFamily: e.target.value as "serif" | "sans-serif" | "monospace" })}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-[#D4AF37]/50 text-white"
                >
                  <option value="serif">Fraunces (Classic Luxury)</option>
                  <option value="sans-serif">Inter (Modern Clean)</option>
                  <option value="monospace">JetBrains Mono (Technical)</option>
                </select>
              </div>
            </div>
          </section>

          {/* ABOUT SECTION */}
          <section className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-3 mb-6 text-white">
              <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]"><Type size={16} /></div>
              Heritage Narrative
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-2">Manifesto Narrative</label>
                <textarea
                  value={aboutConfig.content}
                  onChange={(e) => setAboutConfig({ ...aboutConfig, content: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-2xl p-4 min-h-[120px] focus:outline-none focus:border-[#D4AF37]/50 text-xs leading-relaxed text-gray-300 resize-none"
                  placeholder="Draft your brand's heritage narrative here..."
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-2">Highlighted Words (Comma separated)</label>
                <input
                  type="text"
                  value={aboutConfig.boldWords}
                  onChange={(e) => setAboutConfig({ ...aboutConfig, boldWords: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#D4AF37]/50 text-xs font-mono text-white"
                  placeholder="e.g., Luxury, Excellence, Guaranteed"
                />
              </div>
            </div>
          </section>

          {/* SOCIAL LINKS */}
          <section className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-3 mb-6 text-white">
              <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]"><Share2 size={16} /></div>
              Social Media Footprint
            </h3>
            <div className="space-y-3">
              {Object.keys(socialLinks).map((platform) => (
                <div key={platform} className="flex items-center gap-3">
                  <label className="w-20 text-[9px] uppercase tracking-widest text-gray-500 font-black shrink-0">
                    {platform}
                  </label>
                  <div className="flex-1 flex items-center gap-2 bg-black border border-white/10 rounded-xl p-2.5 focus-within:border-[#D4AF37]/50">
                    <LinkIcon size={12} className="text-gray-500 shrink-0" />
                    <input
                      type="text"
                      value={socialLinks[platform as keyof SocialLinks]}
                      onChange={(e) => setSocialLinks({ ...socialLinks, [platform]: e.target.value })}
                      className="w-full bg-transparent border-none focus:outline-none text-[10px] font-mono text-white placeholder:text-gray-600"
                      placeholder={`https://${platform}.com/...`}
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