"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.services": "Services",
    "nav.gallery": "Gallery",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.book": "Book Now",
    "hero.title": "El Haj'Aime",
    "hero.subtitle": "Precision Cuts, Tunisian Pride",
    "hero.description":
      "Experience premium grooming in the heart of Tunis. Traditional craftsmanship meets modern precision.",
    "hero.cta": "Book Your Appointment",
    "services.title": "Our Services",
    "services.subtitle": "Professional grooming tailored to you",
    "gallery.title": "Our Work",
    "testimonials.title": "What Our Clients Say",
    "footer.address": "Avenue Habib Bourguiba, Tunis",
    "footer.hours": "Sat-Thu: 9AM-9PM | Fri: 2PM-9PM",
    "footer.phone": "+216 98 765 432",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.services": "الخدمات",
    "nav.gallery": "معرض الصور",
    "nav.about": "من نحن",
    "nav.contact": "اتصل بنا",
    "nav.book": "احجز الآن",
    "hero.title": "الحاج عايم",
    "hero.subtitle": "قص دقيق، فخر تونسي",
    "hero.description":
      "استمتع بالعناية الفاخرة في قلب تونس. الحرفية التقليدية تلتقي بالدقة الحديثة.",
    "hero.cta": "احجز موعدك",
    "services.title": "خدماتنا",
    "services.subtitle": "عناية احترافية مصممة خصيصاً لك",
    "gallery.title": "أعمالنا",
    "testimonials.title": "ماذا يقول عملاؤنا",
    "footer.address": "شارع الحبيب بورقيبة، تونس",
    "footer.hours": "السبت-الخميس: 9ص-9م | الجمعة: 2م-9م",
    "footer.phone": "+216 98 765 432",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language;
    if (saved && (saved === "en" || saved === "ar")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
