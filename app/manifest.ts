import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nail Studio Manager",
    short_name: "Nails",
    description: "Prywatna aplikacja do zarzadzania wizytami stylistki paznokci.",
    start_url: "/appointments",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#f8fafc",
    lang: "pl-PL",
    categories: ["business", "productivity", "lifestyle"],
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
