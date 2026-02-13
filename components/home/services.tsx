"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { Scissors, Sparkles, Zap, Crown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const services = [
  {
    id: "classic-cut",
    icon: Scissors,
    nameEn: "Classic Cut",
    nameAr: "قص كلاسيكي",
    descriptionEn: "Professional haircut with styling",
    descriptionAr: "قص احترافي مع تصفيف",
    duration: 30,
    price: 25,
  },
  {
    id: "premium-cut",
    icon: Crown,
    nameEn: "Premium Cut + Shave",
    nameAr: "قص مميز + حلاقة",
    descriptionEn: "Premium haircut with hot towel shave",
    descriptionAr: "قص مميز مع حلاقة بمنشفة ساخنة",
    duration: 45,
    price: 40,
  },
  {
    id: "beard-trim",
    icon: Zap,
    nameEn: "Beard Trim",
    nameAr: "تهذيب اللحية",
    descriptionEn: "Precise beard trimming and shaping",
    descriptionAr: "تهذيب وتشكيل اللحية بدقة",
    duration: 20,
    price: 15,
  },
  {
    id: "full-service",
    icon: Sparkles,
    nameEn: "Full Service",
    nameAr: "خدمة كاملة",
    descriptionEn: "Complete grooming experience: cut, shave, and styling",
    descriptionAr: "تجربة عناية كاملة: قص، حلاقة، وتصفيف",
    duration: 75,
    price: 60,
  },
];

export function Services() {
  const { language, t } = useLanguage();

  return (
    <section id="services" className="py-32 bg-[#0E0E0E]">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 tracking-tight">
            {t("services.title")}
          </h2>
          <div className="w-24 h-[1px] bg-gold mb-6" />
          <p className="text-lg text-white/60 max-w-2xl font-body tracking-wide">
            {t("services.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className="h-full bg-[#1c1c1c] border border-white/5 hover:border-gold/30 hover:shadow-card-hover transition-all duration-500 group cursor-pointer rounded-sm">
                  <CardHeader className="pb-4">
                    <div className="h-14 w-14 bg-gold/10 rounded-sm flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors">
                      <Icon className="h-7 w-7 text-gold" />
                    </div>
                    <CardTitle className="text-2xl font-heading text-white mb-3 tracking-tight">
                      {language === "ar" ? service.nameAr : service.nameEn}
                    </CardTitle>
                    <CardDescription className="text-white/60 font-body">
                      {language === "ar"
                        ? service.descriptionAr
                        : service.descriptionEn}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm text-white/50 font-body">
                        {service.duration} min
                      </span>
                      <span className="text-3xl font-bold text-gold font-heading">
                        {formatCurrency(service.price)}
                      </span>
                    </div>
                    <Link href="/book">
                      <Button
                        variant="outline"
                        className="w-full border-white/10 hover:border-gold hover:text-gold hover:bg-gold/5 rounded-sm font-semibold tracking-wide transition-all duration-300"
                      >
                        {language === "ar" ? "احجز الآن" : "Book Now"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
