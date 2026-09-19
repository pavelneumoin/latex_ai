import type { MetadataRoute } from "next";

// PWA-манифест: позволяет «установить» Неумошка на телефон/десктоп
// как приложение (иконка на рабочем столе, запуск в отдельном окне).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Неумошка",
    short_name: "Неумошка",
    description:
      "Готовые материалы по математике и информатике. Подготовься к уроку немножко.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#286753",
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
