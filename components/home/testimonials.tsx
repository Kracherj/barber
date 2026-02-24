"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { Star, CheckCircle2 } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Mohamed Ben Ali",
    text: "Meilleur salon de coiffure à Tunis ! Une coupe parfaite. Je recommande vivement !",
    rating: 5,
    verified: true,
  },
  {
    id: 2,
    name: "Youssef Trabelsi",
    text: "Service professionnel et ambiance géniale. Une vraie équipe d'artistes !",
    rating: 5,
    verified: true,
  },
  {
    id: 3,
    name: "Sami Khelifi",
    text: "Une attention aux détails incomparable. Ça vaut chaque dinar !",
    rating: 4,
    verified: true,
  },
  {
    id: 4,
    name: "Hassan Amara",
    text: "L'artisanat tunisien traditionnel à son meilleur. Joseph Coiff est exceptionnel !",
    rating: 5,
    verified: true,
  },
];

export function Testimonials() {
  const { language, t } = useLanguage();

  return (
    <section id="testimonials" className="py-16 sm:py-24 md:py-32 bg-[#1c1c1c]">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 sm:mb-16 md:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-white mb-4 sm:mb-6 tracking-tight">
            {t("testimonials.title")}
          </h2>
          <div className="w-16 sm:w-24 h-[1px] bg-gold" />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="h-full bg-[#0E0E0E] border border-white/5 hover:border-gold/30 hover:shadow-elevation-md hover:-translate-y-0.5 transition-all duration-normal ease-out rounded-sm">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex mb-4 sm:mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-gold text-gold"
                        aria-hidden="true"
                      />
                    ))}
                    {testimonial.rating < 5 && (
                      [...Array(5 - testimonial.rating)].map((_, i) => (
                        <Star
                          key={`empty-${i}`}
                          className="h-4 w-4 text-white/20"
                          aria-hidden="true"
                        />
                      ))
                    )}
                  </div>
                  <p className="text-white/80 mb-4 sm:mb-6 italic font-body leading-relaxed text-sm sm:text-base">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-gold font-semibold font-body tracking-wide text-sm sm:text-base">
                      {testimonial.name}
                    </p>
                    {testimonial.verified && (
                      <CheckCircle2 className="h-4 w-4 text-gold flex-shrink-0" aria-label="Verified booking" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
