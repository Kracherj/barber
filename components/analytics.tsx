"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
    hj?: (command: string, ...args: any[]) => void;
  }
}

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Google Analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("config", process.env.NEXT_PUBLIC_GA_ID || "", {
        page_path: pathname,
      });
    }

    // Hotjar
    if (typeof window !== "undefined" && window.hj) {
      window.hj("stateChange", pathname);
    }
  }, [pathname]);

  return null;
}
