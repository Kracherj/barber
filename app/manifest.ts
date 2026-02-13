import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "El Haj'Aime - Premium Barbershop",
    short_name: "El Haj'Aime",
    description: "Precision Cuts, Tunisian Pride. Premium barbershop in Tunis.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5dc",
    theme_color: "#1e3a8a",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
