"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WhatsAppButton() {
  const phoneNumber = "+21698765432";
  const message = encodeURIComponent("Hello! I'd like to book an appointment.");

  return (
    <a
      href={`https://wa.me/${phoneNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50"
      aria-label="Contact us on WhatsApp"
    >
      <Button
        size="lg"
        className="h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#20BA5A] shadow-lg hover:shadow-xl transition-all"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    </a>
  );
}
