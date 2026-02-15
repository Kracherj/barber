import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Joseph Coiff - Coiffure Premium",
    short_name: "Joseph Coiff",
    description: "Coupes de précision, Fierté tunisienne. Salon de coiffure premium à Tunis.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5dc",
    theme_color: "#1e3a8a",
    icons: [
      {
        src: "/images/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
