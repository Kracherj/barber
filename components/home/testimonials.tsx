"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Mohamed Ben Ali",
    text: "Meilleur salon de coiffure à Tunis ! Une coupe parfaite. Je recommande vivement !",
    rating: 5,
  },
  {
    id: 2,
    name: "Youssef Trabelsi",
    text: "Service professionnel et ambiance géniale. Une vraie équipe d'artistes !",
    rating: 5,
  },
  {
    id: 3,
    name: "Sami Khelifi",
    text: "Une attention aux détails incomparable. Ça vaut chaque dinar !",
    rating: 5,
  },
  {
    id: 4,
    name: "Hassan Amara",
    text: "L'artisanat tunisien traditionnel à son meilleur. Joseph Coiff est exceptionnel !",
    rating: 5,
  },
];

export function Testimonials() {
  const { language, t } = useLanguage();

  return (
    <section id="testimonials" className="py-32 bg-[#1c1c1c]">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 tracking-tight">
            {t("testimonials.title")}
          </h2>
          <div className="w-24 h-[1px] bg-gold" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <Card className="h-full bg-[#0E0E0E] border border-white/5 hover:border-gold/30 transition-all duration-500 rounded-sm">
                <CardContent className="p-8">
                  <div className="flex mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-gold text-gold"
                      />
                    ))}
                  </div>
                  <p className="text-white/80 mb-6 italic font-body leading-relaxed">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <p className="text-gold font-semibold font-body tracking-wide">
                    {testimonial.name}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
