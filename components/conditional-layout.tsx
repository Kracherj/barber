"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { WhatsAppButton } from "@/components/whatsapp-button";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Navigation />}
      <main className="min-h-screen">{children}</main>
      {!isAdminRoute && <WhatsAppButton />}
    </>
  );
}
