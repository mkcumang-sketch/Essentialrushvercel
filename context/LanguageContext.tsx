"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { translations } from "@/lib/translations";

// Default Language set ki hai: English (India)
type Language = "en-IN" | "hi" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any; // Translation object
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en-IN");

  // Agar user ne pehle kabhi language select ki thi, toh wo load karo
  useEffect(() => {
    const savedLang = localStorage.getItem("app_lang") as Language;
    if (savedLang) setLanguage(savedLang);
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("app_lang", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};