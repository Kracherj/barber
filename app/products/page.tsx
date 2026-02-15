"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";
import { Footer } from "@/components/footer";

const products = [
  {
    id: 1,
    name: "Shampooing Kéra Pro",
    description: "Nourrit - Répare | Tous types de cheveux",
    features: ["0% Sulfates, parabens, Silicones", "250 ml"],
    price: 25,
    image: "/images/prod1.png",
  },
  {
    id: 2,
    name: "Shampoing Purifiant",
    description: "Shampoing Naturel & Séborégulateur",
    features: ["Pour cheveux normaux à gras", "By PURE COSMETICS"],
    price: 25,
    image: "/images/prod2.png",
  },
  {
    id: 3,
    name: "Mousse Nettoyante Hydratante",
    description: "98% d'ingrédients naturels | Tous types de peaux",
    features: ["Mousse nettoyante & hydratante", "150 ml"],
    price: 35,
    image: "/images/prod3.png",
  },
  {
    id: 4,
    name: "Nettoyant Visage Naturel Au Charbon",
    description: "99% d'ingrédients d'origine naturelle",
    features: ["Pour tous types de peaux", "By PURE COSMETICS"],
    price: 25,
    image: "/images/prod4.png",
  },
];

export default function ProductsPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0E0E0E] py-32">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 tracking-tight">
            {t("products.title")}
          </h1>
          <div className="w-24 h-[1px] bg-gold mb-6" />
          <p className="text-lg text-white/60 max-w-2xl font-body tracking-wide">
            {t("products.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="bg-[#1c1c1c] border border-white/5 hover:border-gold/30 rounded-sm overflow-hidden transition-all duration-500 group"
            >
              <div className="flex flex-col md:flex-row">
                <div className="relative h-64 md:h-80 md:w-64 flex-shrink-0 bg-[#0E0E0E] flex items-center justify-center p-6">
                  <div className="relative w-full h-full">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 256px"
                    />
                  </div>
                </div>
                <div className="p-8 flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl font-heading font-bold text-white mb-3 tracking-tight">
                      {product.name}
                    </h2>
                    <p className="text-white/70 font-body mb-4">{product.description}</p>
                    <ul className="space-y-2 text-sm text-white/60 font-body">
                      {product.features.map((feature) => (
                        <li key={feature}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-2xl font-bold text-gold font-heading mt-6">
                    {product.price} DT
                  </p>
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
