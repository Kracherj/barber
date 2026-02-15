"use client";

import { MapPin, Clock, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { motion } from "framer-motion";

export function MapSection() {
  const { t } = useLanguage();

  return (
    <section id="location" className="py-32 bg-[#0E0E0E]">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 tracking-tight">
                {t("nav.contact")}
              </h2>
              <div className="w-24 h-[1px] bg-gold mb-8" />
            </div>

            <div className="flex items-start space-x-6">
              <MapPin className="h-6 w-6 text-gold mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white mb-2 font-body tracking-wide">Adresse</h3>
                <a
                  href="https://maps.app.goo.gl/9rrvfUm1G1WfzBQ46"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-gold transition-colors font-body"
                >
                  {t("footer.address")} · Voir sur Google Maps
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <Clock className="h-6 w-6 text-gold mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white mb-2 font-body tracking-wide">Horaires</h3>
                <p className="text-white/60 font-body">{t("footer.hours")}</p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <Phone className="h-6 w-6 text-gold mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white mb-2 font-body tracking-wide">Téléphone</h3>
                <a
                  href="tel:+21698765432"
                  className="text-white/60 hover:text-gold transition-colors font-body"
                >
                  {t("footer.phone")}
                </a>
              </div>
            </div>
          </motion.div>

          {/* Map - Embedded Google Map + link to open in Maps */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="h-[500px] rounded-sm overflow-hidden border border-white/5 relative bg-[#1c1c1c]"
          >
            <iframe
              title="Joseph Coiff Ezzahra - Carte"
              src="https://www.openstreetmap.org/export/embed.html?bbox=10.29%2C36.73%2C10.32%2C36.75&layer=mapnik&marker=36.74%2C10.305"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              className="w-full h-full min-h-[400px]"
            />
            <a
              href="https://maps.app.goo.gl/9rrvfUm1G1WfzBQ46"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 bg-gold text-[#0E0E0E] px-6 py-3 rounded-sm font-semibold hover:bg-gold/90 transition-colors shadow-lg text-sm"
            >
              <MapPin className="h-4 w-4" />
              Ouvrir dans Google Maps
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
