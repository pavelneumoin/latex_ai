// Защита приватных роутов через NextAuth middleware.
// Незарегистрированный пользователь на /my, /dashboard, /settings, /billing → редирект на /login.

export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/my/:path*",
    "/settings/:path*",
    "/billing/:path*",
    "/api/worksheets/:path*",
    "/api/upload/:path*",
    "/api/billing/:path*",
  ],
};
