import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Navigation } from "@/components/navigation";
import { LanguageProvider } from "@/contexts/language-context";
import { Analytics } from "@/components/analytics";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Joseph Coiff | Coiffure Premium à Tunis",
  description:
    "Coupes de précision, Fierté tunisienne. Salon de coiffure premium au cœur de Tunis. Coupes classiques, services premium et produits de soins.",
  keywords: [
    "Joseph Coiff",
    "coiffure Tunis",
    "coiffeur Tunisie",
    "barbershop Tunis",
    "coiffeur premium",
  ],
  authors: [{ name: "Joseph Coiff" }],
  openGraph: {
    title: "Joseph Coiff | Coiffure Premium à Tunis",
    description: "Coupes de précision, Fierté tunisienne",
    type: "website",
    locale: "fr_TN",
    alternateLocale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest",
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {"window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag(\"js\", new Date()); gtag(\"config\", \"" + (process.env.NEXT_PUBLIC_GA_ID || "") + "\");"}
            </Script>
          </>
        )}

        {/* Hotjar */}
        {process.env.NEXT_PUBLIC_HOTJAR_ID && (
          <Script id="hotjar" strategy="afterInteractive">
            {"(function(h,o,t,j,a,r){ h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments);}; h._hjSettings={hjid:\"" + (process.env.NEXT_PUBLIC_HOTJAR_ID || "") + "\",hjsv:6}; a=o.getElementsByTagName(\"head\")[0]; r=o.createElement(\"script\");r.async=1; r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv; a.appendChild(r); })(window,document,\"https://static.hotjar.com/c/hotjar-\",\".js?sv=\");"}
          </Script>
        )}

        {/* Schema.org Local Business */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "HairSalon",
              name: "Joseph Coiff",
              alternateName: "Joseph Coiff",
              description: "Salon de coiffure premium à Tunis, Tunisie",
              url: "https://maps.app.goo.gl/9rrvfUm1G1WfzBQ46",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Tunis",
                addressCountry: "TN",
              },
              telephone: "+21698765432",
              priceRange: "$$",
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Saturday",
                  ],
                  opens: "09:00",
                  closes: "21:00",
                },
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: "Friday",
                  opens: "14:00",
                  closes: "21:00",
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <LanguageProvider>
          <Navigation />
          <main className="min-h-screen">{children}</main>
          <WhatsAppButton />
          <Toaster />
          <Analytics />
        </LanguageProvider>
      </body>
    </html>
  );
}
