"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { Scissors, Award, Users, Clock } from "lucide-react";
import Image from "next/image";
import { Footer } from "@/components/footer";

export default function AboutPage() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "About El Haj'Aime",
      subtitle: "Traditional Tunisian Craftsmanship Meets Modern Precision",
      story: `El Haj'Aime has been a cornerstone of Tunisian barbering tradition for generations. Located in the heart of Tunis, we combine time-honored techniques with contemporary styling to deliver an unparalleled grooming experience.

Our master barbers, Ahmed, Karim, and Walid, bring years of expertise and a passion for perfection to every cut, shave, and trim. We believe that grooming is an art form, and each client deserves personalized attention and meticulous care.

At El Haj'Aime, we're not just cutting hair—we're preserving a legacy of excellence while embracing the future of men's grooming.`,
      values: [
        {
          icon: Award,
          title: "Excellence",
          description: "Uncompromising quality in every service",
        },
        {
          icon: Users,
          title: "Tradition",
          description: "Honoring Tunisian barbering heritage",
        },
        {
          icon: Clock,
          title: "Precision",
          description: "Attention to detail in every cut",
        },
        {
          icon: Scissors,
          title: "Innovation",
          description: "Modern techniques, timeless style",
        },
      ],
    },
    ar: {
      title: "من نحن",
      subtitle: "الحرفية التونسية التقليدية تلتقي بالدقة الحديثة",
      story: `الحاج عايم كان حجر الزاوية في تقليد الحلاقة التونسي لأجيال. يقع في قلب تونس، نجمع بين التقنيات العريقة والأسلوب المعاصر لتقديم تجربة عناية لا مثيل لها.

حلاقونا الماهرون، أحمد، كريم، ووليد، يجلبون سنوات من الخبرة وشغف الكمال لكل قص، حلاقة، وتهذيب. نؤمن أن العناية فنية، وكل عميل يستحق اهتماماً شخصياً ورعاية دقيقة.

في الحاج عايم، نحن لا نقطع الشعر فقط—نحافظ على إرث من التميز مع احتضان مستقبل عناية الرجال.`,
      values: [
        {
          icon: Award,
          title: "التميز",
          description: "جودة لا هوادة فيها في كل خدمة",
        },
        {
          icon: Users,
          title: "التقليد",
          description: "تكريم تراث الحلاقة التونسي",
        },
        {
          icon: Clock,
          title: "الدقة",
          description: "الانتباه للتفاصيل في كل قص",
        },
        {
          icon: Scissors,
          title: "الابتكار",
          description: "تقنيات حديثة، أسلوب خالد",
        },
      ],
    },
  };

  const currentContent = content[language];

  return (
    <div className="min-h-screen bg-[#0E0E0E] py-32">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 tracking-tight">
            {currentContent.title}
          </h1>
          <div className="w-24 h-[1px] bg-gold mb-6" />
          <p className="text-xl text-gold font-heading mb-8 tracking-wide">
            {currentContent.subtitle}
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto space-y-20">
          {/* Story Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
          >
            <div className="relative h-96 rounded-sm overflow-hidden border border-white/5">
              <Image
                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop"
                alt="Barbershop interior"
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-6">
              <p className="text-lg text-white/80 leading-relaxed whitespace-pre-line font-body">
                {currentContent.story}
              </p>
            </div>
          </motion.div>

          {/* Values Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-12 tracking-tight">
              {language === "ar" ? "قيمنا" : "Our Values"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {currentContent.values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="text-center p-8 bg-[#1c1c1c] border border-white/5 hover:border-gold/30 transition-all duration-500 rounded-sm"
                  >
                    <div className="h-16 w-16 bg-gold/10 rounded-sm flex items-center justify-center mx-auto mb-6">
                      <Icon className="h-8 w-8 text-gold" />
                    </div>
                    <h3 className="text-xl font-heading font-semibold text-white mb-3 tracking-tight">
                      {value.title}
                    </h3>
                    <p className="text-sm text-white/60 font-body">{value.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
