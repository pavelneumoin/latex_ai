import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./_components/AppProviders";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rabochiilist.ru";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "РабочийЛист.ai — рабочий лист за минуту",
    template: "%s",
  },
  description:
    "Сервис для учителей: опиши тему или загрузи фото/PDF — нейросеть соберёт PDF рабочий лист с твоим лого. 45 шаблонов, экспорт в PDF/DOCX/LaTeX, автопроверка работ по фото.",
  keywords: [
    "рабочий лист",
    "генератор рабочих листов",
    "материалы для учителя",
    "математика",
    "информатика",
    "ОГЭ",
    "ЕГЭ",
    "автопроверка",
    "PDF для печати",
  ],
  authors: [{ name: "РабочийЛист.ai" }],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: "РабочийЛист.ai",
    title: "РабочийЛист.ai — рабочий лист за минуту",
    description:
      "Опиши тему или загрузи материал — получи готовый PDF рабочий лист с автопроверкой. 45 шаблонов, экспорт в PDF/DOCX/LaTeX.",
  },
  twitter: {
    card: "summary_large_image",
    title: "РабочийЛист.ai — рабочий лист за минуту",
    description:
      "Опиши тему — нейросеть соберёт PDF рабочий лист. 45 шаблонов, автопроверка работ по фото.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
