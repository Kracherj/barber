"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";
import { Footer } from "@/components/footer";

const galleryImages = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1200&h=800&fit=crop",
    alt: "Barber at work",
    category: "Haircut",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200&h=800&fit=crop",
    alt: "Haircut in progress",
    category: "Haircut",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&h=800&fit=crop",
    alt: "Barbershop interior",
    category: "Interior",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&h=800&fit=crop",
    alt: "Professional barber",
    category: "Barber",
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1622296249501-c2f66cbd3777?w=1200&h=800&fit=crop",
    alt: "Beard trim",
    category: "Beard",
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1200&h=800&fit=crop",
    alt: "Classic cut",
    category: "Haircut",
  },
  {
    id: 7,
    src: "https://images.unsplash.com/photo-1582095133170-bfd32e43b5e3?w=1200&h=800&fit=crop",
    alt: "Premium service",
    category: "Service",
  },
  {
    id: 8,
    src: "https://images.unsplash.com/photo-1622296249501-c2f66cbd3777?w=1200&h=800&fit=crop",
    alt: "Styling",
    category: "Styling",
  },
];

export default function GalleryPage() {
  const { language, t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0E0E0E] py-32">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 tracking-tight">
            {t("gallery.title")}
          </h1>
          <div className="w-24 h-[1px] bg-gold mb-6" />
          <p className="text-lg text-white/60 max-w-2xl font-body tracking-wide">
            {language === "ar"
              ? "اكتشف أعمالنا الفنية في الحلاقة والعناية"
              : "Discover our artistry in grooming and styling"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="relative aspect-[4/3] overflow-hidden group cursor-pointer rounded-sm"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end">
                <div className="p-6 text-white transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <p className="font-semibold font-body tracking-wide uppercase text-sm">{image.category}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
