"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { motion } from "framer-motion";

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
};

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Navigation />}
      <main className="min-h-screen">
        {isAdminRoute ? (
          children
        ) : (
          <motion.div
            key={pathname ?? "home"}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            transition={pageTransition.transition}
          >
            {children}
          </motion.div>
        )}
      </main>
      {!isAdminRoute && <WhatsAppButton />}
    </>
  );
}
