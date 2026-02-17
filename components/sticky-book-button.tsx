"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function StickyBookButton() {
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-28 right-6 z-40 md:hidden">
      <Link href="/book" aria-label="Book appointment">
        <Button
          size="lg"
          className="h-14 min-h-[56px] px-6 rounded-sm shadow-lg hover:shadow-xl hover:shadow-gold/30 transition-all bg-gold text-[#0E0E0E] font-semibold tracking-wide active:scale-95"
        >
          <Calendar className="h-5 w-5 mr-2" aria-hidden="true" />
          {t("nav.book")}
        </Button>
      </Link>
    </div>
  );
}
