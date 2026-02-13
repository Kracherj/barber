"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function StickyBookButton() {
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-24 right-6 z-40 md:hidden">
      <Link href="/book">
        <Button
          size="lg"
          className="h-14 px-6 rounded-sm shadow-lg hover:shadow-gold-glow transition-all bg-gold text-[#0E0E0E] font-semibold tracking-wide"
        >
          <Calendar className="h-5 w-5 mr-2" />
          {t("nav.book")}
        </Button>
      </Link>
    </div>
  );
}
