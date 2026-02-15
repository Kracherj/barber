"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "fr";

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
    "nav.products": "Produits",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.book": "Réserver",
    "hero.title": "Joseph Coiff",
    "hero.subtitle": "Coupes de précision, Fierté tunisienne",
    "hero.description":
      "Découvrez un toilettage premium au cœur de Tunis. L'artisanat traditionnel rencontre la précision moderne.",
    "hero.cta": "Réservez votre rendez-vous",
    "services.title": "Nos Services",
    "services.subtitle": "Toilettage professionnel adapté à vos besoins",
    "gallery.title": "Notre Travail",
    "products.title": "Nos Produits",
    "products.subtitle": "Découvrez notre sélection de produits de soins",
    "testimonials.title": "Ce que disent nos clients",
    "footer.address": "Tunis, Tunisie",
    "footer.hours": "Sam-Jeu: 9h-21h | Ven: 14h-21h",
    "footer.phone": "+216 98 765 432",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.services": "Services",
    "nav.gallery": "Galerie",
    "nav.products": "Produits",
    "nav.about": "À propos",
    "nav.contact": "Contact",
    "nav.book": "Réserver",
    "hero.title": "Joseph Coiff",
    "hero.subtitle": "Coupes de précision, Fierté tunisienne",
    "hero.description":
      "Découvrez un toilettage premium au cœur de Tunis. L'artisanat traditionnel rencontre la précision moderne.",
    "hero.cta": "Réservez votre rendez-vous",
    "services.title": "Nos Services",
    "services.subtitle": "Toilettage professionnel adapté à vos besoins",
    "gallery.title": "Notre Travail",
    "products.title": "Nos Produits",
    "products.subtitle": "Découvrez notre sélection de produits de soins",
    "testimonials.title": "Ce que disent nos clients",
    "footer.address": "Tunis, Tunisie",
    "footer.hours": "Sam-Jeu: 9h-21h | Ven: 14h-21h",
    "footer.phone": "+216 98 765 432",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language;
    if (saved && (saved === "en" || saved === "fr")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    document.documentElement.dir = "ltr";
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.dir = "ltr";
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
