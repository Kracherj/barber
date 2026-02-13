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
                <h3 className="font-semibold text-white mb-2 font-body tracking-wide">Address</h3>
                <p className="text-white/60 font-body">{t("footer.address")}</p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <Clock className="h-6 w-6 text-gold mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white mb-2 font-body tracking-wide">Hours</h3>
                <p className="text-white/60 font-body">{t("footer.hours")}</p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <Phone className="h-6 w-6 text-gold mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white mb-2 font-body tracking-wide">Phone</h3>
                <a
                  href="tel:+21698765432"
                  className="text-white/60 hover:text-gold transition-colors font-body"
                >
                  {t("footer.phone")}
                </a>
              </div>
            </div>
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="h-[500px] rounded-sm overflow-hidden border border-white/5"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3192.5!2d10.1815!3d36.8061!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzYsNDg0LjIiTiAxMCwxMC41MkU!5e0!3m2!1sen!2stn!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
