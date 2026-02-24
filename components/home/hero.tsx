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
      {/* Background image — subtle scale on load for premium feel (GPU-friendly) */}
      <div
        className="absolute inset-0 bg-[#0E0E0E] overflow-hidden"
        aria-hidden
      >
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.03 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src="/images/background.png"
            alt=""
            fill
            className="object-cover object-center md:object-right"
            priority
            fetchPriority="high"
            quality={80}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1920px"
            aria-hidden="true"
          />
        </motion.div>
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
      {/* Soft radial lighting behind hero text — lighter blur for 60fps */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-full max-w-[600px] h-[600px] blur-xl md:blur-2xl"
          style={{
            background: "radial-gradient(circle, rgba(198, 167, 94, 0.1) 0%, rgba(198, 167, 94, 0.05) 50%, transparent 100%)",
          }}
        />
      </div>

      <div className="container mx-auto px-6 md:px-12 lg:px-16 relative z-10 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          {/* Trust Badge - Above Fold Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center gap-4 mb-8"
          >
            <div className="flex items-center gap-2 bg-white/[0.08] px-4 py-2 rounded-sm border border-white/10">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
              <span className="text-sm font-medium text-white/90 ml-1">4.9</span>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.08] px-4 py-2 rounded-sm border border-white/10">
              <Users className="h-4 w-4 text-gold" />
              <span className="text-sm font-medium text-white/90">
                {language === "fr" ? "500+ Clients" : "500+ Clients"}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.08] px-4 py-2 rounded-sm border border-white/10">
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

          {/* Signature: thin gold divider */}
          <div className="signature-line mb-6 sm:mb-8" aria-hidden />

          {/* Powerful tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg sm:text-xl md:text-2xl font-body text-white/80 mb-8 sm:mb-12 tracking-wide uppercase font-light leading-relaxed"
          >
            Précision. Présence. Puissance.
          </motion.p>

          {/* Primary CTA - Prominent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-4 mb-6"
          >
            <Link href="/book" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gold text-[#0E0E0E] hover:bg-gold/90 active:scale-[0.98] text-base sm:text-lg px-8 sm:px-10 py-6 h-auto min-h-[56px] rounded-sm font-semibold tracking-wide transition-all duration-normal ease-out hover:shadow-gold-glow-soft border-2 border-transparent hover:border-gold/40"
              >
                {t("hero.cta")}
              </Button>
            </Link>
          </motion.div>

          {/* Secondary CTA - Less Prominent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/services">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent text-white border-2 border-white/20 hover:border-gold hover:text-gold active:scale-[0.98] text-sm sm:text-base px-6 sm:px-8 py-4 h-auto min-h-[48px] rounded-sm font-medium tracking-wide transition-all duration-normal ease-out"
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
