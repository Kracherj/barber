"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { Scissors, Globe } from "lucide-react";
import { useState, useEffect } from "react";

export function Navigation() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "/", label: t("nav.home") },
    { href: "/services", label: t("nav.services") },
    { href: "/gallery", label: t("nav.gallery") },
    { href: "/products", label: t("nav.products") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
  ];

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-[#0E0E0E]/95 backdrop-blur-md border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative h-10 w-10 flex items-center justify-center shrink-0">
              <Scissors className="h-6 w-6 text-gold transition-transform group-hover:rotate-12" />
              <img
                src="/images/logo.png"
                alt=""
                className="absolute inset-0 h-10 w-10 object-contain opacity-0 transition-opacity"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
                onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = "1"; }}
              />
            </div>
            <span className="text-xl font-heading font-bold text-white tracking-tight">
              Joseph Coiff
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative group"
              >
                <span
                  className={`text-sm font-medium transition-colors tracking-wide ${
                    pathname === item.href
                      ? "text-gold"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {item.label}
                </span>
                {pathname === item.href && (
                  <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-gold" />
                )}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gold transition-all group-hover:w-full" />
              </Link>
            ))}
            <Link href="/book">
              <Button
                size="sm"
                className="bg-gold text-[#0E0E0E] hover:bg-gold/90 rounded-sm px-6 font-semibold tracking-wide"
              >
                {t("nav.book")}
              </Button>
            </Link>
            <button
              onClick={() => setLanguage(language === "en" ? "fr" : "en")}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-white/80 hover:text-gold transition-colors"
              aria-label="Toggle language"
            >
              <Globe className="h-4 w-4" />
              <span className="tracking-wide">{language === "en" ? "FR" : "EN"}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-3">
            <button
              onClick={() => setLanguage(language === "en" ? "fr" : "en")}
              className="p-2"
              aria-label="Toggle language"
            >
              <Globe className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
              aria-label="Toggle menu"
            >
              <div className="space-y-1.5">
                <span
                  className={`block h-[1px] w-6 bg-white transition-all ${
                    mobileMenuOpen ? "rotate-45 translate-y-2" : ""
                  }`}
                />
                <span
                  className={`block h-[1px] w-6 bg-white transition-all ${
                    mobileMenuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`block h-[1px] w-6 bg-white transition-all ${
                    mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-6 space-y-2 border-t border-white/10">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 text-sm font-medium transition-colors tracking-wide ${
                  pathname === item.href
                    ? "text-gold border-l-2 border-gold pl-3"
                    : "text-white/80 hover:text-white hover:pl-4"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/book" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full mt-4 rounded-sm" size="sm">
                {t("nav.book")}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
