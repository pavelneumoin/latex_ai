"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

function initialsOf(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase();
  }
  if (email) {
    return email[0]?.toUpperCase() ?? "?";
  }
  return "?";
}

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const navItems: { href: string; label: string }[] = [
    { href: "/create", label: "Создать" },
    { href: "/my", label: "Мои листы" },
    { href: "/marketplace", label: "Маркетплейс" },
    { href: "/pricing", label: "Тарифы" },
  ];

  return (
    <header
      style={{
        height: 64,
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "var(--fg)",
            fontFamily: "var(--display)",
            fontWeight: 700,
            fontSize: 17,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              background: "var(--primary)",
              borderRadius: 8,
              color: "white",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            РЛ
          </div>
          <span>РабочийЛист.ai</span>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  color: active ? "var(--primary)" : "var(--fg-2)",
                  background: active ? "var(--primary-soft)" : "transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {status === "loading" ? (
          <span style={{ color: "var(--fg-3)", fontSize: 13 }}>...</span>
        ) : session?.user ? (
          <>
            <Link
              href="/dashboard"
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--fg)",
                border: "1px solid var(--border-2)",
                background: "white",
              }}
            >
              Кабинет
            </Link>
            <Link
              href="/settings"
              title={session.user.email ?? ""}
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                background: "var(--primary-soft)",
                color: "var(--primary)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                fontFamily: "var(--display)",
              }}
            >
              {initialsOf(session.user.name, session.user.email)}
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                background: "transparent",
                border: "1px solid transparent",
                color: "var(--fg-3)",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Выйти
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--fg)",
                border: "1px solid var(--border-2)",
                background: "white",
              }}
            >
              Войти
            </Link>
            <Link
              href="/register"
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--accent-fg)",
                background: "var(--accent)",
              }}
            >
              Регистрация
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
