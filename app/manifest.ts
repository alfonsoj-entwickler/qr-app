import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QR Vault",
    short_name: "QR Vault",
    description:
      "Scan QR codes and barcodes, and create your own QR codes, right in your browser.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f5f8",
    theme_color: "#2e47f5",
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
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
