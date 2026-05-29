import type { MetadataRoute } from "next";

// PWA-манифест: позволяет «установить» РабочийЛист.ai на телефон/десктоп
// как приложение (иконка на рабочем столе, запуск в отдельном окне).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "РабочийЛист.ai",
    short_name: "РабочийЛист",
    description:
      "Генератор рабочих листов для учителей: тема или фото → готовый PDF за минуту.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#1E40AF",
    lang: "ru",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
