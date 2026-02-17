"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { Star, Users, Award } from "lucide-react";
import Image from "next/image";

export function Hero() {
  const { t, language } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center text-white overflow-hidden">
      {/* Background image - visible especially on the right side */}
      <div
        className="absolute inset-0 bg-[#0E0E0E]"
        aria-hidden
      >
        <Image
          src="/images/background.png"
          alt=""
          fill
          className="object-cover object-center md:object-right"
          priority
          quality={85}
          sizes="100vw"
          aria-hidden="true"
        />
        {/* Dark gradient overlay from left so text stays readable - lighter on mobile */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to right, rgba(14, 14, 14, 0.85) 0%, rgba(14, 14, 14, 0.6) 30%, rgba(14, 14, 14, 0.4) 50%, rgba(14, 14, 14, 0.2) 70%, transparent 100%)",
          }}
        />
        {/* Additional mobile-specific overlay for better text readability */}
        <div
          className="absolute inset-0 pointer-events-none md:hidden"
          style={{
            background: "linear-gradient(to bottom, rgba(14, 14, 14, 0.3) 0%, transparent 50%, rgba(14, 14, 14, 0.2) 100%)",
          }}
        />
      </div>
      {/* Soft radial lighting behind hero text */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-full max-w-[800px] h-[800px] blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(198, 167, 94, 0.1) 0%, rgba(198, 167, 94, 0.05) 50%, transparent 100%)",
          }}
        />
      </div>

      <div className="container mx-auto px-6 md:px-12 lg:px-16 relative z-10 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          {/* Trust Badge - Above Fold Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="flex flex-wrap items-center gap-4 mb-8"
          >
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-sm border border-white/10">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
              <span className="text-sm font-medium text-white/90 ml-1">4.9</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-sm border border-white/10">
              <Users className="h-4 w-4 text-gold" />
              <span className="text-sm font-medium text-white/90">
                {language === "fr" ? "500+ Clients" : "500+ Clients"}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-sm border border-white/10">
              <Award className="h-4 w-4 text-gold" />
              <span className="text-sm font-medium text-white/90">
                {language === "fr" ? "Premium Tunis" : "Premium Tunis"}
              </span>
            </div>
          </motion.div>

          {/* Hero Title - Mobile Optimized */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-heading font-bold mb-6 leading-[1.1] tracking-tight text-white">
            Joseph Coiff
          </h1>

          {/* Thin gold divider */}
          <div className="w-16 sm:w-24 h-[1px] bg-gold mb-6 sm:mb-8" />

          {/* Powerful tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-lg sm:text-xl md:text-2xl font-body text-white/80 mb-8 sm:mb-12 tracking-wide uppercase font-light leading-relaxed"
          >
            Précision. Présence. Puissance.
          </motion.p>

          {/* Primary CTA - Prominent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 mb-6"
          >
            <Link href="/book" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gold text-[#0E0E0E] hover:bg-gold/90 active:scale-[0.98] text-base sm:text-lg px-8 sm:px-10 py-6 h-auto min-h-[56px] rounded-sm font-semibold tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-gold/20 border-2 border-transparent hover:border-gold/50"
              >
                {t("hero.cta")}
              </Button>
            </Link>
          </motion.div>

          {/* Secondary CTA - Less Prominent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Link href="/services">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent text-white border-2 border-white/20 hover:border-gold hover:text-gold active:scale-[0.98] text-sm sm:text-base px-6 sm:px-8 py-4 h-auto min-h-[48px] rounded-sm font-medium tracking-wide transition-all duration-200"
              >
                {t("nav.services")}
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
