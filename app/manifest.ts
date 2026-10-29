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
        src: "/icons/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/512x512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
