"use client";

import { useState, useEffect } from "react";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { getBarbers, getServices } from "@/lib/supabase/queries";
import type { Barber, Service } from "@/lib/supabase/queries";

export default function BookPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [barbersData, servicesData] = await Promise.all([
        getBarbers(),
        getServices(),
      ]);
      setBarbers(barbersData);
      setServices(servicesData);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-navy">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-navy text-center mb-8">
            Réserver votre rendez-vous
          </h1>
          <BookingStepper barbers={barbers} services={services} />
        </div>
      </div>
    </div>
  );
}
