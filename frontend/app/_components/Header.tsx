"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/create", label: "Создать" },
  { href: "/upload", label: "Загрузить" },
  { href: "/templates", label: "Шаблоны" },
  { href: "/demo", label: "Пример" },
  { href: "/my", label: "Мои листы" },
  { href: "/check", label: "Проверка" },
  { href: "/marketplace", label: "Маркетплейс" },
  { href: "/pricing", label: "Тарифы" },
];

function Logo() {
  return (
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
      <span
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
          flex: "0 0 auto",
        }}
      >
        РЛ
      </span>
      <span>РабочийЛист.ai</span>
    </Link>
  );
}

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Закрываем меню при смене маршрута.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Esc закрывает, скролл body блокируется пока открыто.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  return (
    <header
      style={{
        height: 64,
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 clamp(16px, 4vw, 28px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24, minWidth: 0 }}>
        <Logo />
        <nav
          className="rl-desktop-only"
          style={{ display: "flex", alignItems: "center", gap: 4 }}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  color: active ? "var(--primary)" : "var(--fg-2)",
                  background: active ? "var(--primary-soft)" : "transparent",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop auth */}
      <div
        className="rl-desktop-only"
        style={{ display: "flex", alignItems: "center", gap: 10 }}
      >
        {status === "loading" ? (
          <span style={{ color: "var(--fg-3)", fontSize: 13 }}>…</span>
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

      {/* Mobile burger */}
      <button
        type="button"
        aria-label="Меню"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rl-mobile-only"
        style={{
          display: "none",
          width: 42,
          height: 42,
          borderRadius: 10,
          border: "1px solid var(--border)",
          background: "white",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flex: "0 0 auto",
        }}
      >
        <BurgerIcon open={open} />
      </button>

      {/* Mobile drawer overlay */}
      <div
        className="rl-mobile-only"
        onClick={() => setOpen(false)}
        aria-hidden={!open}
        style={{
          display: "none",
          position: "fixed",
          inset: 0,
          background: "rgba(15,23,42,0.45)",
          zIndex: 40,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Mobile drawer panel */}
      <aside
        className="rl-mobile-only"
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(330px, 88vw)",
          background: "var(--bg)",
          zIndex: 50,
          boxShadow: "var(--shadow-lg)",
          transform: open ? "translateX(0)" : "translateX(105%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            background: "var(--bg)",
          }}
        >
          <Logo />
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => setOpen(false)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "white",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              fontSize: 18,
              color: "var(--fg-2)",
            }}
          >
            ✕
          </button>
        </div>

        {/* Account block */}
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
          {session?.user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 999,
                  background: "var(--primary-soft)",
                  color: "var(--primary)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                  fontFamily: "var(--display)",
                  flex: "0 0 auto",
                }}
              >
                {initialsOf(session.user.name, session.user.email)}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {session.user.name || "Учитель"}
                </div>
                <div style={{ fontSize: 12, color: "var(--fg-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {session.user.email}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link
                href="/register"
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--accent-fg)",
                  background: "var(--accent)",
                  textAlign: "center",
                }}
              >
                Создать аккаунт
              </Link>
              <Link
                href="/login"
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--fg)",
                  border: "1px solid var(--border-2)",
                  background: "white",
                  textAlign: "center",
                }}
              >
                Войти
              </Link>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav style={{ display: "flex", flexDirection: "column", padding: "10px 12px", gap: 2 }}>
          {session?.user && (
            <Link href="/dashboard" style={mobileLinkStyle(isActive("/dashboard"))}>
              🏠 Кабинет
            </Link>
          )}
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} style={mobileLinkStyle(isActive(item.href))}>
              {item.label}
            </Link>
          ))}
          {session?.user && (
            <>
              <Link href="/settings" style={mobileLinkStyle(isActive("/settings"))}>
                Настройки
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{
                  ...mobileLinkStyle(false),
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  color: "var(--error)",
                  width: "100%",
                }}
              >
                Выйти
              </button>
            </>
          )}
        </nav>
      </aside>
    </header>
  );
}

function mobileLinkStyle(active: boolean): React.CSSProperties {
  return {
    display: "block",
    padding: "12px 14px",
    borderRadius: 10,
    textDecoration: "none",
    fontSize: 15,
    fontWeight: 600,
    color: active ? "var(--primary)" : "var(--fg)",
    background: active ? "var(--primary-soft)" : "transparent",
  };
}

function BurgerIcon({ open }: { open: boolean }) {
  return (
    <span
      style={{
        position: "relative",
        width: 20,
        height: 14,
        display: "inline-block",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: 0,
            height: 2,
            width: "100%",
            background: "var(--fg)",
            borderRadius: 2,
            transition: "transform 0.25s ease, opacity 0.25s ease, top 0.25s ease",
            top: open ? 6 : i * 6,
            transform: open
              ? i === 0
                ? "rotate(45deg)"
                : i === 2
                ? "rotate(-45deg)"
                : "scaleX(0)"
              : "none",
            opacity: open && i === 1 ? 0 : 1,
          }}
        />
      ))}
    </span>
  );
}
