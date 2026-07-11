import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import { AppProviders } from "./_components/AppProviders";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rabochiilist.ru";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "РабочийЛист.ai — готовые уроки и автопроверка работ",
    template: "%s",
  },
  description:
    "Готовые комплекты уроков математики и информатики: презентация, рабочий лист, шпаргалка, ДЗ и зачёты. Кабинет учителя с автопроверкой работ, классами и PDF-отчётами. Подписка от 290 ₽, уроки от 0 ₽.",
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
    title: "РабочийЛист.ai — готовые уроки и автопроверка работ",
    description:
      "Комплекты уроков математики и информатики профессиональной вёрстки + кабинет с автопроверкой работ и красивыми отчётами. Уроки от 0 ₽.",
  },
  twitter: {
    card: "summary_large_image",
    title: "РабочийЛист.ai — готовые уроки и автопроверка работ",
    description:
      "Комплекты уроков математики и информатики + кабинет с автопроверкой работ и PDF-отчётами.",
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
