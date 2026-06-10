import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Monari - 우리 가족 금융 습관",
    short_name: "Monari",
    description: "약속, 용돈, 저축을 연결하는 어린이 금융교육 앱",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6f8",
    theme_color: "#25273a",
    orientation: "portrait",
    lang: "ko-KR",
    categories: ["finance", "education", "family"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
