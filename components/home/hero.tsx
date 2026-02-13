"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center bg-[#0E0E0E] text-white overflow-hidden">
      {/* Soft radial lighting behind hero text */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[800px] h-[800px] blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(198, 167, 94, 0.1) 0%, rgba(198, 167, 94, 0.05) 50%, transparent 100%)'
          }}
        />
      </div>

      <div className="container mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          {/* Massive Hero Title */}
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-heading font-bold mb-6 leading-[0.9] tracking-tight text-white">
            El Haj'aime
          </h1>

          {/* Thin gold divider */}
          <div className="w-24 h-[1px] bg-gold mb-8" />

          {/* Powerful tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xl md:text-2xl font-body text-white/80 mb-12 tracking-wide uppercase font-light"
          >
            Precision. Presence. Power.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/book">
              <Button
                size="lg"
                className="bg-gold text-[#0E0E0E] hover:bg-gold/90 text-base px-10 py-6 h-auto rounded-sm font-semibold tracking-wide transition-all duration-300 hover:shadow-gold-glow border-2 border-transparent hover:border-gold"
              >
                {t("hero.cta")}
              </Button>
            </Link>
            <Link href="/services">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent text-white border-2 border-white/20 hover:border-gold hover:text-gold text-base px-10 py-6 h-auto rounded-sm font-semibold tracking-wide transition-all duration-300"
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
