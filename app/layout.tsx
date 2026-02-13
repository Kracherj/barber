import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Navigation } from "@/components/navigation";
import { LanguageProvider } from "@/contexts/language-context";
import { Analytics } from "@/components/analytics";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "El Haj'Aime | Premium Barbershop in Tunis",
  description:
    "Precision Cuts, Tunisian Pride. Premium barbershop in central Tunis offering classic cuts, premium services, and traditional craftsmanship.",
  keywords: [
    "barbershop Tunis",
    "haircut Tunis",
    "barber Tunisia",
    "El Haj'Aime",
    "premium barbershop",
    "Tunis barber",
  ],
  authors: [{ name: "El Haj'Aime" }],
  openGraph: {
    title: "El Haj'Aime | Premium Barbershop in Tunis",
    description: "Precision Cuts, Tunisian Pride",
    type: "website",
    locale: "en_US",
    alternateLocale: "ar_TN",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: "width=device-width, initial-scale=1",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}

        {/* Hotjar */}
        {process.env.NEXT_PUBLIC_HOTJAR_ID && (
          <Script id="hotjar" strategy="afterInteractive">
            {`
              (function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:${process.env.NEXT_PUBLIC_HOTJAR_ID},hjsv:6};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                a.appendChild(r);
              })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `}
          </Script>
        )}

        {/* Schema.org Local Business */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "HairSalon",
              name: "El Haj'Aime",
              alternateName: "الحاج عايم",
              description: "Premium barbershop in Tunis, Tunisia",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Avenue Habib Bourguiba",
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
