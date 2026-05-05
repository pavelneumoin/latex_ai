import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
