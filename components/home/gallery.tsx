"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import Image from "next/image";

const galleryImages = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop",
    alt: "Barber at work",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop",
    alt: "Haircut in progress",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop",
    alt: "Barbershop interior",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=600&fit=crop",
    alt: "Professional barber",
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1622296249501-c2f66cbd3777?w=800&h=600&fit=crop",
    alt: "Beard trim",
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=600&fit=crop",
    alt: "Classic cut",
  },
];

export function Gallery() {
  const { t } = useLanguage();

  return (
    <section id="gallery" className="py-32 bg-[#0E0E0E]">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 tracking-tight">
            {t("gallery.title")}
          </h2>
          <div className="w-24 h-[1px] bg-gold" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="relative aspect-[4/3] overflow-hidden group cursor-pointer"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <p className="text-white font-body text-sm tracking-wide uppercase">
                  {image.alt}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
