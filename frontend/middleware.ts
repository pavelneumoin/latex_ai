// Защита приватных роутов через NextAuth middleware.
// UI кабинета редиректим на вход. API проверяют сессию внутри route handlers:
// это важно для публичного просмотра и экспорта опубликованных листов.

export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cabinet/:path*",
    "/my/:path*",
    "/settings/:path*",
    "/billing/:path*",
    "/api/upload/:path*",
    "/api/billing/:path*",
    "/api/classes/:path*",
    "/api/checks/:path*",
    "/api/reports/:path*",
  ],
};
