"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { Calendar, ArrowRight } from "lucide-react";

interface CTASectionProps {
  variant?: "primary" | "secondary";
  className?: string;
}

export function CTASection({ variant = "primary", className = "" }: CTASectionProps) {
  const { t, language } = useLanguage();

  if (variant === "primary") {
    return (
      <section className={`py-16 sm:py-20 md:py-24 bg-gradient-to-b from-[#0E0E0E] to-[#1c1c1c] ${className}`}>
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-4 sm:mb-6 tracking-tight">
              {language === "fr" 
                ? "Prêt pour une coupe exceptionnelle ?" 
                : "Ready for an exceptional cut?"}
            </h2>
            <p className="text-base sm:text-lg text-white/70 mb-8 sm:mb-10 font-body leading-relaxed max-w-2xl mx-auto">
              {language === "fr"
                ? "Réservez votre rendez-vous dès aujourd'hui et découvrez l'excellence tunisienne."
                : "Book your appointment today and experience Tunisian excellence."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/book">
                <Button
                  size="lg"
                  className="bg-gold text-[#0E0E0E] hover:bg-gold/90 active:scale-[0.98] min-h-[56px] px-8 sm:px-10 text-base sm:text-lg font-semibold tracking-wide shadow-lg hover:shadow-gold-glow-soft transition-all duration-normal ease-out"
                >
                  <Calendar className="h-5 w-5 mr-2" aria-hidden="true" />
                  {t("nav.book")}
                  <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-12 sm:py-16 bg-[#1c1c1c] ${className}`}>
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mx-auto text-center"
        >
          <p className="text-white/80 mb-6 font-body text-base sm:text-lg">
            {language === "fr"
              ? "Besoin d'un rendez-vous ?"
              : "Need an appointment?"}
          </p>
          <Link href="/book">
            <Button
              variant="outline"
              size="lg"
              className="border-gold text-gold hover:bg-gold hover:text-[#0E0E0E] active:scale-[0.98] min-h-[48px] px-6 sm:px-8 font-semibold transition-all duration-normal ease-out"
            >
              {t("nav.book")}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
