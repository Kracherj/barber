"use client";

import { Hero } from "@/components/home/hero";
import { Services } from "@/components/home/services";
import { Gallery } from "@/components/home/gallery";
import { Testimonials } from "@/components/home/testimonials";
import { MapSection } from "@/components/home/map-section";
import { StickyBookButton } from "@/components/sticky-book-button";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <Gallery />
      <Testimonials />
      <MapSection />
      <Footer />
      <StickyBookButton />
    </>
  );
}
