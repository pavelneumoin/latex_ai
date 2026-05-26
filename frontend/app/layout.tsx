import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./_components/AppProviders";

export const metadata: Metadata = {
  title: "РабочийЛист.ai — рабочий лист за минуту",
  description:
    "Сервис для учителей: опиши тему — нейросеть соберёт PDF рабочий лист с твоим лого. Печатай и веди урок.",
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
