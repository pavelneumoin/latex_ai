import type { Metadata } from "next";
import "./globals.css";
import "./library.css";
import "./school-integration.css";
import "katex/dist/katex.min.css";
import { AppProviders } from "./_components/AppProviders";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3010";

export const metadata: Metadata = {
 metadataBase: new URL(SITE_URL),
 title: { default: "Неумошка — подготовься к уроку немножко", template: "%s" },
 description: "Готовые комплекты уроков математики и информатики: презентации, рабочие листы, домашние и проверочные работы. Выбирайте материалы по заданиям ЕГЭ.",
 openGraph: { type:"website",locale:"ru_RU",title:"Неумошка",description:"Подготовься к уроку немножко. Материалы для учителей математики и информатики." },
 robots: {index:process.env.NODE_ENV === "production",follow:process.env.NODE_ENV === "production"},
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="school-integrated">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
