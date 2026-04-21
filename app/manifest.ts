import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TCG Marketplace AR",
    short_name: "TCG AR",
    description:
      "Marketplace Pokemon-first para gestionar inventario, publicar y vender cartas.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5efdf",
    theme_color: "#0f7a66",
    lang: "es-AR",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}