"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServices } from "@/lib/supabase/queries";
import type { Service } from "@/lib/supabase/queries";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { motion } from "framer-motion";
import { Scissors, Crown, Zap, Sparkles } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/footer";

// French labels for services (DB has name_ar in Arabic; we show FR)
const SERVICE_NAME_FR: Record<string, string> = {
  "Classic Cut": "Coupe classique",
  "Premium Cut + Shave": "Coupe premium + rasage",
  "Beard Trim": "Taille de barbe",
  "Full Service": "Service complet",
};
const SERVICE_DESC_FR: Record<string, string> = {
  "Classic Cut": "Coupe professionnelle avec coiffage",
  "Premium Cut + Shave": "Coupe premium avec rasage à la serviette chaude",
  "Beard Trim": "Taille et mise en forme précise de la barbe",
  "Full Service": "Expérience complète : coupe, rasage et coiffage",
};

const serviceIcons = {
  "classic-cut": Scissors,
  "premium-cut": Crown,
  "beard-trim": Zap,
  "full-service": Sparkles,
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    async function loadServices() {
      const data = await getServices();
      setServices(data);
      setLoading(false);
    }
    loadServices();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0E0E0E]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] py-32">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 tracking-tight">
            {language === "fr" ? "Nos Services" : "Our Services"}
          </h1>
          <div className="w-24 h-[1px] bg-gold mb-6" />
          <p className="text-lg text-white/60 max-w-2xl font-body tracking-wide">
            {language === "fr"
              ? "Toilettage professionnel adapté à vos besoins"
              : "Professional grooming tailored to you"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
          {services.map((service, index) => {
            const Icon =
              serviceIcons[
                service.id as keyof typeof serviceIcons
              ] || Scissors;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full bg-[#1c1c1c] border border-white/5 hover:border-gold/30 hover:shadow-card-hover transition-all duration-500 rounded-sm">
                  <CardHeader>
                    <div className="h-16 w-16 bg-gold/10 rounded-sm flex items-center justify-center mb-6">
                      <Icon className="h-8 w-8 text-gold" />
                    </div>
                    <CardTitle className="text-2xl font-heading text-white mb-3 tracking-tight">
                      {language === "fr"
                        ? (SERVICE_NAME_FR[service.name_en] ?? service.name_en)
                        : service.name_en}
                    </CardTitle>
                    <CardDescription className="text-white/60 font-body">
                      {language === "fr"
                        ? (SERVICE_DESC_FR[service.name_en] ?? service.description_en)
                        : service.description_en}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm text-white/50 font-body">
                        {service.duration_minutes} {language === "fr" ? "minutes" : "minutes"}
                      </span>
                      <span className="text-3xl font-bold text-gold font-heading">
                        {formatCurrency(service.price_tnd)}
                      </span>
                    </div>
                    <Link href="/book">
                      <Button className="w-full rounded-sm" size="lg">
                        {language === "fr" ? "Réserver maintenant" : "Book Now"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
