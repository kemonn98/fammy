import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fammy",
    short_name: "Fammy",
    description: "Todo & agenda for couples",
    start_url: "/today",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#5b8a72",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
