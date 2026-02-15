"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { Facebook, Phone, MapPin, Clock } from "lucide-react";

export function Footer() {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-[#0E0E0E] border-t border-white/5 text-white py-16">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-3xl font-heading font-bold mb-6 text-white tracking-tight">
              Joseph Coiff
            </h3>
            <p className="text-white/60 mb-6 font-body">
              {language === "fr"
                ? "Coupes de précision, Fierté tunisienne"
                : "Precision Cuts, Tunisian Pride"}
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/profile.php?id=100077356354948"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-gold transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-6 font-body tracking-wide uppercase text-sm">
              {language === "fr" ? "Liens rapides" : "Quick Links"}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/services"
                  className="text-white/60 hover:text-gold transition-colors font-body text-sm tracking-wide"
                >
                  {t("nav.services")}
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="text-white/60 hover:text-gold transition-colors font-body text-sm tracking-wide"
                >
                  {t("nav.gallery")}
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-white/60 hover:text-gold transition-colors font-body text-sm tracking-wide"
                >
                  {t("nav.products")}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-white/60 hover:text-gold transition-colors font-body text-sm tracking-wide"
                >
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-white/60 hover:text-gold transition-colors font-body text-sm tracking-wide"
                >
                  {t("nav.contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-6 font-body tracking-wide uppercase text-sm">
              {language === "fr" ? "Informations de contact" : "Contact Info"}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gold mt-0.5 flex-shrink-0" />
                <a
                  href="https://maps.app.goo.gl/9rrvfUm1G1WfzBQ46"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-gold transition-colors font-body text-sm"
                >
                  {t("footer.address")} · Voir sur Google Maps
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-gold mt-0.5 flex-shrink-0" />
                <a
                  href="tel:+21698765432"
                  className="text-white/60 hover:text-gold transition-colors font-body text-sm"
                >
                  {t("footer.phone")}
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-gold mt-0.5 flex-shrink-0" />
                <span className="text-white/60 font-body text-sm">{t("footer.hours")}</span>
              </li>
            </ul>
          </div>

          {/* Book Now */}
          <div>
            <h4 className="font-semibold mb-6 font-body tracking-wide uppercase text-sm">
              {language === "fr" ? "Réserver maintenant" : "Book Now"}
            </h4>
            <p className="text-white/60 mb-6 font-body text-sm leading-relaxed">
              {language === "fr"
                ? "Réservez votre rendez-vous aujourd'hui et profitez du meilleur service de toilettage"
                : "Book your appointment today and enjoy the best grooming service"}
            </p>
            <Link
              href="/book"
              className="inline-block bg-gold text-[#0E0E0E] px-6 py-3 rounded-sm font-semibold hover:bg-gold/90 transition-colors tracking-wide text-sm"
            >
              {t("nav.book")}
            </Link>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 text-center text-white/40 font-body text-sm tracking-wide">
          <p>
            © {new Date().getFullYear()} Joseph Coiff.{" "}
            {language === "fr"
              ? "Tous droits réservés"
              : "All rights reserved"}
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
